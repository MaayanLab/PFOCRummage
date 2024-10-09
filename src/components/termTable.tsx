import React, { useEffect, useState } from 'react';
import { useViewGeneSetQuery } from '@/graphql';
import GeneSetModal from '@/components/geneSetModal';
import useQsState from '@/utils/useQsState';
import Pagination from '@/components/pagination';
import blobTsv from '@/utils/blobTsv';
import clientDownloadBlob from '@/utils/clientDownloadBlob';

const pageSize = 10;

export default function TermTable({ terms }: { terms: any[] }) {
  const [queryString, setQueryString] = useQsState({ page: '1', f: '' });
  const [rawFilter, setRawFilter] = useState('');

  const { page, searchTerm } = React.useMemo(() => ({
    page: queryString.page ? +queryString.page : 1,
    searchTerm: queryString.f ?? ''
  }), [queryString]);

  const dataFiltered = React.useMemo(() => {
    return terms.filter(el => el?.description?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [terms, searchTerm]);

  const handleSearch = React.useCallback((value: string) => {
    setRawFilter(value);
  }, []);

  const handleSearchSubmit = React.useCallback((evt: any) => {
    evt.preventDefault();
    setQueryString({ page: '1', f: rawFilter });
  }, [rawFilter, setQueryString]);

  const handleClearSearch = React.useCallback(() => {
    setQueryString({ page: '1', f: '' });
    setRawFilter('');
  }, [setQueryString]);

  const [geneSetId, setGeneSetId] = useState(terms[0]?.id);
  const [currTerm, setCurrTerm] = useState(terms[0]?.term);
  const [showModal, setShowModal] = useState(false);

  const handleShowModal = React.useCallback(() => setShowModal(true), []);
  const handleHideModal = React.useCallback(() => setShowModal(false), []);

  const genesQuery = useViewGeneSetQuery({
    variables: { id: geneSetId },
  });

  // State to store figure images
  const [figImages, setFigImages] = useState<Record<string, string>>({});

  // Fetch images for all terms when the component mounts or terms change
  useEffect(() => {
    const fetchImages = async () => {
      const newFigImages: Record<string, string> = {};
      await Promise.all(
        terms.map(async (el) => {
          if (el?.term) {
            try {
              const response = await fetch(`https://pfocr.wikipathways.org/figures/${el?.term}.html`);
              const text = await response.text();
              const match = text.match(/<a[^>]+href="([^"]+)"/i);
              if (match && match[1]) {
                newFigImages[el.term] = match[1];
              }
            } catch (error) {
              console.error(`Failed to fetch image for term ${el.term}:`, error);
            }
          }
        })
      );
      setFigImages(newFigImages);
    };

    fetchImages();
  }, [terms]);

  return (
    <>
      <GeneSetModal
        geneset={genesQuery?.data?.geneSet?.genes.nodes}
        term={currTerm}
        showModal={showModal}
        setShowModal={handleHideModal}
      />
      <div className='m-5 mt-1'>
        <div className='join flex flex-row place-content-end items-center pt-3 pr-3'>
          <span className="label-text text-base">Search:&nbsp;</span>
          <form className='flex flex-row' onSubmit={handleSearchSubmit}>
            <input
              type="text"
              className="input input-bordered"
              value={rawFilter}
              onChange={(evt) => handleSearch(evt.target.value)}
            />
            <div className="tooltip" data-tip="Search results">
              <button type="submit" className="btn join-item">&#x1F50D;</button>
            </div>
          </form>
          <div className="tooltip" data-tip="Clear search">
            <button className="btn join-item" onClick={handleClearSearch}>&#x232B;</button>
          </div>
          <div className="tooltip" data-tip="Download results">
            <button
              className="btn join-item font-bold text-2xl pb-1"
              onClick={() => {
                if (!dataFiltered || dataFiltered.length === 0) return; // Prevent download if no results
                const blob = blobTsv(['term', 'nGenes'], dataFiltered, item => ({
                  term: item.term,
                  nGenes: item.nGeneIds,
                }));
                clientDownloadBlob(blob, 'results.tsv');
              }}
            >&#x21E9;</button>
          </div>
        </div>

        {dataFiltered.length === 0 ? (
          <div className="text-center mt-5">
            <p>No results found for your search.</p>
          </div>
        ) : (
          <table className="table table-xs table-pin-cols table-auto">
            <thead>
              <tr>
                <td>Term</td>
                <td>Figure</td>
                <td>Thumbnail</td>
                <td>Description</td>
                <td>Gene Set</td>
              </tr>
            </thead>
            <tbody>
              {dataFiltered?.slice((page - 1) * pageSize, page * pageSize).map(el => {
                const pmcid = el?.term?.split('_')[0];
                const figure = el?.term?.split('_')[2];
                const description = el?.description;

                return (
                  <tr key={el?.term}>
                    <td>
                      <a
                        className="underline cursor-pointer"
                        href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`}
                        target="_blank"
                        rel="noreferrer"
                      >{pmcid}</a>
                    </td>
                    <td>
                      <a
                        className="underline cursor-pointer"
                        href={`https://pfocr.wikipathways.org/figures/${el?.term}.html`}
                        target="_blank"
                        rel="noreferrer"
                      >{figure}</a>
                    </td>
                    <td>
                      <a
                        className="underline cursor-pointer"
                        href={`https://pfocr.wikipathways.org/figures/${el?.term}.html`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {figImages[el?.term] && (
                          <img
                            src={`https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/bin/${figImages[el?.term]?.split('__')[1]?.replace('.html', '')}.jpg`}
                            style={{ width: 'fit-content', height: '70px', margin: 'auto' }}
                          />
                        )}
                      </a>
                    </td>
                    <td>{description}</td>
                    <td className='w-3/12'>
                      <button
                        className='btn btn-xs btn-outline'
                        onClick={() => {
                          setCurrTerm(el?.term || '');
                          setGeneSetId(el?.id || '');
                          handleShowModal();
                        }}
                      >
                        View Gene Set ({el?.nGeneIds})
                      </button>
                    </td>
                  </tr>
                );
              })}
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
