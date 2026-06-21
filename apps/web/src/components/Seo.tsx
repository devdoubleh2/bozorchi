import { Helmet } from "react-helmet-async";

const DEFAULT_SITE_URL = "https://app.bozorchi.store";
const DEFAULT_SITE_NAME = "Bozorchi";
const DEFAULT_IMAGE_PATH = "/logo.svg";

export type SeoProps = {
  title: string;
  description: string;
  path?: string;
  robots?: string;
  type?: "website" | "article" | "product";
  image?: string;
  locale?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> | null;
  includeSiteName?: boolean;
  alternates?: Array<{ hrefLang: string; href: string }>;
};

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const getSiteUrl = (): string => {
  const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.trim();
  if (configuredSiteUrl) {
    return trimTrailingSlash(configuredSiteUrl);
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return trimTrailingSlash(window.location.origin);
  }

  return DEFAULT_SITE_URL;
};

const toAbsoluteUrl = (value: string): string => {
  if (isAbsoluteUrl(value)) return value;
  return new URL(value, `${getSiteUrl()}/`).toString();
};

const toCanonicalPath = (path: string): string => {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
};

const withBrandTitle = (title: string, includeSiteName: boolean): string => {
  if (!includeSiteName) return title;
  if (title.toLowerCase().includes(DEFAULT_SITE_NAME.toLowerCase())) {
    return title;
  }
  return `${title} | ${DEFAULT_SITE_NAME}`;
};

export const toSeoLocale = (language: string): string => {
  const lang = language.toLowerCase();
  if (lang.startsWith("ru")) return "ru_RU";
  if (lang.startsWith("uz")) return "uz_UZ";
  return "en_US";
};

type AppJsonLdParams = {
  description: string;
  siteUrl?: string;
};

export const createAppJsonLd = ({
  description,
  siteUrl = getSiteUrl(),
}: AppJsonLdParams): Array<Record<string, unknown>> => {
  const absoluteSiteUrl = trimTrailingSlash(siteUrl);
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: DEFAULT_SITE_NAME,
      url: absoluteSiteUrl,
      inLanguage: ["en", "ru", "uz"],
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: DEFAULT_SITE_NAME,
      url: absoluteSiteUrl,
      logo: toAbsoluteUrl(DEFAULT_IMAGE_PATH),
      email: "support@bozorchi.store",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: DEFAULT_SITE_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, Android, iOS",
      description,
      url: absoluteSiteUrl,
    },
  ];
};

export default function Seo({
  title,
  description,
  path,
  robots = "index,follow",
  type = "website",
  image = DEFAULT_IMAGE_PATH,
  locale = "en_US",
  jsonLd = null,
  includeSiteName = true,
  alternates = [],
}: SeoProps) {
  const pathname =
    path ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const canonicalUrl = toAbsoluteUrl(toCanonicalPath(pathname));
  const imageUrl = toAbsoluteUrl(image);
  const fullTitle = withBrandTitle(title, includeSiteName);
  const htmlLang = locale.split("_")[0] ?? "en";

  return (
    <Helmet prioritizeSeoTags>
      <html lang={htmlLang} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />
      {alternates.map((alternate) => (
        <link
          key={`${alternate.hrefLang}-${alternate.href}`}
          rel="alternate"
          hrefLang={alternate.hrefLang}
          href={alternate.href}
        />
      ))}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={DEFAULT_SITE_NAME} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:locale" content={locale} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  );
}
