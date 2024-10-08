'use client'
import React from 'react'
import {
  FetchUserGeneSetQuery,
  useEnrichmentQueryQuery,
  useFetchGeneInfoQuery,
  useFetchUserGeneSetQuery,
  useOverlapQueryQuery,
  useViewGeneSetQuery
} from '@/graphql'
import ensureArray from "@/utils/ensureArray"
import Loading from '@/components/loading'
import Pagination from '@/components/pagination'
import useQsState from '@/utils/useQsState'
import Stats from '../stats'
import Image from 'next/image'
import GeneSetModal from '@/components/geneSetModal'
import partition from '@/utils/partition'

const pageSize = 10

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
} | undefined

function description_markdown(text: string) {
  if (!text) return <span className="italic">No description found</span>
  const m = /\*\*(.+?)\*\*/.exec(text)
  if (m) return <><span>{text.slice(0, m.index)}</span><span className="font-bold italic">{m[1]}</span><span>{text.slice(m.index + 4 + m[1].length)}</span></>
  return text
}

function Breakable(props: { children: string }) {
  return props.children.split('_').map((part, i) => <React.Fragment key={i}>{(i === 0 ? '' : '_') + part}<wbr /></React.Fragment>)
}

function EnrichmentResults({ userGeneSet, setModalGeneSet }: { userGeneSet?: FetchUserGeneSetQuery, setModalGeneSet: React.Dispatch<React.SetStateAction<GeneSetModalT>> }) {
  const genes = React.useMemo(() =>
    ensureArray(userGeneSet?.userGeneSet?.genes).filter((gene): gene is string => !!gene).map(gene => gene.toUpperCase()),
    [userGeneSet]
  )
  const [queryString, setQueryString] = useQsState({ page:  '1', q: '' })
  const [rawTerm, setRawTerm] = React.useState('')
  const { page, term } = React.useMemo(() => ({ page: queryString.page ? +queryString.page : 1, term: queryString.q ?? '' }), [queryString])
  const { data: enrichmentResults } = useEnrichmentQueryQuery({
    skip: genes.length === 0,
    variables: { genes, filterTerm: term, offset: (page-1)*pageSize, first: pageSize },
  })
  React.useEffect(() => {setRawTerm(term)}, [term])
  return (
    <div className="flex flex-col gap-2 my-2">
      <h2 className="text-md font-bold">
        {!enrichmentResults?.currentBackground?.enrich ?
          <>Rummaging through <Stats show_gene_sets />.</>
          : <>After rummaging through <Stats show_gene_sets />. PFOCRummage <Image className="inline-block rounded" src="/images/PFOCRummageBlack.png" width={50} height={100} alt="PFOCRummage"></Image> found {Intl.NumberFormat("en-US", {}).format(enrichmentResults?.currentBackground?.enrich?.totalCount || 0)} statistically significant matches.</>}
      </h2>
      <form
        className="join flex flex-row place-content-end place-items-center"
        onSubmit={evt => {
          evt.preventDefault()
          setQueryString({ page: '1', q: rawTerm })
        }}
      >
        <input
          type="text"
          className="input input-bordered join-item"
          value={rawTerm}
          onChange={evt => {setRawTerm(evt.currentTarget.value)}}
        />
        <div className="tooltip" data-tip="Search results">
          <button
            type="submit"
            className="btn join-item"
          >&#x1F50D;</button>
        </div>
        <div className="tooltip" data-tip="Clear search">
          <button
            type="reset"
            className="btn join-item"
            onClick={evt => {
              setQueryString({ page: '1', q: '' })
            }}
          >&#x232B;</button>
        </div>
        <a href={`/enrich/download?dataset=${queryString.dataset}&q=${queryString.q}`} download="results.tsv">
          <div className="tooltip" data-tip="Download results">
            <button
              type="button"
              className="btn join-item font-bold text-2xl pb-1"
            >&#x21E9;</button>
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
            {enrichmentResults?.currentBackground?.enrich?.nodes?.flatMap(async (enrichmentResult, genesetIndex) => {
              if (!enrichmentResult?.geneSets) return null
              const pmcid_figure = enrichmentResult.geneSets.nodes[0].term
              const pmcid = pmcid_figure.split('_')[0]
              const figure = pmcid_figure.split('_')[2]
              const title = enrichmentResult.geneSets.nodes[0].geneSetPmcsById.nodes[0].pmcInfoByPmcid?.title || ''
              const description = enrichmentResult.geneSets.nodes[0].description
              const nGeneIds = enrichmentResult.geneSets.nodes[0].nGeneIds
              const geneSetId = enrichmentResult.geneSets.nodes[0].id
              const figImg = await fetch(`https://pfocr.wikipathways.org/figures/${pmcid_figure}.html`)
              .then(response => response.text())
              .then(text => {
                let regex = /<a[^>]+href="([^"]+)"/i;

                let match = text.match(regex);

                // Extract the content
                if (match && match[1]) {
                  return match[1];
                } else return ''
            })


              return (
                    <tr key={`${genesetIndex}`} className="border-b-0">
                      <th>
                          <a
                            className="underline cursor-pointer"
                            href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`}
                            target="_blank"
                            rel="noreferrer"
                          >{pmcid}</a>
                        </th>
                        <th>
                          <a
                            className="underline cursor-pointer"
                            href={`https://pfocr.wikipathways.org/figures/${pmcid_figure}.html`}
                            target="_blank"
                            rel="noreferrer"
                          >{figure}</a>
                        </th>
                        <td>
                        <a
                            className="underline cursor-pointer"
                            href={`https://pfocr.wikipathways.org/figures/${pmcid_figure}.html`}
                            target="_blank"
                            rel="noreferrer"
                          ><img src={`https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/bin/${figImg.split('__')[1].replace('.html', '')}.jpg`} style={{ width: 'fit-content', height: '70px', alignContent: 'center', margin: 'auto'}} /></a>
                        </td>
                        <td>
                          {title}
                        </td>
                        <td>
                          {description}
                        </td>
                        <td>
                          <label
                            htmlFor="geneSetModal"
                            className="prose underline cursor-pointer"
                            onClick={evt => {
                              setModalGeneSet({
                                type: 'GeneSet',
                                id: geneSetId,
                                description: pmcid_figure ?? '',
                              })
                            }}
                          >{nGeneIds}</label>
                        </td>
                        <td className="whitespace-nowrap text-underline cursor-pointer">
                            <label
                              htmlFor="geneSetModal"
                              className="prose underline cursor-pointer"
                              onClick={evt => {
                                setModalGeneSet({
                                  type: 'GeneSetOverlap',
                                  id: geneSetId,
                                  description: `${userGeneSet?.userGeneSet?.description || 'User gene set'} & ${pmcid_figure || 'PFOCR gene set'}`,
                                  genes,
                                })
                              }}
                            >{enrichmentResult?.nOverlap}</label>
                          </td>
                          <td className="whitespace-nowrap">{enrichmentResult?.oddsRatio?.toPrecision(3)}</td>
                          <td className="whitespace-nowrap">{enrichmentResult?.pvalue?.toPrecision(3)}</td>
                          <td className="whitespace-nowrap">{enrichmentResult?.adjPvalue?.toPrecision(3)}</td>
                      </tr>)
            }
          )
        }
          </tbody>
        </table>
      </div>
      {enrichmentResults?.currentBackground?.enrich ?
        <div className="w-full flex flex-col items-center">
          <Pagination
            page={page}
            totalCount={enrichmentResults?.currentBackground?.enrich?.totalCount ? enrichmentResults?.currentBackground?.enrich.totalCount : undefined}
            pageSize={pageSize}
            onChange={page => {
              setQueryString({ page: `${page}`, q: term })
            }}
          />
        </div>
      : null}
    </div>
  )
}

