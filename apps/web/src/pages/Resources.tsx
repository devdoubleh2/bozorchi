import { ArrowRight, BookOpen, ChartLine, ClipboardCheck, Store } from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo";

type Guide = {
  title: string;
  description: string;
  readTime: string;
  icon: typeof BookOpen;
};

const GUIDES: Guide[] = [
  {
    title: "Inventory Turnover Playbook for Retail Stores",
    description:
      "A practical framework to reduce dead stock, improve cash flow, and reorder with confidence.",
    readTime: "8 min read",
    icon: ClipboardCheck,
  },
  {
    title: "How to Build a Faster Checkout Experience",
    description:
      "Operational tactics to speed up POS queues while keeping average order value healthy.",
    readTime: "6 min read",
    icon: Store,
  },
  {
    title: "Weekly Retail KPI Dashboard That Actually Works",
    description:
      "The key metrics store owners should review every week and how to act on them quickly.",
    readTime: "7 min read",
    icon: ChartLine,
  },
];

export default function ResourcesPage() {
  return (
    <>
      <Seo
        title="Retail Growth Resources and Guides"
        description="Actionable guides for store owners on inventory, checkout optimization, and retail growth."
        path="/resources"
        robots="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        type="website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Bozorchi Resources",
          description:
            "Actionable guides for store owners on inventory, checkout optimization, and retail growth.",
          url:
            typeof window !== "undefined"
              ? `${window.location.origin}/resources`
              : "https://app.bozorchi.store/resources",
          hasPart: GUIDES.map((guide, index) => ({
            "@type": "Article",
            position: index + 1,
            headline: guide.title,
            description: guide.description,
          })),
        }}
      />

      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-16 md:px-8 md:py-20">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">
              Content Hub
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Retail resources that help your team sell faster and waste less inventory.
            </h1>
            <p className="max-w-2xl text-base text-zinc-600 md:text-lg">
              Built for store owners and operators who want practical playbooks, not theory.
              Use these guides to improve sales operations this week.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-14 md:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {GUIDES.map((guide) => {
              const Icon = guide.icon;
              return (
                <article
                  key={guide.title}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mb-3 text-xl font-semibold tracking-tight">{guide.title}</h2>
                  <p className="mb-5 text-sm leading-relaxed text-zinc-600">{guide.description}</p>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    {guide.readTime}
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
                Need a system that executes these playbooks end to end?
              </h2>
              <p className="mt-2 max-w-2xl text-zinc-600">
                Start with Bozorchi to connect POS, inventory, and reporting in one workflow.
              </p>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
