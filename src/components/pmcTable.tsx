import React from 'react';
import LinkedTerm from '@/components/linkedTerm';
import { useViewGeneSetQuery } from '@/graphql';
import GeneSetModal from '@/components/geneSetModal';
import useQsState from '@/utils/useQsState';
import Pagination from '@/components/pagination';
import blobTsv from '@/utils/blobTsv';
import clientDownloadBlob from '@/utils/clientDownloadBlob';

const pageSize = 10;

interface pmcData {
  __typename?: "PmcInfo" | undefined;
  pmcid: string;
  title?: string | null | undefined;
  yr?: number | null | undefined;
  doi?: string | null | undefined;
}

export default function PmcTable({ terms, data, gene_set_ids }: { terms?: Map<string, string[]>, data?: pmcData[], gene_set_ids?: Map<string, string[]> }) {
  const [queryString, setQueryString] = useQsState({ page: '1', f: '' });
  const { page, searchTerm } = React.useMemo(() => ({
    page: queryString.page ? +queryString.page : 1,
    searchTerm: queryString.f ?? ''
  }), [queryString]);

  const dataFiltered = React.useMemo(() =>
    data?.filter(el => {
      const rowToSearch = el?.title + (terms?.get(el?.pmcid)?.join(' ') || '');
      return (rowToSearch?.toLowerCase().includes(searchTerm.toLowerCase()));
    }),
  [data, terms, searchTerm]);

  const [geneSetId, setGeneSetId] = React.useState<string | null>(gene_set_ids?.values().next().value?.at(0) || '');
  const [currTerm, setCurrTerm] = React.useState<string | null>(gene_set_ids?.keys().next().value?.at(0) || '');
  const [showModal, setShowModal] = React.useState(false);
  const genesQuery = useViewGeneSetQuery({ variables: { id: geneSetId } });

  const [figImages, setFigImages] = React.useState<Record<string, string>>({});
  // Fetch image URLs based on searchTerm
  React.useEffect(() => {
    const fetchImages = async () => {
      const newFigImages: Record<string, string> = {};
      await Promise.all(
        Array.from(terms?.values() || []).map(async (el) => {
          if (el[0]) {
            try {
              const response = await fetch(`https://pfocr.wikipathways.org/figures/${el[0]}.html`);
              const text = await response.text();
              const match = text.match(/<a[^>]+href="([^"]+)"/i);
              if (match && match[1]) {
                newFigImages[el[0]] = match[1];
              }
            } catch (error) {
              console.error(`Failed to fetch image for term ${el}:`, error);
            }
          }
        })
      );
      setFigImages(newFigImages);
    };

    fetchImages();
  }, [terms]);// This now depends on searchTerm
  return (
    <>
      <GeneSetModal geneset={genesQuery?.data?.geneSet?.genes.nodes} term={currTerm} showModal={showModal} setShowModal={setShowModal}></GeneSetModal>
      <div className='m-5 mt-1'>
        <div className='join flex flex-row place-content-end items-center pt-3 pr-3'>
          <span className="label-text text-base">Search:&nbsp;</span>
          <input
            type="text"
            className="input input-bordered"
            value={searchTerm}
            onChange={evt => setQueryString({ page: '1', f: evt.currentTarget.value })}
          />
          <div className="tooltip" data-tip="Search results">
            <button type="submit" className="btn join-item">&#x1F50D;</button>
          </div>
          <div className="tooltip" data-tip="Clear search">
            <button
              type="reset"
              className="btn join-item"
              onClick={() => setQueryString({ page: '1', f: '' })}
            >&#x232B;</button>
          </div>
          <div className="tooltip" data-tip="Download results">
            <button
              type="button"
              className="btn join-item font-bold text-2xl pb-1"
              onClick={() => {
                if (!dataFiltered || dataFiltered.length === 0) return; // Prevent download if no results
                const blob = blobTsv(['pmcid', 'title', 'year', 'doi', 'terms'], dataFiltered, item => ({
                  pmcid: item.pmcid,
                  title: item.title,
                  year: item.yr,
                  doi: item.doi,
                  terms: terms?.get(item.pmcid)?.join(' ')
                }));
                clientDownloadBlob(blob, 'results.tsv');
              }}
            >&#x21E9;</button>
          </div>
        </div>

        {dataFiltered?.length === 0 ? (
          <div className="text-center mt-5">
            <p>No results found for your search.</p>
          </div>
        ) : (
          <table className="table table-xs table-pin-rows table-pin-cols table-auto">
            <thead>
              <tr className='bg-transparent'>
                <th className='bg-transparent'>PMC</th>
                <th className='bg-transparent'>Title</th>
                <th className="w-20 bg-transparent">Year</th>
                <th className='bg-transparent'># Terms</th>
                <th className='bg-transparent'></th>
              </tr>
            </thead>
            <tbody>
              {dataFiltered?.slice((page - 1) * pageSize, page * pageSize).map(el => (
                <React.Fragment key={el?.pmcid}>
                  <tr>
                    <td><LinkedTerm term={`${el?.pmcid} `}></LinkedTerm></td>
                    <td>{el?.title}</td>
                    <td>{el?.yr}</td>
                    <td>{terms?.get(el?.pmcid)?.length}</td>
                    <td className='align-text-middle'>
                      <button onClick={() => terms?.get(el?.pmcid)?.forEach(term => document.getElementById(term)?.classList.toggle('hidden'))}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                  {terms?.get(el?.pmcid)?.map(term => {
                    const pmcid = term.split('_')[0];
                    const figure = term.split('_')[2];
                    const figImg = figImages[term]; // Access the fetched image here

                    return (
                      <tr key={term} id={term} className='hidden'>
                        <td colSpan={1}>
                          <a
                            className="underline cursor-pointer"
                            href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`}
                            target="_blank"
                            rel="noreferrer"
                          >{pmcid}</a>
                        </td>
                        <td colSpan={1}>{gene_set_ids?.get(term)?.at(1)}</td>
                        <td colSpan={1}>
                          <a
                            className="underline cursor-pointer"
                            href={`https://pfocr.wikipathways.org/figures/${term}.html`}
                            target="_blank"
                            rel="noreferrer"
                          >{figure}</a>
                        </td>
                        <td colSpan={3} className='text-left'>
                          <a
                            className="underline cursor-pointer"
                            href={`https://pfocr.wikipathways.org/figures/${term}.html`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            
                            {figImg && (
                          <img
                            src={`https://europepmc.org/articles/${pmcid}/bin/${figImg?.split('__')[1]?.replace('.html', '')}.jpg`}
                            style={{ width: 'fit-content', height: '70px', margin: 'auto' }}
                          />
                        )}
                            
                          </a>
                        </td>
                        <td colSpan={2}>
                          <button
                            className='btn btn-xs btn-outline p-2 h-auto'
                            onClick={() => {
                              setCurrTerm(term);
                              setGeneSetId(gene_set_ids?.get(term)?.at(0) || '');
                              setShowModal(true);
                            }}
                          >
                            <p>View Gene Set ({gene_set_ids?.get(term)?.at(2) || 'n'})</p>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex flex-col items-center">
        <Pagination
          page={page}
          pageSize={pageSize}
          totalCount={dataFiltered?.length}
          onChange={newPage => setQueryString({ page: `${newPage}` })}
        />
      </div>
    </>
  );
}
