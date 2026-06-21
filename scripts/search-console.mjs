#!/usr/bin/env node

const BASE_URL = "https://www.googleapis.com/webmasters/v3";

function usage() {
  console.error(`Usage:
  bun scripts/search-console.mjs submit-sitemap --site <siteUrl> --sitemap <sitemapUrl>
  bun scripts/search-console.mjs list-sitemaps --site <siteUrl>
  bun scripts/search-console.mjs search-analytics --site <siteUrl> [--start-date YYYY-MM-DD] [--end-date YYYY-MM-DD] [--dimensions query,page,country,device] [--row-limit 25]

Required auth:
  GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN=<oauth access token>

Example:
  GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN=ya29... bun scripts/search-console.mjs submit-sitemap --site sc-domain:bozorchi.store --sitemap https://app.bozorchi.store/sitemap.xml
`);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = rest[i + 1];
    if (!value || value.startsWith("--")) {
      options[key] = true;
      continue;
    }
    options[key] = value;
    i += 1;
  }

  return { command, options };
}

function getAccessToken() {
  const token = process.env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "Missing GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN. Create an OAuth access token for the Search Console API first."
    );
  }
  return token;
}

function requireOption(options, key) {
  const value = options[key];
  if (!value || typeof value !== "string") {
    throw new Error(`Missing required option --${key}`);
  }
  return value;
}

async function apiRequest(path, { method = "GET", body } = {}) {
  const token = getAccessToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Search Console API error ${response.status}: ${text}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function submitSitemap(options) {
  const site = encodeURIComponent(requireOption(options, "site"));
  const sitemap = encodeURIComponent(requireOption(options, "sitemap"));
  await apiRequest(`/sites/${site}/sitemaps/${sitemap}`, { method: "PUT" });
  console.log("Sitemap submitted.");
}

async function listSitemaps(options) {
  const site = encodeURIComponent(requireOption(options, "site"));
  const data = await apiRequest(`/sites/${site}/sitemaps`);
  console.log(JSON.stringify(data, null, 2));
}

function defaultDateRange() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 28);

  const toIsoDate = (value) => value.toISOString().slice(0, 10);
  return {
    startDate: toIsoDate(startDate),
    endDate: toIsoDate(endDate),
  };
}

async function searchAnalytics(options) {
  const site = encodeURIComponent(requireOption(options, "site"));
  const defaults = defaultDateRange();
  const body = {
    startDate: options["start-date"] || defaults.startDate,
    endDate: options["end-date"] || defaults.endDate,
    dimensions: typeof options.dimensions === "string"
      ? options.dimensions.split(",").map((value) => value.trim()).filter(Boolean)
      : ["page", "query"],
    rowLimit: Number(options["row-limit"] || 25),
  };

  const data = await apiRequest(`/sites/${site}/searchAnalytics/query`, {
    method: "POST",
    body,
  });
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (!command || options.help) {
    usage();
    process.exit(command ? 0 : 1);
  }

  switch (command) {
    case "submit-sitemap":
      await submitSitemap(options);
      break;
    case "list-sitemaps":
      await listSitemaps(options);
      break;
    case "search-analytics":
      await searchAnalytics(options);
      break;
    default:
      usage();
      throw new Error(`Unknown command: ${command}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
