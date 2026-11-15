# CivicLens source expansion plan

Last reviewed: 2026-11-15

## North star

CivicLens is a public information platform for Nigeria: searchable primary-source documents, structured datasets and indicators, charts, and AI-assisted explanations that cite the underlying evidence.

The ingestion system checks sources daily, while each source is fetched or processed according to its real publication cadence. A daily check must not imply that monthly or quarterly data has been updated.

## Current source inventory

The NocoDB `Sources` table contains 144 entries:

- 131 are marked `DOCUMENTS`; 13 are marked `DATASET`.
- 5 sources are active and 5 have `method_verified=yes`; 139 are inactive/unverified.
- Priority is 3 wave-0, 9 wave-1, 22 wave-2, and 110 wave-3 entries.
- Declared collection methods: 54 `HTML_SCRAPE`, 44 `UNKNOWN`, 22 `RESEARCH_PORTAL`, 8 `API`, 6 `PDF_ARCHIVE`, 5 `REPOSITORY`, and 5 `BULK_DOWNLOAD`.

The `source health` table currently has 144 checks, all with a populated `source_id`; each ID matches a record in `Sources`. After correcting the World Bank API URL, the current status breakdown is 113 `OK`, 20 `DOWN`, 7 `BLOCKED`, 2 `NOT_FOUND`, 1 `SERVER_ERROR`, and 1 `REDIRECT`. Treat these as reachability observations, not proof that a source's content was extracted correctly. In particular, timeout, DNS, and SSL errors need endpoint-level or repeat checks before changing a source's status; they do not prove the source is permanently unavailable.

### Data-quality issue now resolved

The n8n checker writes directly to `source health` and stores the numeric NocoDB `Sources.Id` in `source_id`. A read-back confirmed 144/144 rows have an ID and zero are blank. The current table represents one latest run per source; when daily history is needed, keep an append-only run-history table and a separate latest-status view/table so the operational dashboard stays compact.

The health check's `suggested_method` is a starting hint, not a verified extraction method. For example, `CHECK_MANUALLY` means the reachability scan could not confidently classify the page; it does not mean the source is unusable.

## First qualification cohort

Keep the three active Budget Office sources as the baseline. Qualify the following additional sources before activating ingestion:

| Existing source entry | Type | Why it belongs in the first cohort | Qualification work |
| --- | --- | --- | --- |
| Open Treasury Portal (ID 64) | Dataset / public finance | Daily payment reports and monthly/quarterly budget performance files | Replace the generic homepage target with listing/download endpoints; validate XLSX/PDF parsing and reporting period semantics. |
| CBN statistics (ID 57) | Dataset + documents | Macro, financial, fiscal and monetary series, plus official reports and circulars | Split the current homepage entry into a statistics/data source and a documents source; identify stable series IDs and export/API access. |
| NBS Microdata Catalog (ID 63) | Dataset | Survey and official statistics releases with public-use data | Identify which datasets are public-use, their formats and release cadence; keep licensed or restricted microdata out of public ingestion. |
| NGF Public Finance Database (ID 65) | Dataset | Comparable annual fiscal information for all 36 states | Record the database's definitions and source documents; validate state, year, budget/actual and classification fields. |
| OAGF Digital Library (ID 14) | Documents | Official repository for treasury circulars, reports, policies and financial guidance | Discover repository search/listing pages and stable record URLs; test PDF metadata extraction. |
| DMO (ID 58) | Dataset + documents | Public debt stock, debt service, borrowing and debt policy documents | Split debt time series from publications; retain currency, valuation date and domestic/external distinctions. |
| Office of the Auditor-General for the Federation (ID 51) | Documents | Audit and oversight reports | Verify the current official host and replace the stale source URL if required; map reports by year and entity. |
| NOCOPO / BPP (ID 82) | Dataset | Procurement plans, tenders and awards | Verify current public access and whether records can be downloaded in structured form; preserve procurement identifiers and publication dates. |
| NEITI (ID 61) | Documents + dataset | Extractive revenue, production and audit disclosures | Separate report ingestion from any structured open-data product; record sector, period and entity coverage. |

