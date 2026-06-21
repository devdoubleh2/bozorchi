import { ArrowRight, BookOpen, ChartLine, ClipboardCheck, Store } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Seo from "@/components/Seo";
import { useTranslation } from "react-i18next";
import { detectLocaleFromPath, localizedPath } from "@/lib/marketing";
import { toSeoLocale } from "@/components/Seo";

type Guide = {
  key: string;
  icon: typeof BookOpen;
};

const GUIDES: Guide[] = [
  { key: "inventory_turnover", icon: ClipboardCheck },
  { key: "faster_checkout", icon: Store },
  { key: "kpi_dashboard", icon: ChartLine },
];

export default function ResourcesPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const routeLanguage = detectLocaleFromPath(location.pathname);
  const pagePath = localizedPath("/resources", routeLanguage);
  const alternates = [
    { hrefLang: "en", href: "https://app.bozorchi.store/resources" },
    { hrefLang: "ru", href: "https://app.bozorchi.store/ru/resources" },
    { hrefLang: "uz", href: "https://app.bozorchi.store/uz/resources" },
    { hrefLang: "x-default", href: "https://app.bozorchi.store/resources" },
  ];

  return (
    <>
      <Seo
        title={t("resources.seo.title", "Retail Growth Resources and Guides")}
        description={t(
          "resources.seo.description",
          "Actionable guides for store owners on inventory, checkout optimization, and retail growth."
        )}
        path={pagePath}
        robots="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        type="website"
        locale={toSeoLocale(routeLanguage)}
        alternates={alternates}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: t("resources.seo.jsonld_name", "Bozorchi Resources"),
          description: t(
            "resources.seo.description",
            "Actionable guides for store owners on inventory, checkout optimization, and retail growth."
          ),
          url:
            typeof window !== "undefined"
              ? `${window.location.origin}${pagePath}`
              : `https://app.bozorchi.store${pagePath}`,
          hasPart: GUIDES.map((guide, index) => ({
            "@type": "Article",
            position: index + 1,
            headline: t(`resources.guides.${guide.key}.title`),
            description: t(`resources.guides.${guide.key}.description`),
          })),
        }}
      />

      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-16 md:px-8 md:py-20">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">
              {t("resources.hero.badge", "Content Hub")}
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              {t(
                "resources.hero.title",
                "Retail resources that help your team sell faster and waste less inventory."
              )}
            </h1>
            <p className="max-w-2xl text-base text-zinc-600 md:text-lg">
              {t(
                "resources.hero.subtitle",
                "Built for store owners and operators who want practical playbooks, not theory. Use these guides to improve sales operations this week."
              )}
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-14 md:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {GUIDES.map((guide) => {
              const Icon = guide.icon;
              return (
                <article
                  key={guide.key}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mb-3 text-xl font-semibold tracking-tight">
                    {t(`resources.guides.${guide.key}.title`)}
                  </h2>
                  <p className="mb-5 text-sm leading-relaxed text-zinc-600">
                    {t(`resources.guides.${guide.key}.description`)}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    {t(`resources.guides.${guide.key}.readTime`)}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-white">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-5 px-4 py-14 md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {t(
                  "resources.cta.title",
                  "Need a system that executes these playbooks end to end?"
                )}
              </h2>
              <p className="mt-2 max-w-2xl text-zinc-600">
                {t(
                  "resources.cta.subtitle",
                  "Start with Bozorchi to connect POS, inventory, and reporting in one workflow."
                )}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={localizedPath("/register", routeLanguage)}
                className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                {t("resources.cta.button", "Start Free Trial")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={localizedPath("/pricing", routeLanguage)}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                {t("resources.cta.pricing", "View Pricing")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
