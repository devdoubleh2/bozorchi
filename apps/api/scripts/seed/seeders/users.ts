/**
 * User Seeder
 * 
 * Creates owner and cashier employees with proper permissions.
 */

import { prisma, createTenantSchema, getTenantPrisma } from "../../../src/lib/prisma";
import { Permission, Role, SubscriptionStatus } from "../../../src/generated/public/client";
import bcrypt from "bcryptjs";
import { SEED_CONFIG } from "../config";
import { logger } from "../logger";

const OPERATION = "Users & Organization Setup";

export interface UserSeedResult {
    userId: string;
    organizationId: string;
    storeId: string;
    employeeIds: string[];
}

export async function seedUsers(): Promise<UserSeedResult> {
    logger.startOperation(OPERATION);

    try {
        // 1. Check or create owner user
        logger.info(OPERATION, `Checking owner user: ${SEED_CONFIG.owner.email}`);
        let user = await prisma.user.findUnique({
            where: { email: SEED_CONFIG.owner.email },
        });

        if (user) {
            logger.info(OPERATION, "Owner user already exists, using existing.");
        } else {
            const passwordHash = await bcrypt.hash(SEED_CONFIG.owner.password, 12);
            user = await prisma.user.create({
                data: {
                    name: SEED_CONFIG.owner.name,
                    email: SEED_CONFIG.owner.email,
                    password_hash: passwordHash,
                },
            });
            logger.info(OPERATION, `Created owner user: ${user.id}`);
        }

        // 2. Check or create organization
        logger.info(OPERATION, `Checking organization: ${SEED_CONFIG.organization.slug}`);
        let org = await prisma.organization.findUnique({
            where: { slug: SEED_CONFIG.organization.slug },
        });

        let schemaCreated = false;
        if (org) {
            logger.info(OPERATION, "Organization already exists, using existing.");
        } else {
            org = await prisma.organization.create({
                data: {
                    name: SEED_CONFIG.organization.name,
                    slug: SEED_CONFIG.organization.slug,
                    owner_id: user.id,
                    subscription_status: SubscriptionStatus.active,
                },
            });
            logger.info(OPERATION, `Created organization: ${org.id}`);
            schemaCreated = true;
        }

        // 3. Create tenant schema if new org
        if (schemaCreated) {
            logger.info(OPERATION, "Creating tenant schema...");
            await createTenantSchema(org.id);
            logger.info(OPERATION, "Tenant schema created successfully.");
        }

        // 4. Setup store in tenant database
        const tenantPrisma = await getTenantPrisma(org.id);

        let store = await tenantPrisma.store.findFirst({
            where: { organization_id: org.id },
        });

        if (!store) {
            store = await tenantPrisma.store.create({
                data: {
                    name: SEED_CONFIG.store.name,
                    organization_id: org.id,
                    currency: SEED_CONFIG.store.currency,
                    address: SEED_CONFIG.store.address,
                    phone: SEED_CONFIG.store.phone,
                },
            });
            logger.info(OPERATION, `Created store: ${store.id}`);
        } else {
            logger.info(OPERATION, "Store already exists, using existing.");
        }

        // 5. Link owner to organization
        const existingOwnerLink = await prisma.userOrganization.findFirst({
            where: {
                user_id: user.id,
                organization_id: org.id,
            },
        });

        if (!existingOwnerLink) {
            await prisma.userOrganization.create({
                data: {
                    user_id: user.id,
                    organization_id: org.id,
                    store_id: store.id,
                    role: Role.owner,
                    approved: true,
                    permissions: [
                        Permission.POS_ACCESS,
                        Permission.MANAGE_PRODUCTS,
                        Permission.MANAGE_INVENTORY,
                        Permission.VIEW_COST_PRICE,
                        Permission.VIEW_ANALYTICS,
                    ],
                },
            });
            logger.info(OPERATION, "Linked owner to organization with full permissions.");
        }

        // 6. Create cashier employees
        const employeeIds: string[] = [];
        logger.info(OPERATION, `Creating ${SEED_CONFIG.employees.count} cashier employees...`);

        for (const empData of SEED_CONFIG.employees.names) {
            let employee = await prisma.user.findUnique({
                where: { email: empData.email },
            });

            if (!employee) {
                const passwordHash = await bcrypt.hash(SEED_CONFIG.employees.password, 12);
                employee = await prisma.user.create({
                    data: {
                        name: empData.name,
                        email: empData.email,
                        password_hash: passwordHash,
                    },
                });
                logger.info(OPERATION, `Created employee: ${empData.name}`);
            }

            employeeIds.push(employee.id);

            // Link employee to organization
            const existingLink = await prisma.userOrganization.findFirst({
                where: {
                    user_id: employee.id,
                    organization_id: org.id,
                },
            });

            if (!existingLink) {
                await prisma.userOrganization.create({
                    data: {
                        user_id: employee.id,
                        organization_id: org.id,
                        store_id: store.id,
                        role: Role.cashier,
                        approved: true,
                        permissions: [Permission.POS_ACCESS],
                    },
                });
            }
        }

        const totalRecords = 1 + employeeIds.length; // owner + employees
        logger.endOperation(OPERATION, totalRecords);

        return {
            userId: user.id,
            organizationId: org.id,
            storeId: store.id,
            employeeIds,
        };
    } catch (error) {
        logger.failOperation(OPERATION, error);
        throw error;
    }
}
