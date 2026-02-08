import { Users, ShoppingCart, Activity, Search, Menu, Bell, TrendingUp, Package, Home, Settings } from "lucide-react";
import { motion } from "framer-motion";

export const DashboardPreview = () => (
    <div className="w-full aspect-[16/10] bg-white rounded-xl shadow-2xl border border-zinc-100 overflow-hidden flex text-left text-zinc-900">
        {/* Sidebar - hidden on small screens */}
        <div className="w-48 lg:w-64 bg-zinc-50 border-r border-zinc-100 p-4 lg:p-6 flex-col gap-4 lg:gap-6 hidden md:flex">
            <div className="flex items-center gap-2 text-zinc-900 font-bold mb-2 lg:mb-4">
                <div className="w-5 h-5 lg:w-6 lg:h-6 bg-zinc-900 rounded-md" />
                <span className="text-sm lg:text-base">Bozorchi</span>
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-1.5 lg:py-2 bg-white rounded-lg shadow-sm text-xs lg:text-sm font-medium border border-zinc-100 text-zinc-900">
                    <Home className="w-3 h-3 lg:w-4 lg:h-4" /> Dashboard
                </div>
                {[Package, Users, ShoppingCart, Activity, Settings].map((Icon, i) => (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        key={i}
                        className="flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-1.5 lg:py-2 text-zinc-400 hover:text-zinc-600 text-xs lg:text-sm font-medium transition-colors cursor-pointer"
                        whileHover={{ scale: 1.02, x: 4 }}
                    >
                        <Icon className="w-3 h-3 lg:w-4 lg:h-4" /> {['Products', 'Customers', 'Orders', 'Reports', 'Settings'][i]}
                    </motion.div>
                ))}
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white">
            {/* Header */}
            <div className="h-12 lg:h-16 border-b border-zinc-50 flex items-center justify-between px-4 lg:px-8">
                <div className="text-xs lg:text-sm font-semibold text-zinc-800">Overview</div>
                <div className="flex items-center gap-2 lg:gap-4">
                    <Search className="w-3 h-3 lg:w-4 lg:h-4 text-zinc-300" />
                    <Bell className="w-3 h-3 lg:w-4 lg:h-4 text-zinc-300" />
                    <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-zinc-100" />
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="p-4 lg:p-8 bg-zinc-[0.5] flex-1 overflow-hidden">
                <div className="grid grid-cols-3 gap-3 lg:gap-6 mb-4 lg:mb-8">
                    {[
                        { label: 'Total Revenue', val: '$48,290', change: '+12%', color: 'bg-zinc-900 text-white' },
                        { label: 'Active Orders', val: '154', change: '+3%', color: 'bg-white border border-zinc-100' },
                        { label: 'Inventory', val: '8,430', change: '-2%', color: 'bg-white border border-zinc-100' }
                    ].map((stat, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (0.1 * i) }}
                            key={i}
                            className={`p-3 lg:p-6 rounded-xl lg:rounded-2xl ${stat.color} shadow-sm`}
                            whileHover={{ y: -4 }}
                        >
                            <div className="text-[10px] lg:text-xs opacity-60 mb-1 lg:mb-2 uppercase tracking-wide">{stat.label}</div>
                            <div className="text-base lg:text-2xl font-bold mb-2 lg:mb-4">{stat.val}</div>
                            <div className="flex items-center gap-1 text-[10px] lg:text-xs font-medium">
                                <TrendingUp className="w-2.5 h-2.5 lg:w-3 lg:h-3" /> {stat.change}
                            </div>
                        </motion.div>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-3 lg:gap-6 h-full">
                    <div className="bg-zinc-50 rounded-xl lg:rounded-2xl border border-zinc-100 p-3 lg:p-6">
                        <div className="flex justify-between items-center mb-3 lg:mb-6">
                            <div className="font-semibold text-xs lg:text-sm">Sales Analytics</div>
                            <div className="text-[10px] lg:text-xs text-zinc-400 bg-white px-1.5 lg:px-2 py-0.5 lg:py-1 rounded border border-zinc-200">Weekly</div>
                        </div>
                        <div className="flex items-end gap-1 lg:gap-2 h-16 lg:h-32 px-1 lg:px-2 pb-1 lg:pb-2">
                            {[40, 65, 45, 80, 55, 70, 60].map((h, i) => (
                                <div key={i} className="flex-1 bg-zinc-200 rounded-t-sm hover:bg-zinc-900 transition-colors" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl lg:rounded-2xl border border-zinc-100 p-3 lg:p-6">
                        <div className="font-semibold text-xs lg:text-sm mb-2 lg:mb-4">Recent Transactions</div>
                        <div className="space-y-2 lg:space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center justify-between text-xs lg:text-sm">
                                    <div className="flex items-center gap-1.5 lg:gap-3">
                                        <div className="w-5 h-5 lg:w-8 lg:h-8 rounded-full bg-zinc-50" />
                                        <div>
                                            <div className="font-medium text-zinc-900 border-l-2 border-zinc-900 pl-1 lg:pl-2 text-[10px] lg:text-sm">Order #3920{i}</div>
                                            <div className="text-[8px] lg:text-xs text-zinc-400 pl-1 lg:pl-2">Just now</div>
                                        </div>
                                    </div>
                                    <div className="font-medium text-[10px] lg:text-sm">+$120.00</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export const MobilePreview = () => (
    <div className="relative mx-auto border-zinc-900 bg-zinc-900 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl flex flex-col overflow-hidden">
        <div className="h-[32px] w-[3px] bg-zinc-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
        <div className="h-[46px] w-[3px] bg-zinc-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
        <div className="h-[46px] w-[3px] bg-zinc-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
        <div className="h-[64px] w-[3px] bg-zinc-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
        <div className="rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-white dark:bg-zinc-800 flex flex-col">
            {/* App Header */}
            <div className="bg-zinc-50 p-4 pt-12 text-zinc-900 flex justify-between items-center border-b border-zinc-100">
                <Menu className="w-5 h-5" />
                <span className="font-bold text-sm tracking-tight">POS Mode</span>
                <div className="w-8 h-8 bg-zinc-200 rounded-full" />
            </div>
            {/* App Grid */}
            <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto hide-scrollbar">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * i }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        key={i}
                        className="bg-zinc-50 rounded-xl p-3 flex flex-col gap-2 aspect-square justify-between group cursor-pointer hover:bg-zinc-100 transition-colors"
                    >
                        <div className="w-full aspect-video bg-white rounded-lg border border-zinc-100 group-hover:border-zinc-300 transition-colors" />
                        <div className="h-2 w-2/3 bg-zinc-200 rounded group-hover:bg-zinc-300 transition-colors" />
                        <div className="h-2 w-1/3 bg-zinc-200 rounded" />
                    </motion.div>
                ))}
            </div>
            {/* App Footer */}
            <div className="mt-auto bg-zinc-900 text-white p-4 m-2 rounded-xl flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400">3 Items</span>
                    <span className="font-bold">$24.50</span>
                </div>
                <div className="px-4 py-2 bg-white text-zinc-900 text-xs font-bold rounded-lg hover:bg-zinc-100 transition-colors">Checkout</div>
            </div>
        </div>
    </div>
);

export const InventoryPreview = () => (
    <div className="w-full aspect-square relative">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-4 p-4">
            {/* In Stock Card */}
            <div className="bg-white border rounded-2xl shadow-lg p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="flex justify-between items-start">
                    <Package className="w-7 h-7 text-zinc-900" />
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">In Stock</span>
                </div>
                <div className="space-y-2 mt-auto">
                    <div className="h-2 w-full bg-zinc-100 rounded" />
                    <div className="h-2 w-2/3 bg-zinc-100 rounded" />
                </div>
            </div>

            {/* Total Units Card */}
            <div className="bg-zinc-900 rounded-2xl shadow-2xl p-5 flex flex-col gap-3 text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="flex justify-between items-center">
                    <Activity className="w-5 h-5" />
                    <span className="text-xs font-mono opacity-50">#8829</span>
                </div>
                <div className="mt-auto">
                    <div className="text-2xl font-bold">1,204</div>
                    <div className="text-xs text-zinc-400">Total Units</div>
                </div>
            </div>

            {/* Restock Alert Card - spans 2 columns */}
            <div className="col-span-2 bg-white border border-zinc-200 rounded-2xl p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center font-bold">A</div>
                    <div className="text-sm font-medium">Restock Alert</div>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-red-500 w-[15%] h-full" />
                </div>
                <div className="text-right text-xs text-red-500 mt-2 font-bold">Low stock</div>
            </div>
        </div>
    </div>
);
