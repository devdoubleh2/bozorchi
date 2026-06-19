import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Seo, { createAppJsonLd, toSeoLocale } from "@/components/Seo";

const RESERVED_TOP_LEVEL_SEGMENTS = new Set([
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "dashboard",
  "inventory",
  "customers",
  "suppliers",
  "pos",
  "transactions",
  "repay-debt",
  "reports",
  "account",
  "staff",
  "subscription",
  "mobile-paywall",
  "stores",
  "fiscal-settings",
]);

const NOINDEX_ROUTE_TITLES: Record<string, string> = {
  "/login": "Sign In",
  "/register": "Create Account",
  "/forgot-password": "Password Recovery",
  "/reset-password": "Reset Password",
};

const normalizePathname = (pathname: string): string => {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname || "/";
};

const isCatalogRoute = (pathname: string): boolean => {
  if (pathname === "/") return false;
  const segments = pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (segments.length !== 1) return false;
  return !RESERVED_TOP_LEVEL_SEGMENTS.has(segments[0].toLowerCase());
};

export default function SeoManager() {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const pathname = normalizePathname(location.pathname);
  const seoLocale = toSeoLocale(i18n.resolvedLanguage ?? i18n.language ?? "en");
  const indexRobots =
    "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

  if (pathname === "/") {
    const landingTitleStart = t("landing.hero.title_start", {
      defaultValue: "POS and inventory software for",
    });
    const landingTitleEnd = t("landing.hero.title_end", {
      defaultValue: "retail stores in Uzbekistan.",
    });
    const landingDescription = t("landing.hero.subtitle", {
      defaultValue:
        "Bozorchi helps store owners sell faster, track products, manage inventory, staff, suppliers, customers, and reports from web and mobile.",
    });

    return (
      <Seo
        title={`${landingTitleStart} ${landingTitleEnd}`.replace(/\s+/g, " ").trim()}
        description={landingDescription}
        path={pathname}
        robots={indexRobots}
        type="website"
        locale={seoLocale}
        jsonLd={createAppJsonLd({ description: landingDescription })}
      />
    );
  }

  if (pathname === "/resources" || isCatalogRoute(pathname)) {
    // Dedicated pages set their own SEO with richer metadata.
    return null;
  }

  return (
    <Seo
      title={NOINDEX_ROUTE_TITLES[pathname] ?? "Retail Management Dashboard"}
      description="Bozorchi helps retailers manage inventory, point of sale, staff, and analytics in one platform."
      path={pathname}
      robots="noindex,nofollow"
      type="website"
      locale={seoLocale}
      jsonLd={null}
    />
  );
}
