# PFOCRummag Bot

This contains the code for downloading the latest human gene set library release from the Wikipathways monthly release archive, extracting gene sets, and loading them into the PFOCRummage database.

## Details
- `download_extract.py`: simply checks the Wikipathways download page, and searches the table for a new human entry: https://data.wikipathways.org/pfocr/current/.
- `python -m helper *` is used to ingest the output of `download_extract.py` into the PFOCRummage database, and produce any additional supplemental tables
- `bot.sh` is the cron-job script, executed weekly to incrementally update the PFOCRummage database
