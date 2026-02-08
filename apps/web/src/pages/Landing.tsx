import { useNavigate } from "react-router-dom";
import { ArrowRight, Box, CheckCircle2, Laptop, Menu, Smartphone, X, Zap } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardPreview, MobilePreview, InventoryPreview } from "@/components/LandingVisuals";
import { useTranslation } from "react-i18next";
import { useState } from "react";


export default function LandingPage() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLanguageChange = (lng: string) => {
        if (i18n.language !== lng) {
            i18n.changeLanguage(lng);
        }
    };

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="min-h-screen bg-[#F2F2F2] text-zinc-900 font-sans p-4 md:p-6 pb-0">
            {/* 1. Header & Hero Panel */}
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm relative mb-4">
                <AuroraBackground className="h-auto !bg-white">

                    {/* Navigation */}
                    <nav className="absolute top-0 w-full z-50 px-4 sm:px-6 md:px-12 py-4 md:py-8 flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-2 font-bold text-lg md:text-xl tracking-tight text-zinc-900 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <img src="/logo.svg" alt="Bozorchi Logo" className="w-7 h-7 md:w-8 md:h-8 rounded-lg" />
                            <span>Bozorchi</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
                            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-zinc-900 transition-colors">{t('landing.nav.platform', 'Platform')}</button>
                            <button onClick={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-zinc-900 transition-colors">{t('landing.nav.solutions', 'Solutions')}</button>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-4">
                            {/* Language Switcher */}
                            <div className="flex bg-zinc-100 rounded-full p-1 text-xs font-bold text-zinc-500">
                                {(['en', 'ru', 'uz'] as const).map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => handleLanguageChange(lang)}
                                        className={`px-3 py-1.5 rounded-full uppercase transition-all ${i18n.language === lang
                                            ? 'bg-white shadow-sm text-zinc-900'
                                            : 'hover:text-zinc-900'
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
                                {t('landing.nav.signin', 'Sign in')}
                            </button>
                            <button
                                onClick={() => navigate("/register")}
                                className="px-5 py-2.5 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
                            >
                                {t('landing.nav.get_started', 'Get Started')}
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 rounded-full bg-zinc-100 text-zinc-900"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </nav>

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
                                    {/* Language Switcher */}
                                    <div className="flex bg-zinc-100 rounded-full p-1 text-xs font-bold text-zinc-500 w-fit">
                                        {(['en', 'ru', 'uz'] as const).map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => handleLanguageChange(lang)}
                                                className={`px-3 py-1.5 rounded-full uppercase transition-all ${i18n.language === lang
                                                    ? 'bg-white shadow-sm text-zinc-900'
                                                    : 'hover:text-zinc-900'
                                                    }`}
                                            >
                                                {lang}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); closeMobileMenu(); }}
                                            className="text-left py-3 px-4 rounded-xl text-zinc-600 hover:bg-zinc-50 font-medium transition-colors"
                                        >
                                            {t('landing.nav.platform', 'Platform')}
                                        </button>
                                        <button
                                            onClick={() => { document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' }); closeMobileMenu(); }}
                                            className="text-left py-3 px-4 rounded-xl text-zinc-600 hover:bg-zinc-50 font-medium transition-colors"
                                        >
                                            {t('landing.nav.solutions', 'Solutions')}
                                        </button>
                                    </div>

                                    <div className="border-t border-zinc-100 pt-4 flex flex-col gap-3">
                                        <button
                                            onClick={() => { navigate("/login"); closeMobileMenu(); }}
                                            className="w-full py-3 px-4 rounded-xl text-zinc-600 hover:bg-zinc-50 font-medium transition-colors text-center"
                                        >
                                            {t('landing.nav.signin', 'Sign in')}
                                        </button>
                                        <button
                                            onClick={() => { navigate("/register"); closeMobileMenu(); }}
                                            className="w-full py-3 px-4 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors text-center"
                                        >
                                            {t('landing.nav.get_started', 'Get Started')}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Hero Content */}
                    <motion.div
                        initial={{ opacity: 0.0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: 0.3,
                            duration: 0.8,
                            ease: "easeInOut",
                        }}
                        className="pt-28 pb-12 md:pt-48 md:pb-32 container mx-auto px-4 sm:px-6 flex flex-col items-center text-center max-w-5xl relative z-10"
                    >
                        <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-zinc-100/80 backdrop-blur-sm border border-zinc-200 text-zinc-600 text-xs font-semibold mb-6 md:mb-8">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-zinc-600 font-bold">{t('landing.hero.badge', 'Bozorchi 2.0 is live')}</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-semibold tracking-tight text-zinc-900 mb-4 md:mb-8 leading-[1.15]">
                            {t('landing.hero.title_start', 'The operating system for')}<br className="hidden sm:block" />
                            <span className="text-zinc-400">{t('landing.hero.title_end', 'modern retail businesses.')}</span>
                        </h1>
                        <p className="text-base md:text-lg lg:text-xl text-zinc-500 max-w-2xl mb-8 md:mb-12 leading-relaxed px-2">
                            {t('landing.hero.subtitle', 'Streamline your entire operation from inventory to checkout. Beautiful software designed for speed, reliability, and growth.')}
                        </p>
                        <button
                            onClick={() => navigate("/register")}
                            className="group px-6 md:px-10 py-3.5 md:py-5 rounded-full bg-zinc-900 text-white text-base md:text-xl font-medium hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-2xl shadow-zinc-200"
                        >
                            {t('landing.hero.cta', 'Start your free trial')}
                            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        {/* Logo Strip */}
                        <div className="w-full py-10 flex flex-col items-center">
                            <p className="text-center text-sm font-medium text-zinc-400 mb-6 uppercase tracking-wider">
                                {t('landing.partners.title', 'Trusted by modern retailers')}
                            </p>
                            <div className="flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-500 opacity-50 hover:opacity-100 hover:scale-110 cursor-pointer">
                                <img
                                    src="/partners/lockeruz.png"
                                    alt="Locker.uz"
                                    className="h-16 w-auto object-contain mix-blend-multiply"
                                />
                            </div>
                        </div>

                    </motion.div>
                </AuroraBackground>
            </div>

            {/* 2. Feature Grid */}
            <div id="features" className="grid md:grid-cols-3 gap-4 mb-4">
                {/* Card 1 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-[2.5rem] p-10 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-500"
                >
                    <div className="w-16 h-16 rounded-2xl bg-zinc-50 flex items-center justify-center mb-6 text-zinc-900">
                        <Laptop className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{t('landing.features.cloud.title', 'Cloud Dashboard')}</h3>
                    <p className="text-zinc-500 leading-relaxed text-sm">
                        {t('landing.features.cloud.desc', 'Real-time analytics and management from any device, anywhere in the world.')}
                    </p>
                </motion.div>

                {/* Card 2 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-[2.5rem] p-10 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-500"
                >
                    <div className="w-16 h-16 rounded-2xl bg-zinc-50 flex items-center justify-center mb-6 text-zinc-900">
                        <Smartphone className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{t('landing.features.mobile.title', 'Mobile POS')}</h3>
                    <p className="text-zinc-500 leading-relaxed text-sm">
                        {t('landing.features.mobile.desc', 'Process sales on the floor. Scan barcodes and take payments instantly.')}
                    </p>
                </motion.div>

                {/* Card 3 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-[2.5rem] p-10 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-500"
                >
                    <div className="w-16 h-16 rounded-2xl bg-zinc-50 flex items-center justify-center mb-6 text-zinc-900">
                        <Box className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{t('landing.features.inventory.title', 'Smart Inventory')}</h3>
                    <p className="text-zinc-500 leading-relaxed text-sm">
                        {t('landing.features.inventory.desc', 'Automated tracking, low-stock alerts, and predictive reordering.')}
                    </p>
                </motion.div>
            </div>

            {/* 3. Showcase Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                id="showcase"
                className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-20 mb-4 overflow-hidden relative"
            >
                <div className="max-w-4xl mx-auto text-center mb-8 md:mb-16 relative z-10">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 md:mb-6 tracking-tight">
                        {t('landing.showcase.title_1', 'Powerful enough for chains.')}<br />
                        {t('landing.showcase.title_2', 'Simple enough for every store.')}
                    </h2>
                    <p className="text-base md:text-lg text-zinc-500 px-2">
                        {t('landing.showcase.subtitle', 'Experience the most intuitive retail interface ever built.')}
                    </p>
                </div>

                {/* Desktop Dashboard Preview - hidden on mobile */}
                <div className="hidden md:block relative max-w-5xl mx-auto group perspective-1000">
                    <div className="transform transition-transform duration-500 hover:rotate-x-2">
                        <DashboardPreview />
                    </div>
                </div>

                {/* Mobile Showcase - Native mobile design */}
                <div className="md:hidden space-y-4">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-zinc-900 text-white rounded-2xl p-4 text-center"
                        >
                            <div className="text-2xl font-bold">$48K</div>
                            <div className="text-[10px] text-zinc-400 uppercase tracking-wide mt-1">{t('landing.mobile.revenue', 'Revenue')}</div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-zinc-100 rounded-2xl p-4 text-center"
                        >
                            <div className="text-2xl font-bold text-zinc-900">154</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wide mt-1">{t('landing.mobile.orders', 'Orders')}</div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-zinc-100 rounded-2xl p-4 text-center"
                        >
                            <div className="text-2xl font-bold text-zinc-900">8.4K</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wide mt-1">{t('landing.mobile.products', 'Products')}</div>
                        </motion.div>
                    </div>

                    {/* Feature Cards Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-2xl p-5 aspect-square flex flex-col justify-between"
                        >
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <Laptop className="w-5 h-5 text-zinc-900" />
                            </div>
                            <div>
                                <div className="font-semibold text-zinc-900 text-sm">{t('landing.mobile.dashboard', 'Dashboard')}</div>
                                <div className="text-xs text-zinc-500 mt-1">{t('landing.mobile.dashboard_desc', 'Real-time analytics')}</div>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-2xl p-5 aspect-square flex flex-col justify-between"
                        >
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <Smartphone className="w-5 h-5 text-zinc-900" />
                            </div>
                            <div>
                                <div className="font-semibold text-zinc-900 text-sm">{t('landing.mobile.pos', 'Mobile POS')}</div>
                                <div className="text-xs text-zinc-500 mt-1">{t('landing.mobile.pos_desc', 'Sell anywhere')}</div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Chart Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-zinc-50 rounded-2xl p-5"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold text-zinc-900 text-sm">{t('landing.mobile.sales', 'Sales Analytics')}</span>
                            <span className="text-xs bg-white px-2 py-1 rounded-full text-zinc-500">{t('landing.mobile.weekly', 'Weekly')}</span>
                        </div>
                        <div className="flex items-end gap-2 h-24">
                            {[40, 65, 45, 80, 55, 70, 85].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    whileInView={{ height: `${h}%` }}
                                    transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
                                    className={`flex-1 rounded-t ${i === 6 ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-zinc-400">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                <span key={day}>{day}</span>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* 4. Split Features */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-10 md:p-16 flex flex-col justify-center overflow-hidden relative group"
                >
                    <div className="relative z-10 max-w-md">
                        <div className="mb-6 md:mb-8 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                            <Zap className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-3 md:mb-4">{t('landing.split.fast.title', 'Lightning fast transactions.')}</h3>
                        <p className="text-sm md:text-base text-zinc-500 leading-relaxed mb-6 md:mb-8">
                            {t('landing.split.fast.desc', 'Designed for high-volume retail. Process transactions in milliseconds, offline or online. Keep your lines moving.')}
                        </p>
                        <ul className="space-y-2 md:space-y-3">
                            {[
                                t('landing.split.fast.list.search', 'Sub-second search'),
                                t('landing.split.fast.list.offline', 'Offline mode'),
                                t('landing.split.fast.list.sync', 'Instant receipt sync')
                            ].map((item, i) => (
                                <motion.li
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    key={item}
                                    className="flex items-center gap-2 md:gap-3 text-xs md:text-sm font-medium text-zinc-700"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-900" /> {item}
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-10 flex flex-col items-center justify-center overflow-hidden relative group"
                >
                    <div className="scale-75 sm:scale-90 md:scale-100 transition-transform duration-500 hover:scale-105">
                        <MobilePreview />
                    </div>
                </motion.div>
            </div>

            {/* 5. Inventory Showcase */}
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-10 md:p-20 mb-4 flex flex-col md:flex-row items-center gap-8 md:gap-16 overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="flex-1 space-y-4 md:space-y-8 order-2 md:order-1"
                >
                    <div className="inline-block px-3 py-1 rounded-full bg-zinc-100 text-zinc-900 text-xs font-bold uppercase tracking-wide">
                        {t('landing.inventory.badge', 'Smart Logistics')}
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
                        {t('landing.inventory.title_start', 'Warehousing made')}<br />
                        <span className="text-zinc-400">{t('landing.inventory.title_end', 'effortless.')}</span>
                    </h2>
                    <p className="text-sm md:text-base text-zinc-500 leading-relaxed">
                        {t('landing.inventory.desc', 'Connect your physical inventory to your digital sales channels. Our predictive engine handles restocking automatically so you never miss a sale.')}
                    </p>
                </motion.div>

                {/* Desktop InventoryPreview - hidden on mobile */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="hidden md:flex flex-1 order-1 md:order-2 justify-center w-full"
                >
                    <div className="w-full max-w-md">
                        <InventoryPreview />
                    </div>
                </motion.div>

                {/* Mobile Inventory Preview - Native mobile design */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="md:hidden flex-1 order-1 w-full space-y-3"
                >
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-900 text-white rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <Box className="w-5 h-5" />
                                <span className="text-[10px] font-mono opacity-50">#8829</span>
                            </div>
                            <div className="text-2xl font-bold">1,204</div>
                            <div className="text-xs text-zinc-400">{t('landing.mobile.total_units', 'Total Units')}</div>
                        </div>
                        <div className="bg-zinc-100 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <Box className="w-5 h-5 text-zinc-900" />
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">{t('landing.mobile.in_stock', 'In Stock')}</span>
                            </div>
                            <div className="text-2xl font-bold text-zinc-900">847</div>
                            <div className="text-xs text-zinc-500">{t('landing.mobile.available', 'Available')}</div>
                        </div>
                    </div>

                    {/* Restock Alert */}
                    <div className="bg-zinc-50 rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-sm font-bold">A</div>
                            <span className="font-medium text-zinc-900 text-sm">{t('landing.mobile.restock_alert', 'Restock Alert')}</span>
                        </div>
                        <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-red-500 w-[15%] h-full" />
                        </div>
                        <div className="text-right text-xs text-red-500 mt-2 font-medium">{t('landing.mobile.low_stock', 'Low stock warning')}</div>
                    </div>
                </motion.div>
            </div>


            {/* 7. Footer CTA */}
            <div id="footer" className="bg-white rounded-t-[2rem] md:rounded-t-[2.5rem] px-4 py-12 sm:p-12 md:p-20 text-center text-zinc-900 relative overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-6 md:mb-8 relative z-10 px-2">
                        {t('landing.footer.title', 'Ready to modernize your retail business?')}
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 relative z-10">
                        <button
                            onClick={() => navigate("/register")}
                            className="w-full sm:w-auto px-6 md:px-10 py-3.5 md:py-5 rounded-full bg-zinc-900 text-white text-base md:text-xl font-bold hover:bg-zinc-800 transition-colors shadow-2xl shadow-zinc-200"
                        >
                            {t('landing.footer.cta_primary', 'Get Started Now')}
                        </button>
                        <a
                            href="mailto:sales@bozorchi.store"
                            className="w-full sm:w-auto px-6 md:px-10 py-3.5 md:py-5 rounded-full bg-transparent border border-zinc-200 text-zinc-900 text-base md:text-xl font-medium hover:bg-zinc-50 transition-colors inline-block text-center"
                        >
                            {t('landing.footer.cta_secondary', 'Contact Sales')}
                        </a>
                    </div>
                </motion.div>

                <div className="mt-12 md:mt-20 pt-8 md:pt-10 border-t border-zinc-100 flex flex-col md:flex-row gap-8 md:gap-12 text-left">
                    {/* Brand Column */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="flex-1"
                    >
                        <div className="flex items-center gap-2 font-bold text-lg md:text-xl tracking-tight text-zinc-900 mb-4 md:mb-6">
                            <img src="/logo.svg" alt="Bozorchi Logo" className="w-7 h-7 md:w-8 md:h-8 rounded-lg" />
                            <span>Bozorchi</span>
                        </div>
                        <p className="text-zinc-500 text-sm leading-relaxed mb-4 md:mb-6 max-w-xs">
                            {t('landing.footer.description', 'The all-in-one operating system for modern retail. Built for speed, designed for growth.')}
                        </p>
                        <div className="flex flex-row gap-3">
                            <a
                                href="https://apps.apple.com/uz/app/bozorchi/id6753791497"
                                target="_blank"
                                rel="noreferrer"
                                className="w-fit hover:opacity-80 transition-opacity"
                            >
                                <img src="/appstore.png" alt="Download on the App Store" className="h-8 md:h-9 w-auto" />
                            </a>
                            <a href="#" className="w-fit hover:opacity-80 transition-opacity">
                                <img src="/googleplay.png" alt="Get it on Google Play" className="h-8 md:h-9 w-auto" />
                            </a>
                        </div>
                    </motion.div>

                    {/* Links Columns */}
                    <div className="grid grid-cols-3 gap-4 sm:gap-8 md:gap-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <h4 className="font-semibold text-zinc-900 mb-3 md:mb-4 text-sm md:text-base">{t('landing.footer.col.platform', 'Platform')}</h4>
                            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-zinc-500">
                                <li><a href="#" className="hover:text-zinc-900 transition-colors">Overview</a></li>
                                <li><a href="#" className="hover:text-zinc-900 transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-zinc-900 transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-zinc-900 transition-colors">Enterprise</a></li>
                            </ul>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                        >
                            <h4 className="font-semibold text-zinc-900 mb-3 md:mb-4 text-sm md:text-base">{t('landing.footer.col.company', 'Company')}</h4>
                            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-zinc-500">
                                <li><a href="#" className="hover:text-zinc-900 transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-zinc-900 transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-zinc-900 transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-zinc-900 transition-colors">Contact</a></li>
                            </ul>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                        >
                            <h4 className="font-semibold text-zinc-900 mb-3 md:mb-4 text-sm md:text-base">{t('landing.footer.col.legal', 'Legal')}</h4>
                            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-zinc-500">
                                <li><a href="#" className="hover:text-zinc-900 transition-colors">Privacy</a></li>
                                <li><a href="#" className="hover:text-zinc-900 transition-colors">Terms</a></li>
                                <li><a href="#" className="hover:text-zinc-900 transition-colors">Security</a></li>
                            </ul>
                        </motion.div>
                    </div>
                </div>

                <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center text-xs text-zinc-400 font-medium gap-3">
                    <p className="text-center md:text-left">© {new Date().getFullYear()} Bozorchi Inc. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600">LinkedIn</a>
                        <a href="https://instagram.com/bozorchi_hq" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600">Instagram</a>
                    </div>
                </div>
            </div>

        </div>
    );
}
