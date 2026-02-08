/**
 * Production Database Seeder
 * 
 * Main entry point for seeding a clothing store demo account.
 * 
 * Usage: 
 *   bun run seed:production         # Seed new data (skips existing)
 *   bun run seed:production --clear # Clear all data and reseed
 * 
 * This script will:
 * 1. Create admin user and seller employees
 * 2. Setup organization and store
 * 3. Create 1000+ products with variations
 * 4. Create 500+ customers with loyalty cards
 * 5. Generate 8000+ historical transactions (all types)
 * 6. Create inventory audits and write-offs
 * 7. Add supplier data for import transactions
 */

import { prisma } from "../../src/lib/prisma";
import { logger } from "./logger";
import { SEED_CONFIG } from "./config";
import { clearSeedData } from "./clear";
import { seedUsers } from "./seeders/users";
import { seedProducts } from "./seeders/products";
import { seedCustomers } from "./seeders/customers";
import { seedSuppliers } from "./seeders/suppliers";
import { seedTransactions } from "./seeders/transactions";
import { seedAudits } from "./seeders/audits";
import { seedWriteOffs } from "./seeders/writeoffs";

const shouldClear = process.argv.includes("--clear");

async function main() {
    logger.init();

    console.log("\n" + "=".repeat(70));
    console.log("BOZORCHI/SP PRODUCTION SEEDER");
    console.log("=".repeat(70));

    console.log("\nConfiguration:");
    console.log(`  Organization: ${SEED_CONFIG.organization.name}`);
    console.log(`  Store: ${SEED_CONFIG.store.name}`);
    console.log(`  Target Products: ${SEED_CONFIG.volumes.baseProducts * SEED_CONFIG.volumes.variationsPerProduct} variations`);
    console.log(`  Target Customers: ${SEED_CONFIG.volumes.customers}`);
    console.log(`  Target Transactions: ${SEED_CONFIG.volumes.transactions}`);
    console.log(`  Target Suppliers: ${SEED_CONFIG.volumes.suppliers}`);
    console.log(`  Target Audits: ${SEED_CONFIG.volumes.audits}`);
    console.log(`  Target Write-offs: ${SEED_CONFIG.volumes.writeOffs}`);
    console.log(`  History Period: ${SEED_CONFIG.volumes.transactionHistoryDays} days (~${Math.round(SEED_CONFIG.volumes.transactionHistoryDays / 365)} years)`);
    console.log(`  Clear Mode: ${shouldClear ? "YES" : "NO"}`);
    console.log("");

    try {
        // Step 0: Clear existing data if requested
        if (shouldClear) {
            console.log("\n" + "-".repeat(70));
            console.log("CLEARING EXISTING DATA...");
            console.log("-".repeat(70) + "\n");
            await clearSeedData();
        }

        // Step 1: Users and Organization
        const userResult = await seedUsers();

        // Step 2: Products
        await seedProducts({
            organizationId: userResult.organizationId,
            storeId: userResult.storeId,
        });

        // Step 3: Customers
        await seedCustomers({
            organizationId: userResult.organizationId,
            storeId: userResult.storeId,
        });

        // Step 4: Suppliers
        const supplierResult = await seedSuppliers({
            organizationId: userResult.organizationId,
            storeId: userResult.storeId,
        });

        // Step 5: Transactions (all types)
        await seedTransactions({
            organizationId: userResult.organizationId,
            storeId: userResult.storeId,
            userIds: [userResult.userId, ...userResult.employeeIds],
            supplierIds: supplierResult.supplierIds,
        });

        // Step 6: Inventory Audits
        await seedAudits({
            organizationId: userResult.organizationId,
            storeId: userResult.storeId,
            userIds: [userResult.userId, ...userResult.employeeIds],
        });

        // Step 7: Write-offs
        await seedWriteOffs({
            organizationId: userResult.organizationId,
            storeId: userResult.storeId,
            userIds: [userResult.userId, ...userResult.employeeIds],
        });

        // Print summary
        logger.printSummary();

        // Print credentials
        console.log("\n" + "=".repeat(70));
        console.log("LOGIN CREDENTIALS");
        console.log("=".repeat(70));
        console.log(`\nAdmin Account:`);
        console.log(`  Email: ${SEED_CONFIG.admin.email}`);
        console.log(`  Password: ${SEED_CONFIG.admin.password}`);
        console.log(`\nSeller Accounts:`);
        for (const emp of SEED_CONFIG.employees.names) {
            console.log(`  Email: ${emp.email}`);
        }
        console.log(`  Password (all sellers): ${SEED_CONFIG.employees.password}`);
        console.log("");

        // Print transaction distribution info
        console.log("\n" + "=".repeat(70));
        console.log("TRANSACTION TYPE DISTRIBUTION");
        console.log("=".repeat(70));
        const dist = SEED_CONFIG.transactionDistribution;
        console.log(`  Sales (export):      ${dist.export}%`);
        console.log(`  Stock In (import):   ${dist.import}%`);
        console.log(`  Returns:             ${dist.return}%`);
        console.log(`  Credit Sales (debt): ${dist.debt}%`);
        console.log(`  Repayments:          ${dist.repayment}%`);
        console.log(`  Exchanges:           ${dist.exchange}%`);
        console.log(`  Adjustments:         ${dist.adjustment}%`);
        console.log(`  Supplier Returns:    ${dist.supplier_return}%`);
        console.log(`  Internal Use:        ${dist.internal_use}%`);
        console.log("");

    } catch (error) {
        console.error("\nFATAL ERROR:", error);
        process.exit(1);
    }
}

main()
    .catch((error) => {
        console.error("Unhandled error:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
