import { useTranslation } from "react-i18next";
import type { SupportedLanguage } from "@/lib/i18n";
import { localizedPath } from "@/lib/marketing";
import MarketingPage from "@/pages/MarketingPage";
import { toSeoLocale } from "@/components/Seo";

export const MARKETING_SLUGS = [
  "/pricing",
  "/security",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
  "/features/offline-pos",
  "/features/inventory-management",
  "/features/sales-reports",
  "/solutions/grocery-pos",
  "/solutions/boutique-pos",
  "/solutions/electronics-pos",
] as const;

type MarketingRoutePath = (typeof MARKETING_SLUGS)[number];

export function getMarketingRoutePaths() {
  return [
    ...MARKETING_SLUGS,
    ...MARKETING_SLUGS.map((path) => `/ru${path}`),
    ...MARKETING_SLUGS.map((path) => `/uz${path}`),
  ];
}

type RouteCopy = {
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  intro: string;
  sections: Array<{ title: string; body: string }>;
  ctaTitle: string;
  ctaBody: string;
  primaryCtaLabel: string;
  primaryCtaTo: string;
  secondaryCtaLabel?: string;
  secondaryCtaTo?: string;
};

function useMarketingCopy(
  path: MarketingRoutePath,
  language: SupportedLanguage | "en"
): RouteCopy {
  const { t } = useTranslation();
  const trialUrl = localizedPath("/register", language === "en" ? "en" : language);
  const contactUrl = localizedPath("/contact", language === "en" ? "en" : language);

  const byPath: Record<MarketingRoutePath, RouteCopy> = {
    "/pricing": {
      title: t("marketing.pricing.title", "POS Pricing for Small Retail Stores in Uzbekistan"),
      description: t(
        "marketing.pricing.description",
        "See how Bozorchi pricing works for growing retail stores that need POS, inventory, staff controls, and reporting in one platform."
      ),
      eyebrow: t("marketing.pricing.eyebrow", "Pricing"),
      heading: t(
        "marketing.pricing.heading",
        "Simple POS pricing for stores that need to move fast."
      ),
      intro: t(
        "marketing.pricing.intro",
        "Bozorchi is built for retail teams that want checkout, inventory, supplier tracking, staff access, and daily reporting in one workflow. Use pricing conversations to match the right setup to your store size, process, and rollout speed."
      ),
      sections: [
        {
          title: t("marketing.pricing.sections.cover.title", "What pricing should cover"),
          body: t(
            "marketing.pricing.sections.cover.body",
            "For a POS system, price only matters in context. Store owners need to know whether onboarding, staff setup, inventory migration, and reporting are included. This page gives search engines and buyers a dedicated commercial page instead of forcing pricing intent onto the homepage."
          ),
        },
        {
          title: t("marketing.pricing.sections.fit.title", "When Bozorchi is a fit"),
          body: t(
            "marketing.pricing.sections.fit.body",
            "Bozorchi fits retail stores that need faster checkout, cleaner stock control, and a practical owner dashboard without the overhead of a large ERP project. That is especially relevant for grocery, boutique, convenience, and electronics retail operations."
          ),
        },
      ],
      ctaTitle: t("marketing.pricing.ctaTitle", "Get pricing that matches your store setup."),
      ctaBody: t(
        "marketing.pricing.ctaBody",
        "Use the existing signup flow for trials or talk to sales when you need rollout guidance."
      ),
      primaryCtaLabel: t("marketing.primaryTrial", "Start Free Trial"),
      primaryCtaTo: trialUrl,
      secondaryCtaLabel: t("marketing.primaryContact", "Contact Sales"),
      secondaryCtaTo: contactUrl,
    },
    "/security": {
      title: t("marketing.security.title", "Retail POS Security and Access Controls"),
      description: t(
        "marketing.security.description",
        "Learn how Bozorchi helps retail businesses manage staff access, operational controls, and a cleaner workflow across POS and inventory."
      ),
      eyebrow: t("marketing.security.eyebrow", "Security"),
      heading: t(
        "marketing.security.heading",
        "Operational security for everyday retail work."
      ),
      intro: t(
        "marketing.security.intro",
        "Retail teams need practical security: who can sell, refund, edit products, review stock, and access reports. This page supports trust and gives Google a real destination for security-related queries."
      ),
      sections: [
        {
          title: t("marketing.security.sections.access.title", "Role-based access"),
          body: t(
            "marketing.security.sections.access.body",
            "Bozorchi already includes staff roles and permissions in the product. That helps store owners separate cashier access from higher-risk inventory and reporting actions."
          ),
        },
        {
          title: t("marketing.security.sections.visibility.title", "Workflow visibility"),
          body: t(
            "marketing.security.sections.visibility.body",
            "Security in retail is not only about passwords. It is also about clear workflows, fewer manual side channels, and better visibility into products, stock movement, and daily operations."
          ),
        },
      ],
      ctaTitle: t(
        "marketing.security.ctaTitle",
        "Need a walkthrough for your team structure?"
      ),
      ctaBody: t(
        "marketing.security.ctaBody",
        "Use the contact flow for operational questions before rollout."
      ),
      primaryCtaLabel: t("marketing.primaryContact", "Contact Sales"),
      primaryCtaTo: contactUrl,
      secondaryCtaLabel: t("marketing.primaryTrial", "Start Free Trial"),
      secondaryCtaTo: trialUrl,
    },
    "/about": {
      title: t("marketing.about.title", "About Bozorchi Retail POS"),
      description: t(
        "marketing.about.description",
        "Bozorchi builds practical POS and inventory software for retail stores in Uzbekistan that need faster checkout and tighter stock control."
      ),
      eyebrow: t("marketing.about.eyebrow", "Company"),
      heading: t(
        "marketing.about.heading",
        "Bozorchi is built for the realities of modern retail in Uzbekistan."
      ),
      intro: t(
        "marketing.about.intro",
        "The product positioning is already clear on the landing page. This page exists to support brand trust, branded search, and entity understanding without changing the current design language."
      ),
      sections: [
        {
          title: t("marketing.about.sections.focus.title", "What we focus on"),
          body: t(
            "marketing.about.sections.focus.body",
            "Bozorchi focuses on the retail workflows that break first in growing stores: checkout speed, stock visibility, supplier coordination, staff control, and owner reporting."
          ),
        },
        {
          title: t("marketing.about.sections.serves.title", "Who it serves"),
          body: t(
            "marketing.about.sections.serves.body",
            "The strongest fit is for small and mid-sized retail operators that have outgrown notebooks, spreadsheets, or fragmented tools but do not want the cost and complexity of heavy ERP software."
          ),
        },
      ],
      ctaTitle: t("marketing.about.ctaTitle", "See how Bozorchi fits your store."),
      ctaBody: t(
        "marketing.about.ctaBody",
        "Move from brand interest to trial or a direct sales conversation."
      ),
      primaryCtaLabel: t("marketing.primaryTrial", "Start Free Trial"),
      primaryCtaTo: trialUrl,
      secondaryCtaLabel: t("marketing.primaryContact", "Contact Sales"),
      secondaryCtaTo: contactUrl,
    },
    "/privacy": {
      title: t("marketing.privacy.title", "Bozorchi Privacy Information"),
      description: t(
        "marketing.privacy.description",
        "Review Bozorchi privacy information for the retail POS and inventory platform."
      ),
      eyebrow: t("marketing.privacy.eyebrow", "Legal"),
      heading: t(
        "marketing.privacy.heading",
        "Privacy information for Bozorchi customers and prospects."
      ),
      intro: t(
        "marketing.privacy.intro",
        "This page provides a crawlable destination for privacy-related trust signals and supports footer navigation without changing the landing design."
      ),
      sections: [
        {
          title: t("marketing.privacy.sections.why.title", "Why this page exists"),
          body: t(
            "marketing.privacy.sections.why.body",
            "Search engines and buyers expect legitimate software businesses to expose basic policy surfaces. A crawlable privacy page improves trust, internal linking quality, and branded search outcomes."
          ),
        },
        {
          title: t(
            "marketing.privacy.sections.expectation.title",
            "Operational expectation"
          ),
          body: t(
            "marketing.privacy.sections.expectation.body",
            "Privacy details should stay aligned with the actual product and data handling model. This page is intentionally lightweight until full legal copy is finalized."
          ),
        },
      ],
      ctaTitle: t(
        "marketing.privacy.ctaTitle",
        "Need operational answers before rollout?"
      ),
      ctaBody: t(
        "marketing.privacy.ctaBody",
        "Contact the team if your store needs clarification before signup."
      ),
      primaryCtaLabel: t("marketing.primaryContact", "Contact Sales"),
      primaryCtaTo: contactUrl,
      secondaryCtaLabel: t("marketing.primaryTrial", "Start Free Trial"),
      secondaryCtaTo: trialUrl,
    },
    "/terms": {
      title: t("marketing.terms.title", "Bozorchi Terms Information"),
      description: t(
        "marketing.terms.description",
        "Review Bozorchi terms information for retail POS onboarding, subscriptions, and platform usage."
      ),
      eyebrow: t("marketing.terms.eyebrow", "Legal"),
      heading: t(
        "marketing.terms.heading",
        "Terms information for Bozorchi onboarding and platform usage."
      ),
      intro: t(
        "marketing.terms.intro",
        "This page gives the website a real, crawlable terms destination. It supports trust and removes dead-end footer links without altering the current landing page experience."
      ),
      sections: [
        {
          title: t("marketing.terms.sections.usage.title", "Platform usage"),
          body: t(
            "marketing.terms.sections.usage.body",
            "Store owners evaluating software want clarity around trials, subscriptions, and support expectations. A terms page helps answer those commercial trust questions early in the buying journey."
          ),
        },
        {
          title: t("marketing.terms.sections.seo.title", "Why it helps SEO"),
          body: t(
            "marketing.terms.sections.seo.body",
            "Legitimate supporting pages improve the overall quality and completeness of the website. They do not rank on their own for major demand, but they support trust and entity signals."
          ),
        },
      ],
      ctaTitle: t(
        "marketing.terms.ctaTitle",
        "Ready to evaluate the platform directly?"
      ),
      ctaBody: t(
        "marketing.terms.ctaBody",
        "Use the current signup flow or contact sales for rollout planning."
      ),
      primaryCtaLabel: t("marketing.primaryTrial", "Start Free Trial"),
      primaryCtaTo: trialUrl,
      secondaryCtaLabel: t("marketing.primaryContact", "Contact Sales"),
      secondaryCtaTo: contactUrl,
    },
    "/contact": {
      title: t("marketing.contact.title", "Contact Bozorchi Sales"),
      description: t(
        "marketing.contact.description",
        "Contact Bozorchi about retail POS, inventory setup, onboarding, and rollout for stores in Uzbekistan."
      ),
      eyebrow: t("marketing.contact.eyebrow", "Contact"),
      heading: t("marketing.contact.heading", "Talk to Bozorchi about your retail setup."),
      intro: t(
        "marketing.contact.intro",
        "This page gives the site a dedicated contact destination for high-intent buyers who are not ready to self-serve through signup alone."
      ),
      sections: [
        {
          title: t("marketing.contact.sections.when.title", "When to contact sales"),
          body: t(
            "marketing.contact.sections.when.body",
            "Use this route when your team needs help with store setup, rollout planning, migration questions, or choosing the right operational flow before launch."
          ),
        },
        {
          title: t("marketing.contact.sections.next.title", "Fastest next step"),
          body: t(
            "marketing.contact.sections.next.body",
            "The current sales path is email-based. That is not ideal long term, but this page gives search and users a stable contact destination right now while preserving the current product and landing experience."
          ),
        },
      ],
      ctaTitle: t("marketing.contact.ctaTitle", "Move from interest to rollout."),
      ctaBody: t(
        "marketing.contact.ctaBody",
        "Reach the team directly or start a trial and configure the store yourself."
      ),
      primaryCtaLabel: t("marketing.contact.primaryEmail", "Email Sales"),
      primaryCtaTo: "mailto:sales@bozorchi.store",
      secondaryCtaLabel: t("marketing.primaryTrial", "Start Free Trial"),
      secondaryCtaTo: trialUrl,
    },
    "/features/offline-pos": {
      title: t("marketing.offline.title", "Offline POS Software for Retail Stores"),
      description: t(
        "marketing.offline.description",
        "Bozorchi helps retail stores keep selling with offline-ready POS workflows and synced operations across checkout and inventory."
      ),
      eyebrow: t("marketing.offline.eyebrow", "Feature"),
      heading: t(
        "marketing.offline.heading",
        "Sell through internet outages with offline-ready POS workflows."
      ),
      intro: t(
        "marketing.offline.intro",
        "Offline reliability is one of the clearest commercial hooks in the current landing page. This dedicated page lets that feature rank on its own and link back into the existing trial flow."
      ),
      sections: [
        {
          title: t("marketing.offline.sections.why.title", "Why offline matters"),
          body: t(
            "marketing.offline.sections.why.body",
            "Small stores cannot pause checkout because a connection drops. Dedicated offline POS pages are strong acquisition assets because the search intent is concrete and commercial."
          ),
        },
        {
          title: t("marketing.offline.sections.ops.title", "Where it helps operations"),
          body: t(
            "marketing.offline.sections.ops.body",
            "Offline-ready selling reduces queue disruption, protects cashier flow, and keeps revenue moving during unstable connectivity periods."
          ),
        },
      ],
      ctaTitle: t(
        "marketing.offline.ctaTitle",
        "Need a POS that keeps moving when the connection does not?"
      ),
      ctaBody: t(
        "marketing.offline.ctaBody",
        "Use the existing trial or contact path to evaluate Bozorchi."
      ),
      primaryCtaLabel: t("marketing.primaryTrial", "Start Free Trial"),
      primaryCtaTo: trialUrl,
      secondaryCtaLabel: t("marketing.primaryContact", "Contact Sales"),
      secondaryCtaTo: contactUrl,
    },
    "/features/inventory-management": {
      title: t(
        "marketing.inventory.title",
        "Retail Inventory Management Software"
      ),
      description: t(
        "marketing.inventory.description",
        "Bozorchi helps retail teams track products, stock movement, restocks, supplier costs, and low-stock risk in one system."
      ),
      eyebrow: t("marketing.inventory.eyebrow", "Feature"),
      heading: t(
        "marketing.inventory.heading",
        "Inventory management for stores that need clarity before checkout breaks."
      ),
      intro: t(
        "marketing.inventory.intro",
        "Inventory control is a separate search demand from POS. This page isolates that intent and gives search engines a focused destination beyond the homepage."
      ),
      sections: [
        {
          title: t("marketing.inventory.sections.needs.title", "What store owners need"),
          body: t(
            "marketing.inventory.sections.needs.body",
            "Owners need to see stock, movement, supplier costs, and low-stock risk without relying on scattered notes or manual reconciliation."
          ),
        },
        {
          title: t("marketing.inventory.sections.page.title", "Why this page matters"),
          body: t(
            "marketing.inventory.sections.page.body",
            "A generic homepage rarely ranks well for inventory-specific commercial terms. Feature-specific pages solve that without changing the landing design."
          ),
        },
      ],
      ctaTitle: t(
        "marketing.inventory.ctaTitle",
        "Connect inventory and checkout in one workflow."
      ),
      ctaBody: t(
        "marketing.inventory.ctaBody",
        "Start with the existing trial or reach sales for a walkthrough."
      ),
      primaryCtaLabel: t("marketing.primaryTrial", "Start Free Trial"),
      primaryCtaTo: trialUrl,
      secondaryCtaLabel: t("marketing.primaryContact", "Contact Sales"),
      secondaryCtaTo: contactUrl,
    },
    "/features/sales-reports": {
      title: t("marketing.reports.title", "Retail Sales Reporting Software"),
      description: t(
        "marketing.reports.description",
        "Track daily retail sales performance, staff activity, and store operations with Bozorchi reporting workflows."
      ),
      eyebrow: t("marketing.reports.eyebrow", "Feature"),
      heading: t(
        "marketing.reports.heading",
        "Sales reporting that helps owners see what is happening every day."
      ),
      intro: t(
        "marketing.reports.intro",
        "Reporting is a trust and buying criterion for retail software. This page supports that intent directly rather than burying it in a general features list."
      ),
      sections: [
        {
          title: t(
            "marketing.reports.sections.visibility.title",
            "Operational visibility"
          ),
          body: t(
            "marketing.reports.sections.visibility.body",
            "Owners need a fast read on sales, staff activity, and inventory performance so they can react before problems compound."
          ),
        },
        {
          title: t("marketing.reports.sections.intent.title", "Search intent fit"),
          body: t(
            "marketing.reports.sections.intent.body",
            "Pages built around reporting and analytics help capture buyers who are comparing operational software, not only cashier tools."
          ),
        },
      ],
      ctaTitle: t(
        "marketing.reports.ctaTitle",
        "See how Bozorchi supports daily store decisions."
      ),
      ctaBody: t(
        "marketing.reports.ctaBody",
        "Move from research to trial or contact sales for setup guidance."
      ),
      primaryCtaLabel: t("marketing.primaryTrial", "Start Free Trial"),
      primaryCtaTo: trialUrl,
      secondaryCtaLabel: t("marketing.primaryContact", "Contact Sales"),
      secondaryCtaTo: contactUrl,
    },
    "/solutions/grocery-pos": {
      title: t("marketing.grocery.title", "Grocery Store POS Software"),
      description: t(
        "marketing.grocery.description",
        "Bozorchi provides POS and inventory software for grocery and convenience stores that need faster checkout and better stock control."
      ),
      eyebrow: t("marketing.grocery.eyebrow", "Solution"),
      heading: t(
        "marketing.grocery.heading",
        "POS for grocery and convenience stores that need speed at the counter."
      ),
      intro: t(
        "marketing.grocery.intro",
        "Grocery and convenience retail has its own search intent and operating pressure. This page lets Bozorchi compete for that category directly."
      ),
      sections: [
        {
          title: t(
            "marketing.grocery.sections.search.title",
            "Why grocery stores search differently"
          ),
          body: t(
            "marketing.grocery.sections.search.body",
            "They care about queue speed, barcode search, repeat checkout actions, low-stock signals, and outage resilience more than generic business software language."
          ),
        },
        {
          title: t("marketing.grocery.sections.support.title", "What this page supports"),
          body: t(
            "marketing.grocery.sections.support.body",
            "It gives the current grocery positioning on the landing page a dedicated URL that can rank, collect links, and funnel buyers into the existing product path."
          ),
        },
      ],
      ctaTitle: t("marketing.grocery.ctaTitle", "Set up a grocery-ready POS flow."),
      ctaBody: t(
        "marketing.grocery.ctaBody",
        "Use the existing trial path or contact sales for rollout questions."
      ),
      primaryCtaLabel: t("marketing.primaryTrial", "Start Free Trial"),
      primaryCtaTo: trialUrl,
      secondaryCtaLabel: t("marketing.primaryContact", "Contact Sales"),
      secondaryCtaTo: contactUrl,
    },
    "/solutions/boutique-pos": {
      title: t(
        "marketing.boutique.title",
        "Boutique and Clothing Store POS Software"
      ),
      description: t(
        "marketing.boutique.description",
        "Bozorchi helps boutiques and clothing stores manage POS, inventory, variations, suppliers, and stock movement in one workflow."
      ),
      eyebrow: t("marketing.boutique.eyebrow", "Solution"),
      heading: t(
        "marketing.boutique.heading",
        "POS for boutiques and fashion stores that need tighter stock control."
      ),
      intro: t(
        "marketing.boutique.intro",
        "Boutiques and apparel stores often need product variation and supplier clarity more than generic checkout software. This page supports that buying intent directly."
      ),
      sections: [
        {
          title: t(
            "marketing.boutique.sections.variation.title",
            "Variation-heavy inventory"
          ),
          body: t(
            "marketing.boutique.sections.variation.body",
            "Fashion and boutique stores care about sizes, colors, returns, and fast visibility across stock movement. Those are concrete commercial search hooks."
          ),
        },
        {
          title: t("marketing.boutique.sections.matter.title", "Why this page matters"),
          body: t(
            "marketing.boutique.sections.matter.body",
            "It turns a use-case section on the homepage into a page that can actually target boutique POS and clothing store inventory searches."
          ),
        },
      ],
      ctaTitle: t(
        "marketing.boutique.ctaTitle",
        "See how Bozorchi fits fashion retail workflows."
      ),
      ctaBody: t(
        "marketing.boutique.ctaBody",
        "Start the current trial or contact sales for setup planning."
      ),
      primaryCtaLabel: t("marketing.primaryTrial", "Start Free Trial"),
      primaryCtaTo: trialUrl,
      secondaryCtaLabel: t("marketing.primaryContact", "Contact Sales"),
      secondaryCtaTo: contactUrl,
    },
    "/solutions/electronics-pos": {
      title: t("marketing.electronics.title", "Electronics Store POS Software"),
      description: t(
        "marketing.electronics.description",
        "Bozorchi supports electronics and home goods retailers with POS, inventory visibility, customer debt tracking, and operational reporting."
      ),
      eyebrow: t("marketing.electronics.eyebrow", "Solution"),
      heading: t(
        "marketing.electronics.heading",
        "POS for electronics stores that need control over high-value inventory."
      ),
      intro: t(
        "marketing.electronics.intro",
        "Electronics retail buyers usually care about margin visibility, stock confidence, supplier costs, and customer debt workflows. This page targets that segment clearly."
      ),
      sections: [
        {
          title: t(
            "marketing.electronics.sections.control.title",
            "High-value inventory needs tighter control"
          ),
          body: t(
            "marketing.electronics.sections.control.body",
            "When average basket value rises, owners care more about product-level control, staff actions, and margin clarity. Those needs deserve their own search landing page."
          ),
        },
        {
          title: t(
            "marketing.electronics.sections.segmented.title",
            "Segmented pages outperform generic copy"
          ),
          body: t(
            "marketing.electronics.sections.segmented.body",
            "Use-case pages let Google match the product to narrower business-type queries without forcing the homepage to carry every keyword target."
          ),
        },
      ],
      ctaTitle: t(
        "marketing.electronics.ctaTitle",
        "Evaluate Bozorchi for electronics retail."
      ),
      ctaBody: t(
        "marketing.electronics.ctaBody",
        "Use the existing signup path or contact sales for a guided rollout discussion."
      ),
      primaryCtaLabel: t("marketing.primaryTrial", "Start Free Trial"),
      primaryCtaTo: trialUrl,
      secondaryCtaLabel: t("marketing.primaryContact", "Contact Sales"),
      secondaryCtaTo: contactUrl,
    },
  };

  return byPath[path];
}

export function MarketingRoutePage({
  path,
  language,
}: {
  path: MarketingRoutePath;
  language: SupportedLanguage | "en";
}) {
  const copy = useMarketingCopy(path, language);
  const canonicalPath = localizedPath(path, language);
  const alternates = [
    { hrefLang: "en", href: `https://app.bozorchi.store${path}` },
    { hrefLang: "ru", href: `https://app.bozorchi.store${localizedPath(path, "ru")}` },
    { hrefLang: "uz", href: `https://app.bozorchi.store${localizedPath(path, "uz")}` },
    { hrefLang: "x-default", href: `https://app.bozorchi.store${path}` },
  ];

  return (
    <MarketingPage
      {...copy}
      path={canonicalPath}
      locale={toSeoLocale(language)}
      alternates={alternates}
    />
  );
}
