'use client'
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  FetchUserGeneSetQuery,
  useEnrichmentQueryQuery,
  useFetchGeneInfoQuery,
  useFetchUserGeneSetQuery,
  useOverlapQueryQuery,
  useViewGeneSetQuery
} from '@/graphql';
import ensureArray from "@/utils/ensureArray";
import Loading from '@/components/loading';
import Pagination from '@/components/pagination';
import useQsState from '@/utils/useQsState';
import Stats from '../stats';
import Image from 'next/image';
import GeneSetModal from '@/components/geneSetModal';
import partition from '@/utils/partition';

const pageSize = 10;

type GeneSetModalT = {
  type: 'UserGeneSet',
  description: string,
  genes: string[],
} | {
  type: 'GeneSetOverlap',
  id: string,
  description: string,
  genes: string[]
} | {
  type: 'GeneSet',
  id: string,
  description: string,
} | undefined;

function description_markdown(text: string) {
  if (!text) return <span className="italic">No description found</span>;
  const m = /\*\*(.+?)\*\*/.exec(text);
  if (m) return (
    <>
      <span>{text.slice(0, m.index)}</span>
      <span className="font-bold italic">{m[1]}</span>
      <span>{text.slice(m.index + 4 + m[1].length)}</span>
    </>
  );
  return text;
}

