import { getTenantPrisma } from "../src/lib/prisma";

const tenantPrisma = await getTenantPrisma("cmocuawha0001r9bo4qreaq9e");

const [products, categories, customers, transactions, suppliers] = await Promise.all([
  tenantPrisma.product.count(),
  tenantPrisma.productCategory.count(),
  tenantPrisma.customer.count(),
  tenantPrisma.transaction.count(),
  tenantPrisma.supplier.count(),
]);

console.log('Products:', products);
console.log('Categories:', categories);
console.log('Customers:', customers);
console.log('Transactions:', transactions);
console.log('Suppliers:', suppliers);

const store = await tenantPrisma.store.findFirst();
console.log('Store:', store ? { id: store.id, name: store.name } : null);

await tenantPrisma.$disconnect();