/**
 * Production Seeder Configuration
 * 
 * Centralized configuration for all seeding operations.
 * Adjust these values based on your requirements.
 */

export const SEED_CONFIG = {
    // Organization and Store
    organization: {
        name: "Bozorchi Demo",
        slug: "bozorchi-demo",
    },
    store: {
        name: "Bozorchi Main Store",
        currency: "UZS",
        address: "Tashkent, Uzbekistan",
        phone: "+998 90 123 4567",
    },

    // User credentials
    admin: {
        name: "Asadbek",
        email: "asadbek.sh220721@gmail.com",
        password: "Asadbek1877",
    },

    // Employee configuration
    employees: {
        count: 3,
        password: "Seller2024!",
        names: [
            { name: "Aziza Karimova", email: "aziza@elegantfashion.uz" },
            { name: "Bekzod Alimov", email: "bekzod@elegantfashion.uz" },
            { name: "Dilnoza Yusupova", email: "dilnoza@elegantfashion.uz" },
        ],
    },

    // Data volumes
    volumes: {
        baseProducts: 200,
        variationsPerProduct: 5, // Sizes: XS, S, M, L, XL = 1000 variations
        customers: 500,
        transactions: 8000,
        transactionHistoryDays: 730, // 2 years of transaction history
        suppliers: 20,
        audits: 36, // ~3 per month over 1 year
        writeOffs: 150,
    },

    // Transaction type distribution (percentages)
    transactionDistribution: {
        export: 60,        // Regular sales
        import: 12,        // Stock arrivals from suppliers
        return: 8,         // Customer returns
        debt: 6,           // Unpaid sales (credit)
        repayment: 4,      // Debt payments
        exchange: 4,       // Product exchanges
        adjustment: 3,     // Inventory corrections
        supplier_return: 2, // Returns to suppliers
        internal_use: 1,   // Store internal consumption
    },

    // Batch processing
    batch: {
        productBatchSize: 50,
        customerBatchSize: 100,
        transactionBatchSize: 500,
    },

    // Price ranges (in UZS)
    pricing: {
        minCostPrice: 50000,
        maxCostPrice: 500000,
        marginMin: 1.3,
        marginMax: 2.0,
    },
} as const;

export type SeedConfig = typeof SEED_CONFIG;