const EnrichmentResults = React.memo(({ userGeneSet, setModalGeneSet }: { userGeneSet?: FetchUserGeneSetQuery, setModalGeneSet: React.Dispatch<React.SetStateAction<GeneSetModalT>> }) => {
  const genes = useMemo(() => 
    ensureArray(userGeneSet?.userGeneSet?.genes).filter((gene): gene is string => !!gene).map(gene => gene.toUpperCase()), 
    [userGeneSet]
  );

  const [queryString, setQueryString] = useQsState({ page: '1', q: '' });
  const [rawTerm, setRawTerm] = useState('');
  const [figImages, setFigImages] = useState<Record<string, string>>({});
  
  const { page, term } = useMemo(() => ({
    page: queryString.page ? +queryString.page : 1,
    term: queryString.q ?? ''
  }), [queryString]);

  const { data: enrichmentResults } = useEnrichmentQueryQuery({
    skip: genes.length === 0,
    variables: { genes, filterTerm: term, offset: (page - 1) * pageSize, first: pageSize },
  });

  useEffect(() => {
    setRawTerm(term);
  }, [term]);

  const handleSubmit = useCallback((evt: React.FormEvent) => {
    evt.preventDefault();
    setQueryString({ page: '1', q: rawTerm });
  }, [rawTerm, setQueryString]);

  const handleClear = useCallback(() => {
    setQueryString({ page: '1', q: '' });
  }, [setQueryString]);

  useEffect(() => {
    const fetchFigImages = async () => {
      const newFigImages: Record<string, string> = {};
      const fetchPromises = enrichmentResults?.currentBackground?.enrich?.nodes?.map(async (enrichmentResult) => {
        const pmcid_figure = enrichmentResult?.geneSets.nodes[0].term;
        try {
          const response = await fetch(`https://pfocr.wikipathways.org/figures/${pmcid_figure}.html`);
          const text = await response.text();
          const match = text.match(/<a[^>]+href="([^"]+)"/i);
          if (match && match[1]) {
            const figImg = match[1].split('__')[1].replace('.html', '');
            newFigImages[pmcid_figure ?? ''] = figImg;
          }
        } catch (error) {
          console.error(`Failed to fetch image for term ${pmcid_figure}:`, error);
        }
      });

      if (fetchPromises) {
        await Promise.all(fetchPromises);
        setFigImages(newFigImages);
      }
    };

    if (enrichmentResults?.currentBackground?.enrich) {
      fetchFigImages();
    }
  }, [enrichmentResults]);

  return (
    <div className="flex flex-col gap-2 my-2">
      <h2 className="text-md font-bold">
        {!enrichmentResults?.currentBackground?.enrich ?
          <>Rummaging through <Stats show_gene_sets />.</>
          : <>After rummaging through <Stats show_gene_sets />. PFOCRummage <Image className="inline-block rounded" src="/images/PFOCRummageBlack.png" width={50} height={100} alt="PFOCRummage"></Image> found {Intl.NumberFormat("en-US", {}).format(enrichmentResults?.currentBackground?.enrich?.totalCount || 0)} statistically significant matches.</>}
      </h2>
      <form
        className="join flex flex-row place-content-end place-items-center"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          className="input input-bordered join-item"
          value={rawTerm}
          onChange={evt => { setRawTerm(evt.currentTarget.value); }}
        />
        <div className="tooltip" data-tip="Search results">
          <button type="submit" className="btn join-item">&#x1F50D;</button>
        </div>
        <div className="tooltip" data-tip="Clear search">
          <button type="reset" className="btn join-item" onClick={handleClear}>&#x232B;</button>
        </div>
        <a href={`/enrich/download?dataset=${queryString.dataset}&q=${queryString.q}`} download="results.tsv">
          <div className="tooltip" data-tip="Download results">
            <button type="button" className="btn join-item font-bold text-2xl pb-1">&#x21E9;</button>
          </div>
        </a>
      </form>
      <div className="overflow-x-auto">
        <table className="table table-xs">
          <thead>
            <tr>
              <th>Paper</th>
              <th>Figure</th>
              <th>Thumbnail</th>
              <th>Title</th>
              <th>Description</th>
              <th>Gene Set Size</th>
              <th>Overlap</th>
              <th>Odds</th>
              <th>PValue</th>
              <th>AdjPValue</th>
            </tr>
          </thead>
          <tbody>
            {!enrichmentResults?.currentBackground?.enrich ?
              <tr>
                <td colSpan={7}><Loading /></td>
              </tr>
              : null}
            {enrichmentResults?.currentBackground?.enrich?.nodes?.map((enrichmentResult, genesetIndex) => {
              const pmcid_figure = enrichmentResult?.geneSets.nodes[0].term;
              const pmcid = pmcid_figure?.split('_')[0];
              const figure = pmcid_figure?.split('_')[2];
              const title = enrichmentResult?.geneSets.nodes[0].geneSetPmcsById.nodes[0].pmcInfoByPmcid?.title || '';
              const description = enrichmentResult?.geneSets.nodes[0].description;
              const nGeneIds = enrichmentResult?.geneSets.nodes[0].nGeneIds;
              const geneSetId = enrichmentResult?.geneSets.nodes[0].id;
              
              return (
                <tr key={`${genesetIndex}`} className="border-b-0">
                  <th>
                    <a className="underline cursor-pointer" href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`} target="_blank" rel="noreferrer">{pmcid}</a>
                  </th>
                  <th>
                    <a className="underline cursor-pointer" href={`https://pfocr.wikipathways.org/figures/${pmcid_figure}.html`} target="_blank" rel="noreferrer">{figure}</a>
                  </th>
                  <td>
                    <a href={`https://pfocr.wikipathways.org/figures/${pmcid_figure}.html`} target="_blank" rel="noreferrer">
                        {figImages[pmcid_figure ?? ''] ? (
                          <img src={`https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/bin/${figImages[pmcid_figure ?? '']}.jpg`} style={{ width: 'fit-content', height: '70px' }} />
                        ) : (
                          <Loading />
                        )}
                      </a>
                  </td>
                  <td>{title}</td>
                  <td>{description}</td>
                  <td>
                    <label htmlFor="geneSetModal" className="prose underline cursor-pointer" onClick={() => setModalGeneSet({ type: 'GeneSet', id: geneSetId, description: pmcid_figure ?? '' })}>{nGeneIds}</label>
                  </td>
                  <td className="whitespace-nowrap text-underline cursor-pointer">
                    <label htmlFor="geneSetModal" className="prose underline cursor-pointer" onClick={() => setModalGeneSet({ type: 'GeneSetOverlap', id: geneSetId, description: `${userGeneSet?.userGeneSet?.description || 'User gene set'} & ${pmcid_figure || 'PFOCR gene set'}`, genes })}>
                      {enrichmentResult?.nOverlap}
                    </label>
                  </td>
                  <td className="whitespace-nowrap">{enrichmentResult?.oddsRatio?.toPrecision(3)}</td>
                  <td className="whitespace-nowrap">{enrichmentResult?.pvalue?.toPrecision(3)}</td>
                  <td className="whitespace-nowrap">{enrichmentResult?.adjPvalue?.toPrecision(3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {enrichmentResults?.currentBackground?.enrich && (
        <div className="w-full flex flex-col items-center">
          <Pagination
            page={page}
            totalCount={enrichmentResults?.currentBackground?.enrich?.totalCount ?? 0}
            pageSize={pageSize}
            onChange={page => setQueryString({ page: `${page}`, q: term })}
          />
        </div>
      )}
    </div>
  );
});

const GeneSetModalWrapper = React.memo(({ modalGeneSet, setModalGeneSet }: { modalGeneSet: GeneSetModalT, setModalGeneSet: React.Dispatch<React.SetStateAction<GeneSetModalT>> }) => {
  const { data: geneSet } = useViewGeneSetQuery({
    skip: modalGeneSet?.type !== 'GeneSet',
    variables: modalGeneSet?.type === 'GeneSet' ? { id: modalGeneSet.id } : undefined,
  });
  
  const { data: overlap } = useOverlapQueryQuery({
    skip: modalGeneSet?.type !== 'GeneSetOverlap',
    variables: modalGeneSet?.type === 'GeneSetOverlap' ? { id: modalGeneSet.id, genes: modalGeneSet?.genes } : undefined,
  });

  const { data: userGeneSet } = useFetchGeneInfoQuery({
    skip: modalGeneSet?.type !== 'UserGeneSet',
    variables: modalGeneSet?.type === 'UserGeneSet' ? { genes: modalGeneSet.genes } : undefined,
  });

  return (
    <GeneSetModal
      showModal={modalGeneSet !== undefined}
      term={modalGeneSet?.description}
      geneset={
        modalGeneSet?.type === 'GeneSet' ? geneSet?.geneSet?.genes.nodes
          : modalGeneSet?.type === 'GeneSetOverlap' ? overlap?.geneSet?.overlap.nodes
          : modalGeneSet?.type === 'UserGeneSet' ? userGeneSet?.geneMap2?.nodes.map(({ gene, geneInfo }) => ({ gene, ...geneInfo }))
          : undefined
      }
      setShowModal={show => {
        if (!show) setModalGeneSet(undefined);
      }}
    />
  );
});

const EnrichClientPage = React.memo(({ searchParams }: { searchParams: { dataset: string | string[] | undefined } }) => {
  const dataset = ensureArray(searchParams.dataset)[0];
  const { data: userGeneSet } = useFetchUserGeneSetQuery({
    skip: !dataset,
    variables: { id: dataset },
  });

  const [modalGeneSet, setModalGeneSet] = useState<GeneSetModalT>();

  return (
    <>
      <div className="flex flex-row gap-2 alert">
        <span className="prose">Input:</span>
        <label
          htmlFor="geneSetModal"
          className="prose underline cursor-pointer"
          onClick={() => setModalGeneSet({
            type: 'UserGeneSet',
            genes: (userGeneSet?.userGeneSet?.genes ?? []).filter((gene): gene is string => !!gene),
            description: userGeneSet?.userGeneSet?.description || 'Gene set',
          })}
        >
          {userGeneSet?.userGeneSet?.description || 'Gene set'}
          {userGeneSet ? <> ({userGeneSet?.userGeneSet?.genes?.length ?? '?'} genes)</> : null}
        </label>
      </div>
      <EnrichmentResults userGeneSet={userGeneSet} setModalGeneSet={setModalGeneSet} />
      <GeneSetModalWrapper modalGeneSet={modalGeneSet} setModalGeneSet={setModalGeneSet} />
    </>
  );
});

export default EnrichClientPage;
