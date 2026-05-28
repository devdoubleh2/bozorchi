import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Laptop,
  Menu,
  Smartphone,
  X,
  Zap,
  Star,
  Mail,
  ArrowUpRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DashboardPreview,
  MobilePreview,
  InventoryPreview,
} from "@/components/LandingVisuals";
import { useTranslation } from "react-i18next";
import { useState } from "react";

// =============================================================================
// DATA
// =============================================================================

const TESTIMONIALS = [
  {
    quote:
      "We switched from spreadsheets and never looked back. Bozorchi just works the way our team actually thinks.",
    author: "Dilshod K.",
    role: "Owner, Home Goods Store",
    rating: 5,
  },
  {
    quote:
      "I needed something my staff could learn in an afternoon. By day two they were processing sales faster than our old system.",
    author: "Nodira T.",
    role: "Manager, Fashion Boutique",
    rating: 5,
  },
  {
    quote:
      "The inventory alerts alone saved us from two stockouts last month. It pays for itself.",
    author: "Rustam B.",
    role: "Operations, Electronics Chain",
    rating: 5,
  },
];

const COMPARISON_ROWS = [
  {
    label: "Time to first sale",
    bozorchi: "Under 10 minutes",
    old: "Days of setup",
    big: "Months of onboarding",
  },
  {
    label: "Works offline",
    bozorchi: "Yes",
    old: "No",
    big: "Sometimes",
  },
  {
    label: "Staff training",
    bozorchi: "Self-explanatory",
    old: "None (chaos)",
    big: "Expensive courses",
  },
  {
    label: "Monthly cost",
    bozorchi: "Transparent",
    old: "Hidden mistakes",
    big: "Locked contracts",
  },
  {
    label: "Support",
    bozorchi: "Real humans",
    old: "YouTube tutorials",
    big: "Tickets & queues",
  },
];

