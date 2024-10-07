# PFCORummage

<https://PFCORummage.maayanlab.cloud/>

This is a webserver for gene set enrichment analysis on a very large gene set -- one constructed from the . The [bot](https://github.com/MaayanLab/rummagene/tree/main/bot) does the monthly update from the [WikiPathways PFOCR releases](https://data.wikipathways.org/pfocr/current/).

## Development
Rather than splitting up the meta and data APIs, all functionality is incorporated into a postgres database.

We use postgraphile to serve the database on a graphql endpoint -- this endpoint can then be used for all necessary functionality, including both metadata search, filtering, and enrichment analysis. For speed purposes, enrichment is done through a companion API written in rust, the database itself communicates with this API, it is transparent to the application or users of the database.

### Usage
```bash
# prepare environment variables
cp .env.example .env
# review & edit .env

# start db
docker-compose up -d postgres

# create db/ensure it's fully migrated
dbmate up

# start companion API
docker-compose up -d enrich

# start app (production)
docker-compose up -d app
# start app (development)
npm run dev
```

### Provisioning
```bash
PYTHONPATH=bot python -m helper ingest -i your-gmt.gmt
PYTHONPATH=bot python -m helper ingest-paper-info
PYTHONPATH=bot python -m helper ingest-gene-info
```

### Writing Queries
See `src/graphql/core.graphql`
These can be tested/developed at <http://localhost:3000/graphiql>