These are candidate sources from the existing registry, not yet verified ingestion contracts. The health check confirms the following: CBN (ID 57), DMO (ID 58), and OAGF Digital Library (ID 14) returned HTTP 200; NGF Public Finance Database (ID 65) returned HTTP 200; Open Treasury (ID 64) and NBS Microdata Catalog (ID 63) timed out; Auditor-General (ID 51) hit an SSL error; NOCOPO (ID 82) had a DNS lookup error; and NEITI (ID 61) had a certificate error. These failures need follow-up before interpreting them as unavailable. The records currently put the NBS, NGF, Open Treasury, NOCOPO, and NEITI candidates in wave 3, despite their value to the proposed first qualification cohort. Revisit those priority values after confirming product priorities.

Do not mark a source active until its exact collection path, stable identifiers, update cadence, permissions, and output schema are tested.

### Pilot progress

The first structured-data source is now ingested:

- **World Bank Indicators API (ID 137):** corrected the registry URL from the bare `/v2/` root (404) to a valid Nigeria GDP indicator endpoint. A manual n8n workflow made one API request per indicator, normalized the responses, and upserted **263 non-null annual observations** into NocoDB `indicator_observations`. The series are GDP (current US$), GDP growth, CPI inflation, and population. The API reports metadata last updated 2026-11-11. `method_verified` is now `yes`; the ingestion workflow and source registry `active` flag remain off pending the daily refresh and source qualification work.
- **Indicator read API:** created and published `CivicLens - World Bank indicators API` at `GET /webhook/civiclens/world-bank-indicators`. The endpoint reads from NocoDB with the credential held in n8n, returns JSON with CORS headers, and returns a structured 500 on read errors. Both a manual run and a production-mode run completed successfully. The local frontend build has not yet been run.
- **Indicator dashboard expansion:** the `/indicators` page now discovers series and geographies from the observation rows instead of hard-coded source codes. It groups by source by default, supports source/country filters, search, sorting and topic grouping, and lets users compare up to four series in side-by-side charts. The chart marks projection years with a dashed segment and labels. The indicator read endpoint returns all rows from `indicator_observations`, so added sources appear without a separate frontend endpoint.
- **IMF DataMapper (ID 138):** a manual n8n import added 838 Nigeria WEO/Fiscal Monitor annual observations. IMF estimates/projections are stored in `obs_status`; the source remains inactive pending a reliable refresh design.
- **UNICEF SDMX API (ID 140):** source health had checked the documentation URL and received a Cloudflare 403. The registry now points at UNICEF's documented SDMX dataflow catalog API. A manual n8n request discovered `UNICEF:GLOBAL_DATAFLOW` and returned Nigeria's aggregate-sex slice. Imported **5,235 annual observations across 302 indicator series** into NocoDB; 24 nonannual periods were skipped for the annual dashboard, and UNICEF `OBS_STATUS` and unit multipliers were retained. `method_verified` is `yes`; source and workflow activation remain off until the daily refresh is qualified.
- **AfDB Statistics Data API (new candidate ID 145):** registered separately from the existing AfDB document source (ID 119), with a corresponding source-health row. The official developer portal advertises REST and SDMX APIs, including country indicator endpoints, but asks users to obtain an API key through portal subscription. The legacy SDMX host surfaced in discovery is marked unavailable to external users. The portal page itself is reachable (HTTP 200); this does not verify the data API. Keep this candidate inactive and `method_verified=no` until we confirm the subscribed product, API host/path, key type/quota, and a representative Nigeria response. The existing AfDB document homepage (ID 119) currently returns 403; this does not establish that the API is blocked.
- **OHCSF Circulars (ID 5):** the source-health scan returned HTTP 200 and counted 38 PDF links. Captured the 10 newest official PDF URLs from the listing into NocoDB `Circular` as `Source=OHCSF`; each listing omits an exact publication date, so dates remain blank until found in the file. Invoked the existing `Embed Circular PDFs in bounded sections (manual)` workflow with each document's explicit row ID (not its broad manual trigger). All 10 runs succeeded; each row now has one linked cache record and `CacheCount=1`. The first PDF was scanned; Gemini OCR recovered its text, Pinecone stored two sections, and the circular body supplied the verified publication date 2026-11-12. Capture and ingest the remaining 28 listed PDFs, check the extracted text/citations, and make a source-filtered refresh path before scheduling. The existing manual trigger still searches all uncached `Circular` rows, so do not use it for OHCSF refreshes.

