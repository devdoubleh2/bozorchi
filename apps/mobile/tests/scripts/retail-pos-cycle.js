const ts = Date.now();
output.userName = `E2E User ${ts}`;
output.email = `e2e+${ts}@store.test`;
output.password = `Test${String(ts).slice(-6)}`;
output.storeName = `E2E Store ${ts}`;
output.storeAddress = `E2E Address ${ts}`;
output.storePhone = "+998901234567";
output.productName = `E2E Product ${ts}`;
output.productNameUpdated = `E2E Product Updated ${ts}`;
output.productSlug = output.productName
  .replace(/[^a-zA-Z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "");
output.productSlugUpdated = output.productNameUpdated
  .replace(/[^a-zA-Z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "");
output.categoryName = `E2E Category ${ts}`;
output.unitName = `E2E Unit ${String(ts).slice(-4)}`;
output.supplierName = `E2E Supplier ${String(ts).slice(-4)}`;
output.customerName = `E2E Customer ${String(ts).slice(-4)}`;
output.barcode = `12345${String(ts).slice(-8)}`;