const VALUES = [
  {
    title: "Built for the floor, not the boardroom.",
    desc: "We design every screen for people who are standing, moving, and multitasking. If it doesn't work on a busy Saturday, we don't ship it.",
  },
  {
    title: "Your data is yours.",
    desc: "No lock-in, no mysterious black boxes. Export anything, anytime. We believe tools should serve you, not trap you.",
  },
  {
    title: "Small teams deserve great software.",
    desc: "You don't need an IT department to run a modern store. We built Bozorchi so one person can set it up and a team can run it.",
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function LandingPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState("");

  const handleLanguageChange = (lng: string) => {
    if (i18n.language !== lng) {
      i18n.changeLanguage(lng);
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#F2F2F2] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      {/* =====================================================================
          NAVIGATION
          ===================================================================== */}
      <header className="fixed top-0 left-0 right-0 z-50">
        {/*
          Apple-style frosted glass header — 6 physical strips, top-to-bottom.
          Each strip is positioned to its own band so backdrop-filter only
          blurs that band (no bleeding). Opacity fades 1.0 → 0.7 for smoothness.
        */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Strip 1 — top 0-16.67% : 100% */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: "0%",
              height: "calc(100% / 6)",
              opacity: 1,
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              backdropFilter: "blur(20px) saturate(180%)",
            }}
          />
          {/* Strip 2 — 16.67-33.33% : 94% */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: "calc(100% / 6)",
              height: "calc(100% / 6)",
              opacity: 0.94,
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              backdropFilter: "blur(20px) saturate(180%)",
            }}
          />
          {/* Strip 3 — 33.33-50% : 88% */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: "calc(200% / 6)",
              height: "calc(100% / 6)",
              opacity: 0.88,
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              backdropFilter: "blur(20px) saturate(180%)",
            }}
          />
          {/* Strip 4 — 50-66.67% : 82% */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: "calc(300% / 6)",
              height: "calc(100% / 6)",
              opacity: 0.82,
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              backdropFilter: "blur(20px) saturate(180%)",
            }}
          />
          {/* Strip 5 — 66.67-83.33% : 76% */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: "calc(400% / 6)",
              height: "calc(100% / 6)",
              opacity: 0.76,
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              backdropFilter: "blur(20px) saturate(180%)",
            }}
          />
          {/* Strip 6 — 83.33-100% : 70% */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: "calc(500% / 6)",
              height: "calc(100% / 6)",
              opacity: 0.7,
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              backdropFilter: "blur(20px) saturate(180%)",
            }}
          />
        </div>

        <nav className="relative z-10 px-4 sm:px-6 md:px-12 py-4 md:py-6 flex items-center justify-between max-w-[1440px] mx-auto">
          <div
            className="flex items-center gap-2 font-bold text-lg md:text-xl tracking-tight text-zinc-900 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <img
              src="/logo.svg"
              alt="Bozorchi Logo"
              className="w-7 h-7 md:w-8 md:h-8 rounded-lg"
            />
            <span>Bozorchi</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
            <button
              onClick={() =>
                document
                  .getElementById("philosophy")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-zinc-900 transition-colors"
            >
              {t("landing.nav.philosophy", "Philosophy")}
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("showcase")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-zinc-900 transition-colors"
            >
              {t("landing.nav.solutions", "Solutions")}
            </button>
            <button
              onClick={() => navigate("/resources")}
              className="hover:text-zinc-900 transition-colors"
            >
              {t("landing.nav.resources", "Resources")}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex bg-white/80 backdrop-blur rounded-full p-1 text-xs font-bold text-zinc-500 border border-zinc-200/60">
              {(["en", "ru", "uz"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`px-3 py-1.5 rounded-full uppercase transition-all ${
                    i18n.language === lang
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "hover:text-zinc-900"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              {t("landing.nav.signin", "Sign in")}
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-5 py-2.5 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              {t("landing.nav.get_started", "Get Started")}
            </button>
          </div>

          <button
            className="md:hidden p-2 rounded-full bg-white/80 backdrop-blur border border-zinc-200/60 text-zinc-900"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden mx-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-zinc-100 p-6 flex flex-col gap-4">
              <div className="flex bg-zinc-100 rounded-full p-1 text-xs font-bold text-zinc-500 w-fit">
                {(["en", "ru", "uz"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`px-3 py-1.5 rounded-full uppercase transition-all ${
                      i18n.language === lang
                        ? "bg-white shadow-sm text-zinc-900"
                        : "hover:text-zinc-900"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    document
                      .getElementById("philosophy")
                      ?.scrollIntoView({ behavior: "smooth" });
                    closeMobileMenu();
                  }}
                  className="text-left py-3 px-4 rounded-xl text-zinc-600 hover:bg-zinc-50 font-medium transition-colors"
                >
                  {t("landing.nav.philosophy", "Philosophy")}
                </button>
                <button
                  onClick={() => {
                    document
                      .getElementById("showcase")
                      ?.scrollIntoView({ behavior: "smooth" });
                    closeMobileMenu();
                  }}
                  className="text-left py-3 px-4 rounded-xl text-zinc-600 hover:bg-zinc-50 font-medium transition-colors"
                >
                  {t("landing.nav.solutions", "Solutions")}
                </button>
                <button
                  onClick={() => {
                    navigate("/resources");
                    closeMobileMenu();
                  }}
                  className="text-left py-3 px-4 rounded-xl text-zinc-600 hover:bg-zinc-50 font-medium transition-colors"
                >
                  {t("landing.nav.resources", "Resources")}
                </button>
              </div>
              <div className="border-t border-zinc-100 pt-4 flex flex-col gap-3">
                <button
                  onClick={() => {
                    navigate("/login");
                    closeMobileMenu();
                  }}
                  className="w-full py-3 px-4 rounded-xl text-zinc-600 hover:bg-zinc-50 font-medium transition-colors text-center"
                >
                  {t("landing.nav.signin", "Sign in")}
                </button>
                <button
                  onClick={() => {
                    navigate("/register");
                    closeMobileMenu();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors text-center"
                >
                  {t("landing.nav.get_started", "Get Started")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          HERO
          ===================================================================== */}
      <section className="relative pt-32 pb-16 md:pt-48 md:pb-32 px-4 sm:px-6 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl"
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight text-zinc-900 mb-6 md:mb-8 leading-[1.1]">
            {t(
              "landing.hero.title",
              "Software your retail team will actually want to use."
            )}
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mb-10 md:mb-14 leading-relaxed">
            {t(
              "landing.hero.subtitle",
              "Bozorchi is the operating system for modern retail. No fluff, no steep learning curve — just the tools you need to sell more and worry less."
            )}
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={() => navigate("/register")}
              className="group px-8 py-4 rounded-full bg-zinc-900 text-white text-base font-medium hover:bg-zinc-800 transition-all duration-300 flex items-center gap-2 shadow-xl shadow-zinc-200"
            >
              {t("landing.hero.cta", "Start your free trial")}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="mailto:sales@bozorchi.store"
              className="px-8 py-4 rounded-full border border-zinc-300 text-zinc-700 text-base font-medium hover:bg-white hover:border-zinc-400 transition-all"
            >
              {t("landing.hero.cta_secondary", "Talk to a human")}
            </a>
          </div>
        </motion.div>

        {/* Partner strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-20 md:mt-28 pt-10 border-t border-zinc-200/60"
        >
          <p className="text-sm font-medium text-zinc-400 mb-6 uppercase tracking-wider">
            {t("landing.partners.title", "Trusted by modern retailers")}
          </p>
          <div className="flex items-center gap-8">
            <img
              src="/partners/lockeruz.png"
              alt="Locker.uz"
              className="h-10 md:h-12 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
            />
          </div>
        </motion.div>
      </section>

      {/* =====================================================================
          SHOWCASE — DASHBOARD PREVIEW
          ===================================================================== */}
      <section
        id="showcase"
        className="px-4 sm:px-6 md:px-12 max-w-[1440px] mx-auto mb-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-16 lg:p-20 overflow-hidden"
        >
          <div className="max-w-3xl mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-semibold tracking-tight mb-4 md:mb-6">
              {t(
                "landing.showcase.title",
                "Everything you need. Nothing you don't."
              )}
            </h2>
            <p className="text-base md:text-lg text-zinc-500 leading-relaxed">
              {t(
                "landing.showcase.subtitle",
                "A clean, focused interface that your team will understand in minutes — not weeks."
              )}
            </p>
          </div>

          <div className="hidden md:block relative max-w-5xl mx-auto">
            <DashboardPreview />
          </div>

          {/* Mobile showcase */}
          <div className="md:hidden space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: t("landing.mobile.revenue", "Revenue"),
                  val: "$48K",
                  dark: true,
                },
                {
                  label: t("landing.mobile.orders", "Orders"),
                  val: "154",
                  dark: false,
                },
                {
                  label: t("landing.mobile.products", "Products"),
                  val: "8.4K",
                  dark: false,
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className={`rounded-2xl p-4 text-center ${
                    stat.dark
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-900"
                  }`}
                >
                  <div className="text-2xl font-bold">{stat.val}</div>
                  <div className="text-[10px] opacity-50 uppercase tracking-wide mt-1">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-2xl p-5 aspect-square flex flex-col justify-between">
                <Laptop className="w-5 h-5 text-zinc-900" />
                <div>
                  <div className="font-semibold text-zinc-900 text-sm">
                    Dashboard
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Real-time analytics
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-2xl p-5 aspect-square flex flex-col justify-between">
                <Smartphone className="w-5 h-5 text-zinc-900" />
                <div>
                  <div className="font-semibold text-zinc-900 text-sm">
                    Mobile POS
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Sell anywhere
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-zinc-50 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-zinc-900 text-sm">
                  Sales Analytics
                </span>
                <span className="text-xs bg-white px-2 py-1 rounded-full text-zinc-500">
                  Weekly
                </span>
              </div>
              <div className="flex items-end gap-2 h-24">
                {[40, 65, 45, 80, 55, 70, 85].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
                    className={`flex-1 rounded-t ${
                      i === 6 ? "bg-zinc-900" : "bg-zinc-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* =====================================================================
          PHILOSOPHY / VALUES
          ===================================================================== */}
      <section
        id="philosophy"
        className="px-4 sm:px-6 md:px-12 max-w-[1440px] mx-auto mb-4"
      >
        <div className="bg-zinc-900 text-white rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-16 lg:p-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mb-16 md:mb-24"
          >
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-4">
              {t("landing.philosophy.label", "Why we build")}
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-semibold tracking-tight leading-[1.15]">
              {t(
                "landing.philosophy.title",
                "We make software we're proud of."
              )}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {VALUES.map((val, i) => (
              <motion.div
                key={val.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 * i }}
                className="border-t border-zinc-700 pt-6"
              >
                <h3 className="text-lg md:text-xl font-semibold mb-3">
                  {val.title}
                </h3>
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                  {val.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          FEATURES
          ===================================================================== */}
      <section className="px-4 sm:px-6 md:px-12 max-w-[1440px] mx-auto mb-4">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: Laptop,
              title: t("landing.features.cloud.title", "Cloud Dashboard"),
              desc: t(
                "landing.features.cloud.desc",
                "Real-time analytics and management from any device, anywhere in the world."
              ),
            },
            {
              icon: Smartphone,
              title: t("landing.features.mobile.title", "Mobile POS"),
              desc: t(
                "landing.features.mobile.desc",
                "Process sales on the floor. Scan barcodes and take payments instantly."
              ),
            },
            {
              icon: Box,
              title: t("landing.features.inventory.title", "Smart Inventory"),
              desc: t(
                "landing.features.inventory.desc",
                "Automated tracking, low-stock alerts, and predictive reordering."
              ),
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className="bg-white rounded-[2.5rem] p-10 flex flex-col items-start hover:shadow-lg transition-shadow duration-500"
            >
              <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center mb-6 text-zinc-900">
                <card.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{card.title}</h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          COMPARISON
          ===================================================================== */}
      <section className="px-4 sm:px-6 md:px-12 max-w-[1440px] mx-auto mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-16 lg:p-20"
        >
          <div className="max-w-3xl mb-12 md:mb-16">
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-4">
              {t("landing.compare.label", "The difference")}
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-semibold tracking-tight">
              {t("landing.compare.title", "Why teams switch to Bozorchi.")}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="pb-4 text-sm font-medium text-zinc-400 uppercase tracking-wider w-1/3">
                    {t("landing.compare.col.feature", "Feature")}
                  </th>
                  <th className="pb-4 text-sm font-semibold text-zinc-900 uppercase tracking-wider w-1/3">
                    Bozorchi
                  </th>
                  <th className="pb-4 text-sm font-medium text-zinc-400 uppercase tracking-wider w-1/6">
                    {t("landing.compare.col.spreadsheets", "Spreadsheets")}
                  </th>
                  <th className="pb-4 text-sm font-medium text-zinc-400 uppercase tracking-wider w-1/6">
                    {t("landing.compare.col.big_erp", "Big ERP")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-zinc-100">
                    <td className="py-5 text-sm font-medium text-zinc-900">
                      {row.label}
                    </td>
                    <td className="py-5 text-sm font-semibold text-zinc-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-zinc-900" />
                      {row.bozorchi}
                    </td>
                    <td className="py-5 text-sm text-zinc-400">{row.old}</td>
                    <td className="py-5 text-sm text-zinc-400">{row.big}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* =====================================================================
          SPLIT — SPEED + MOBILE PREVIEW
          ===================================================================== */}
      <section className="px-4 sm:px-6 md:px-12 max-w-[1440px] mx-auto mb-4">
        <div className="grid md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-16 flex flex-col justify-center"
          >
            <div className="mb-6 md:mb-8 w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-2xl md:text-3xl font-semibold mb-4">
              {t("landing.split.fast.title", "Lightning fast transactions.")}
            </h3>
            <p className="text-zinc-500 leading-relaxed mb-8">
              {t(
                "landing.split.fast.desc",
                "Designed for high-volume retail. Process transactions in milliseconds, offline or online. Keep your lines moving."
              )}
            </p>
            <ul className="space-y-3">
              {[
                t("landing.split.fast.list.search", "Sub-second search"),
                t("landing.split.fast.list.offline", "Offline mode"),
                t("landing.split.fast.list.sync", "Instant receipt sync"),
              ].map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-center gap-3 text-sm font-medium text-zinc-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-zinc-900" /> {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-10 flex flex-col items-center justify-center overflow-hidden"
          >
            <div className="scale-75 sm:scale-90 md:scale-100 transition-transform duration-500 hover:scale-105">
              <MobilePreview />
            </div>
          </motion.div>
        </div>
      </section>

      {/* =====================================================================
          INVENTORY SHOWCASE
          ===================================================================== */}
      <section className="px-4 sm:px-6 md:px-12 max-w-[1440px] mx-auto mb-4">
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-16 lg:p-20 flex flex-col md:flex-row items-center gap-12 md:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1 order-2 md:order-1"
          >
            <div className="inline-block px-3 py-1 rounded-full bg-zinc-100 text-zinc-900 text-xs font-bold uppercase tracking-wide mb-6">
              {t("landing.inventory.badge", "Smart Logistics")}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-6">
              {t("landing.inventory.title", "Warehousing made effortless.")}
            </h2>
            <p className="text-zinc-500 leading-relaxed mb-8">
              {t(
                "landing.inventory.desc",
                "Connect your physical inventory to your digital sales channels. Our predictive engine handles restocking automatically so you never miss a sale."
              )}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: t("landing.mobile.total_units", "Total Units"),
                  val: "1,204",
                },
                { label: t("landing.mobile.in_stock", "In Stock"), val: "847" },
              ].map((s) => (
                <div key={s.label} className="bg-zinc-50 rounded-2xl p-5">
                  <div className="text-2xl font-bold text-zinc-900 mb-1">
                    {s.val}
                  </div>
                  <div className="text-xs text-zinc-500">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1 order-1 md:order-2 w-full max-w-md"
          >
            <InventoryPreview />
          </motion.div>
        </div>
      </section>

      {/* =====================================================================
          TESTIMONIALS
          ===================================================================== */}
      <section className="px-4 sm:px-6 md:px-12 max-w-[1440px] mx-auto mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-16 lg:p-20"
        >
          <div className="max-w-3xl mb-12 md:mb-16">
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-4">
              {t("landing.testimonials.label", "Trusted by retailers")}
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-semibold tracking-tight">
              {t(
                "landing.testimonials.title",
                "People who notice the details."
              )}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {TESTIMONIALS.map((tmo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i }}
                className="border border-zinc-100 rounded-3xl p-6 md:p-8 flex flex-col"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: tmo.rating }).map((_, ri) => (
                    <Star
                      key={ri}
                      className="w-4 h-4 fill-zinc-900 text-zinc-900"
                    />
                  ))}
                </div>
                <p className="text-zinc-700 text-sm md:text-base leading-relaxed flex-1 mb-6">
                  "{tmo.quote}"
                </p>
                <div>
                  <div className="font-semibold text-zinc-900 text-sm">
                    {tmo.author}
                  </div>
                  <div className="text-xs text-zinc-400">{tmo.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* =====================================================================
          NEWSLETTER
          ===================================================================== */}
      <section className="px-4 sm:px-6 md:px-12 max-w-[1440px] mx-auto mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-zinc-100 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-16 lg:p-20 text-center"
        >
          <div className="max-w-xl mx-auto">
            <Mail className="w-8 h-8 text-zinc-900 mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              {t("landing.newsletter.title", "Stay in the loop.")}
            </h2>
            <p className="text-zinc-500 mb-8">
              {t(
                "landing.newsletter.subtitle",
                "No spam, no weekly roundups. Just a few emails a year when we ship something worth sharing."
              )}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = `mailto:sales@bozorchi.store?subject=Keep me in the loop&body=Email: ${email}`;
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                placeholder={t(
                  "landing.newsletter.placeholder",
                  "you@store.com"
                )}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-5 py-3.5 rounded-full bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3.5 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
              >
                {t("landing.newsletter.cta", "Subscribe")}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </section>

      {/* =====================================================================
          FOOTER CTA + LINKS
          ===================================================================== */}
      <footer className="bg-white rounded-t-[2rem] md:rounded-t-[2.5rem] px-4 sm:px-6 md:px-12 pt-16 md:pt-24 pb-10 md:pb-12 max-w-[1440px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20 md:mb-28"
        >
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-tight mb-6 md:mb-8 px-2">
            {t(
              "landing.footer.title",
              "Ready to modernize your retail business?"
            )}
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto mb-8 md:mb-10">
            {t(
              "landing.footer.subtitle",
              "Join the stores that have already made the switch. Free trial, no credit card required."
            )}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            <button
              onClick={() => navigate("/register")}
              className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-full bg-zinc-900 text-white text-base md:text-lg font-medium hover:bg-zinc-800 transition-colors shadow-xl shadow-zinc-200"
            >
              {t("landing.footer.cta_primary", "Get Started Now")}
            </button>
            <a
              href="mailto:sales@bozorchi.store"
              className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-full bg-transparent border border-zinc-200 text-zinc-900 text-base md:text-lg font-medium hover:bg-zinc-50 transition-colors inline-block text-center"
            >
              {t("landing.footer.cta_secondary", "Contact Sales")}
            </a>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 border-t border-zinc-100 pt-12">
          {/* Brand */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-zinc-900 mb-4">
              <img
                src="/logo.svg"
                alt="Bozorchi Logo"
                className="w-7 h-7 rounded-lg"
              />
              <span>Bozorchi</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6 max-w-xs">
              {t(
                "landing.footer.description",
                "The all-in-one operating system for modern retail. Built for speed, designed for growth."
              )}
            </p>
            <div className="flex flex-row gap-3">
              <a
                href="https://apps.apple.com/uz/app/bozorchi/id6753791497"
                target="_blank"
                rel="noreferrer"
                className="w-fit hover:opacity-80 transition-opacity"
              >
                <img
                  src="/appstore.png"
                  alt="Download on the App Store"
                  className="h-8 md:h-9 w-auto"
                />
              </a>
              <a href="#" className="w-fit hover:opacity-80 transition-opacity">
                <img
                  src="/googleplay.png"
                  alt="Get it on Google Play"
                  className="h-8 md:h-9 w-auto"
                />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-2 md:col-start-6">
            <h4 className="font-semibold text-zinc-900 mb-4 text-sm">
              {t("landing.footer.col.platform", "Platform")}
            </h4>
            <ul className="space-y-3 text-sm text-zinc-500">
              <li>
                <button
                  onClick={() =>
                    document
                      .getElementById("showcase")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="hover:text-zinc-900 transition-colors"
                >
                  {t("landing.footer.link.features", "Features")}
                </button>
              </li>
              <li>
                <a href="#" className="hover:text-zinc-900 transition-colors">
                  {t("landing.footer.link.pricing", "Pricing")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-zinc-900 transition-colors">
                  {t("landing.footer.link.security", "Security")}
                </a>
              </li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="font-semibold text-zinc-900 mb-4 text-sm">
              {t("landing.footer.col.company", "Company")}
            </h4>
            <ul className="space-y-3 text-sm text-zinc-500">
              <li>
                <a href="#" className="hover:text-zinc-900 transition-colors">
                  {t("landing.footer.link.about", "About")}
                </a>
              </li>
              <li>
                <a
                  href="/resources"
                  className="hover:text-zinc-900 transition-colors"
                >
                  {t("landing.footer.link.resources", "Resources")}
                </a>
              </li>
              <li>
                <a
                  href="mailto:sales@bozorchi.store"
                  className="hover:text-zinc-900 transition-colors"
                >
                  {t("landing.footer.link.contact", "Contact")}
                </a>
              </li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="font-semibold text-zinc-900 mb-4 text-sm">
              {t("landing.footer.col.legal", "Legal")}
            </h4>
            <ul className="space-y-3 text-sm text-zinc-500">
              <li>
                <a href="#" className="hover:text-zinc-900 transition-colors">
                  {t("landing.footer.link.privacy", "Privacy")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-zinc-900 transition-colors">
                  {t("landing.footer.link.terms", "Terms")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center text-xs text-zinc-400 font-medium gap-3">
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} Bozorchi Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-600"
            >
              LinkedIn
            </a>
            <a
              href="https://instagram.com/bozorchi_hq"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-600"
            >
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