**NGF Public Finance Database (ID 65)** remains a high-value candidate for state fiscal comparisons, but it is on hold. Its portal says it provides open-access annual revenue, expenditure, and financing data from state budgets and audited financial statements using the National Chart of Accounts. The state explorer labels pages as last updated June 28, 2025. In addition, the indexed homepage contained unrelated adult-link spam, so check current site integrity and freshness before ingesting or trusting its figures. Confirm a machine-readable export or documented endpoint and validate state, year, budget/actual, unit, and category fields.

Keep **OAGF Digital Library (ID 14)** in the document cohort, but first review its end-user agreement and request permission or clarify allowed automated access. Its terms prohibit automated harvesting, scraping, copying, or downloading at a scale that may affect performance or violate rights, and state that public availability does not automatically place material in the public domain. The health scan detected DSpace and HTTP 200, but that is not authorization to bulk-ingest its repository.

In parallel, inspect CBN (ID 57) for a stable statistics endpoint and recheck Open Treasury (ID 64) using its actual data/listing route. Do not label a timeout as a broken URL until the intended endpoint has been checked.

Useful starting points include the [Open Treasury Portal](https://opentreasury.gov.ng/), [CBN Data & Statistics](https://www.cbn.gov.ng/rates/), [NBS data catalog](https://microdata.nigerianstat.gov.ng/index.php/catalog/), [NGF Public Finance Database](https://www.publicfinance.ngf.org.ng/), [NGF actual budget view](https://www.publicfinance.ngf.org.ng/budgets/actual/), [OHCSF circulars](https://ohcsf.gov.ng/ohcsf-circular/), [OAGF Digital Library](https://elibrary.oagf.gov.ng/), [OAGF end-user agreement](https://elibrary.oagf.gov.ng/info/end-user-agreement), [DMO](https://dmo.gov.ng/), [Auditor-General for the Federation](https://oaugf.ng/), [NOCOPO information from BPP](https://www.bpp.gov.ng/nigeria-open-contracting-portal/), and [NEITI](https://neiti.gov.ng/).

## Delivery sequence

### 1. Make source operations dependable

- Fix the health check so it stores `source_id`, source URL, check time, HTTP result, suggested method, and diagnostic note against the source registry.
- Separate `last_checked`, `last_success`, and `last_content_change`.
- Add retry/backoff, timeouts, per-source error handling, and a clear run summary.
- Detect content changes with stable hashes; do not re-embed unchanged documents.
- Keep source-health failures visible without blocking healthy sources in the same run.

### 2. Qualify and activate the first cohort

For each candidate, capture the exact endpoint, parser approach, stable external ID, expected fields, published cadence, coverage dates, access terms, and a representative sample. Start with a small pilot across one document source and one dataset source, then expand the cohort after a successful end-to-end refresh.

### 3. Separate document and dataset products

- Documents: retain original file/link, publisher, title, type, publication date, version/hash, source ID, extracted text, and chunk metadata. Store vectors in Pinecone with document and source metadata.
- Datasets: retain dataset/series definitions and observations with period, geography, value, unit, currency, classification, source URL, release date, and revision/vintage.
- Keep the source registry and smaller operational catalog in NocoDB. Use a structured analytical store for growing observation volumes; do not use vector search as the numeric database.

### 4. Ship the first public information views

Initial dashboards should cover federal budget versus actual, treasury payment trends, public debt, macro indicators, and state fiscal comparisons. Every chart must expose units, time range, geography, source, and latest successful refresh.

### 5. Connect AI to both evidence types

- Use RAG for explanatory text in source documents.
- Use deterministic data queries for exact values, comparisons, and calculations.
- For mixed questions, combine retrieved report passages with queried observations and cite both.
- Return the original source and relevant reporting period with every material answer.

## First implementation checkpoint

The source-health keying checkpoint is complete: all 144 rows join to `Sources.Id`. The World Bank dataset ingestion, read API, and data-driven indicator dashboard are complete with 263 observations across four series. Next, run the local frontend build and review the page, then add structured feeds from the existing dataset candidates, prioritizing Nigerian fiscal and macroeconomic sources. In parallel, qualify the OHCSF circular document feed. After the ingestion paths are verified, connect them to daily refresh. No unverified source should enter the daily schedule. The product checkpoint remains charts built from validated structured datasets and document-grounded answers that cite their source.
