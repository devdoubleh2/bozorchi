# Search Console API

This project includes a small CLI for the official Google Search Console API.

Script:

```bash
bun scripts/search-console.mjs
```

Supported operations:

- submit sitemap
- list sitemaps
- query Search Analytics

## What Google officially supports

Google Search Console API:

- Search Console API docs: https://developers.google.com/webmaster-tools
- Sitemaps submit endpoint: https://developers.google.com/webmaster-tools/v1/sitemaps/submit
- Search Analytics query endpoint: https://developers.google.com/webmaster-tools/v1/searchanalytics/query

Important limitation:

- General "Request indexing" for normal web pages is not exposed as a general public API for standard websites.
- Use Search Console UI and URL Inspection for that workflow.
- Google Indexing API is only for limited content types such as `JobPosting` and some `BroadcastEvent` cases.

## Auth setup

You need an OAuth access token with Search Console scope.

Recommended scope:

```text
https://www.googleapis.com/auth/webmasters
```

### Minimal setup

1. Create or choose a Google Cloud project.
2. Enable the Search Console API.
3. Create OAuth client credentials.
4. Generate an access token for the Search Console scope.
5. Export the token:

```bash
export GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN="ya29..."
```

You must also have access to the Search Console property itself.

For a domain property, the site value is usually:

```text
sc-domain:bozorchi.store
```

For a URL-prefix property, the site value is the full property URL, for example:

```text
https://app.bozorchi.store/
```

## Commands

### Submit sitemap

```bash
GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN="ya29..." \
bun scripts/search-console.mjs submit-sitemap \
  --site sc-domain:bozorchi.store \
  --sitemap https://app.bozorchi.store/sitemap.xml
```

### List submitted sitemaps

```bash
GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN="ya29..." \
bun scripts/search-console.mjs list-sitemaps \
  --site sc-domain:bozorchi.store
```

### Query Search Analytics

```bash
GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN="ya29..." \
bun scripts/search-console.mjs search-analytics \
  --site sc-domain:bozorchi.store \
  --start-date 2026-05-01 \
  --end-date 2026-05-31 \
  --dimensions page,query,country,device \
  --row-limit 50
```

## Notes

- Access tokens expire. Refresh them through your OAuth flow when needed.
- Sitemap submission is API-supported.
- URL Inspection "Request indexing" remains a manual Search Console UI task for standard pages.
