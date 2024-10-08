import click
from pathlib import Path
from helper.cli import cli
from maayanlab_bioinformatics.harmonization import ncbi_genes_lookup

lookup = ncbi_genes_lookup(filters=None)


def unique(L):
  S = set()
  L_ = []
  for el in L:
    if el in S: continue
    S.add(el)
    L_.append(el)
  return L_

@cli.command()
@click.option('-i', '--input', type=click.Path(exists=True, file_okay=True, path_type=Path), help='GMT file to clean')
@click.option('-o', '--output', type=click.Path(path_type=Path), help='Output location')
def clean(input, output):
  import re
  def gene_lookup(value):
    '''  match entrez ids
    '''
    if lookup(value) is None: return value
    return lookup(value)

  terms = set()
  with input.open('r') as fr:
    with output.open('w') as fw:
      for line in filter(None, map(str.strip, fr)):
        try:
          term, desc, *geneset = line.split('\t')
          geneset_mapped = unique([gene_mapped for gene in geneset for gene_mapped in (gene_lookup(gene),) if gene_mapped])
          if (
            len(geneset_mapped) >= 5
            and len(geneset_mapped) < 2500
            and len(term) < 200
            and term not in terms
          ):
            terms.add(term)
            print(
              term, desc,
              *geneset_mapped,
              sep='\t',
              file=fw,
            )
        except Exception as e:
          print('Error processing', e, line)
