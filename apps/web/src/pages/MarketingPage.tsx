import { Link } from "react-router-dom";
import Seo from "@/components/Seo";

type Section = {
  title: string;
  body: string;
};

type MarketingPageProps = {
  title: string;
  description: string;
  path: string;
  eyebrow: string;
  heading: string;
  intro: string;
  sections: Section[];
  ctaTitle: string;
  ctaBody: string;
  primaryCtaLabel: string;
  primaryCtaTo: string;
  secondaryCtaLabel?: string;
  secondaryCtaTo?: string;
  locale?: string;
  alternates?: Array<{ hrefLang: string; href: string }>;
};

export default function MarketingPage({
  title,
  description,
  path,
  eyebrow,
  heading,
  intro,
  sections,
  ctaTitle,
  ctaBody,
  primaryCtaLabel,
  primaryCtaTo,
  secondaryCtaLabel,
  secondaryCtaTo,
  locale = "en_US",
  alternates = [],
}: MarketingPageProps) {
  const renderCta = (
    label: string,
    to: string,
    variant: "primary" | "secondary"
  ) => {
    const className =
      variant === "primary"
        ? "inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
        : "inline-flex items-center justify-center rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50";

    if (/^(mailto:|https?:)/.test(to)) {
      return (
        <a href={to} className={className}>
          {label}
        </a>
      );
    }

    return (
      <Link to={to} className={className}>
        {label}
      </Link>
    );
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `https://app.bozorchi.store${path}`,
  };

  return (
    <>
      <Seo
        title={title}
        description={description}
        path={path}
        robots="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        type="website"
        locale={locale}
        alternates={alternates}
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-16 md:px-8 md:py-20">
            <p className="inline-flex w-fit rounded-full border border-zinc-200 bg-zinc-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">
              {eyebrow}
            </p>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              {heading}
            </h1>
            <p className="max-w-3xl text-base text-zinc-600 md:text-lg">
              {intro}
            </p>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-12 md:px-8 md:py-14">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <h2 className="mb-3 text-2xl font-semibold tracking-tight">
                {section.title}
              </h2>
              <p className="text-sm leading-7 text-zinc-600 md:text-base">
                {section.body}
              </p>
            </article>
          ))}
        </section>

        <section className="border-t border-zinc-200 bg-white">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-5 px-4 py-14 md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {ctaTitle}
              </h2>
              <p className="mt-2 max-w-2xl text-zinc-600">{ctaBody}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {renderCta(primaryCtaLabel, primaryCtaTo, "primary")}
              {secondaryCtaLabel && secondaryCtaTo ? (
                renderCta(secondaryCtaLabel, secondaryCtaTo, "secondary")
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
