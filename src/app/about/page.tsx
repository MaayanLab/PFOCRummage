import React from 'react'
import Image from "next/image"
import Stats from "../stats"
import Link from "next/link"
import { Metadata, ResolvingMetadata } from 'next'

export async function generateMetadata(props: {}, parent: ResolvingMetadata): Promise<Metadata> {
  const parentMetadata = await parent
  return {
    title: `${parentMetadata.title?.absolute} | About`,
    keywords: parentMetadata.keywords,
  }
}

export default async function About() {
  return (
    <div className="prose">
      
      <div className="flex">
        
        <div className="flex-col justify-center mx-auto">
        <h2 className="title text-xl font-medium mb-3">About PFOCRummage</h2>
        <Image className={'rounded float-right ml-5'} src={'/images/PFOCRummageBlack.png'} width={250} height={250} alt={'PFOCRummage'}></Image>
          <p className="text-justify max-w-5xl">
          Biochemistry, molecular biology, pharmacology, and cell biology research papers commonly contain pathway diagrams. These diagrams capture the relationships between genes, cells, diseases, metabolites, drugs, cellular comportments, and other relevant terms. 
          The <a  className='underline cursor' href='https://pfocr.wikipathways.org/' target='_blank'>Pathway Figure Optical Character Recognition (PFOCR)</a> 
          <span> </span>is a open science initiative which extracts gene sets from published articles in PubMed Central (PMC). So far, PFOCR extracted <Stats show_gene_sets bold /> from pathway diagrams contained in <Stats show_pmcs bold />.
          PFOCRummage serves these gene set for enrichment analysis, free text, and term search. Users of PFOCRummage can submit their own gene sets to find matching gene sets ranked by their overlap with the query gene set.
          </p>

          
          <img className='mx-auto m-5 border-2 border-slate-400' src='/images/PFOCRummage_UMAP.svg' width={700} height={400} alt='PFOCR UMAP'></img>
          <br></br>
          <p>
            This database is updated monthly to use the latest human release of <a className='underline cursor' href='https://data.wikipathways.org/pfocr/current' target='_blank'>PFOCR</a>.
          </p>
          <br />
          <p>
            This site is programmatically accessible via a <Link href="/graphiql" className="underline cursor-pointer" target="_blank">GraphQL API</Link>.
          </p>
          <br />
          <p>
          This site is based on the <a className='underline cursor' href="https://rummagene.com" target="_blank">Rummagene</a> framework developed by <a className='underline cursor' href="https://labs.icahn.mssm.edu/maayanlab/">the Ma&apos;ayan Lab</a>
          </p>
        </div>
       
      </div>
      
    </div>
  )
}