function GeneSetModalWrapper(props: { modalGeneSet: GeneSetModalT, setModalGeneSet: React.Dispatch<React.SetStateAction<GeneSetModalT>> }) {
  const { data: geneSet } = useViewGeneSetQuery({
    skip: props.modalGeneSet?.type !== 'GeneSet',
    variables: props.modalGeneSet?.type === 'GeneSet' ? {
      id: props.modalGeneSet.id,
    } : undefined
  })
  const { data: overlap } = useOverlapQueryQuery({
    skip: props.modalGeneSet?.type !== 'GeneSetOverlap',
    variables: props.modalGeneSet?.type === 'GeneSetOverlap' ?  {
      id: props.modalGeneSet.id,
      genes: props.modalGeneSet?.genes,
    } : undefined,
  })
  const { data: userGeneSet } = useFetchGeneInfoQuery({
    skip: props.modalGeneSet?.type !== 'UserGeneSet',
    variables: props.modalGeneSet?.type === 'UserGeneSet' ? {
      genes: props.modalGeneSet.genes,
    } : undefined,
  })
  return (
    <GeneSetModal
      showModal={props.modalGeneSet !== undefined}
      term={props.modalGeneSet?.description}
      geneset={
        props.modalGeneSet?.type === 'GeneSet' ? geneSet?.geneSet?.genes.nodes
        : props.modalGeneSet?.type === 'GeneSetOverlap' ? overlap?.geneSet?.overlap.nodes
        : props.modalGeneSet?.type === 'UserGeneSet' ?
          userGeneSet?.geneMap2?.nodes ? userGeneSet.geneMap2.nodes.map(({ gene, geneInfo }) => ({gene, ...geneInfo}))
          : props.modalGeneSet.genes.map(symbol => ({ symbol }))
        : undefined
      }
      setShowModal={show => {
        if (!show) props.setModalGeneSet(undefined)
      }}
    />
  )
}

export default function EnrichClientPage({
  searchParams
}: {
  searchParams: {
    dataset: string | string[] | undefined
  },
}) {
  const dataset = ensureArray(searchParams.dataset)[0]
  const { data: userGeneSet } = useFetchUserGeneSetQuery({
    skip: !dataset,
    variables: { id: dataset },
  })
  const [modalGeneSet, setModalGeneSet] = React.useState<GeneSetModalT>()
  return (
    <>
      <div className="flex flex-row gap-2 alert">
        <span className="prose">Input:</span>
        <label
          htmlFor="geneSetModal"
          className="prose underline cursor-pointer"
          onClick={evt => {
            setModalGeneSet({
              type: 'UserGeneSet',
              genes: (userGeneSet?.userGeneSet?.genes ?? []).filter((gene): gene is string => !!gene),
              description: userGeneSet?.userGeneSet?.description || 'Gene set',
            })
          }}
        >{userGeneSet?.userGeneSet?.description || 'Gene set'}{userGeneSet ? <> ({userGeneSet?.userGeneSet?.genes?.length ?? '?'} genes)</> : null}</label>
      </div>
      <EnrichmentResults userGeneSet={userGeneSet} setModalGeneSet={setModalGeneSet} />
      <GeneSetModalWrapper modalGeneSet={modalGeneSet} setModalGeneSet={setModalGeneSet} />
    </>
  )
}
