/**
 * Supplier Seeder
 * 
 * Creates realistic Uzbek supplier companies for import transactions.
 */

import { getTenantPrisma } from "../../../src/lib/prisma";
import { faker } from "@faker-js/faker";
import { SEED_CONFIG } from "../config";
import { logger } from "../logger";
import { UZBEK_PHONE_PREFIXES } from "../data/clothing";

const OPERATION = "Suppliers";

interface SupplierSeedContext {
    organizationId: string;
    storeId: string;
}

// Uzbek company name patterns
const COMPANY_PREFIXES = [
    "Tashkent", "Samarkand", "Bukhara", "Fergana", "Andijan",
    "Namangan", "Nukus", "Urgench", "Karshi", "Termez",
];

const COMPANY_TYPES = [
    "Textile", "Fashion", "Garments", "Apparel", "Fabrics",
    "Clothing", "Wear", "Style", "Design", "Trend",
];

const COMPANY_SUFFIXES = [
    "LLC", "MCHJ", "Group", "Trade", "Import",
    "Distribution", "Wholesale", "Supply", "Co",
];

function generateSupplierName(): string {
    const prefix = faker.helpers.arrayElement(COMPANY_PREFIXES);
    const type = faker.helpers.arrayElement(COMPANY_TYPES);
    const suffix = faker.helpers.arrayElement(COMPANY_SUFFIXES);
    return `${prefix} ${type} ${suffix}`;
}

function generateINN(): string {
    return faker.string.numeric(9);
}

function generateMFO(): string {
    return faker.string.numeric(5);
}

function generateBankAccount(): string {
    return faker.string.numeric(20);
}

const UZBEK_BANKS = [
    "Kapitalbank",
    "Agrobank",
    "Ipoteka Bank",
    "Aloqa Bank",
    "Hamkorbank",
    "Uzpromstroybank",
    "Asaka Bank",
    "Xalq Bank",
    "Infinbank",
    "Davr Bank",
];

const UZBEK_ADDRESSES = [
    "Tashkent, Chilanzar district, Bunyodkor street 15",
    "Tashkent, Yunusabad district, Amir Temur street 42",
    "Samarkand, Registan area, Ulugbek street 7",
    "Bukhara, Old City, Mustaqillik street 23",
    "Fergana, Central district, Navoi street 18",
    "Namangan, Bobur district, Shirin street 9",
    "Andijan, Market district, Alisher Navoi street 55",
    "Nukus, Central district, Berdakh street 12",
];

export async function seedSuppliers(context: SupplierSeedContext): Promise<{ supplierIds: string[]; count: number }> {
    logger.startOperation(OPERATION);

    try {
        const tenantPrisma = await getTenantPrisma(context.organizationId);

        // Check existing suppliers
        const existingCount = await tenantPrisma.supplier.count({
            where: { store_id: context.storeId },
        });

        if (existingCount >= SEED_CONFIG.volumes.suppliers) {
            logger.info(OPERATION, `Sufficient suppliers exist (${existingCount}), fetching existing IDs.`);
            const existingSuppliers = await tenantPrisma.supplier.findMany({
                where: { store_id: context.storeId },
                select: { id: true },
            });
            logger.endOperation(OPERATION, existingCount, 0);
            return {
                supplierIds: existingSuppliers.map(s => s.id),
                count: existingCount,
            };
        }

        const suppliersToCreate = SEED_CONFIG.volumes.suppliers - existingCount;
        logger.info(OPERATION, `Creating ${suppliersToCreate} new suppliers...`);

        const supplierData = [];
        const usedNames = new Set<string>();

        for (let i = 0; i < suppliersToCreate; i++) {
            let name: string;
            do {
                name = generateSupplierName();
            } while (usedNames.has(name));
            usedNames.add(name);

            const phonePrefix = faker.helpers.arrayElement(UZBEK_PHONE_PREFIXES);
            const phone = `${phonePrefix} ${faker.string.numeric(3)} ${faker.string.numeric(2)} ${faker.string.numeric(2)}`;

            supplierData.push({
                name,
                contact: faker.person.fullName(),
                phone,
                email: `info@${name.toLowerCase().replace(/\s+/g, "").slice(0, 15)}.uz`,
                address: faker.helpers.arrayElement(UZBEK_ADDRESSES),
                inn: generateINN(),
                mfo: generateMFO(),
                bank_account: generateBankAccount(),
                bank_name: faker.helpers.arrayElement(UZBEK_BANKS),
                director_name: faker.person.fullName(),
                notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
                organization_id: context.organizationId,
                store_id: context.storeId,
            });
        }

        await tenantPrisma.supplier.createMany({
            data: supplierData,
        });

        // Fetch all supplier IDs
        const allSuppliers = await tenantPrisma.supplier.findMany({
            where: { store_id: context.storeId },
            select: { id: true },
        });

        logger.info(OPERATION, `Created ${suppliersToCreate} suppliers.`);
        logger.endOperation(OPERATION, suppliersToCreate);

        return {
            supplierIds: allSuppliers.map(s => s.id),
            count: allSuppliers.length,
        };
    } catch (error) {
        logger.failOperation(OPERATION, error);
        throw error;
    }
}
