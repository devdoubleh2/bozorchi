import { describe, expect, it, mock } from "bun:test";
import { getTransactions } from "../../src/services/transactions";

describe("transactions service customer scoping", () => {
  it("applies customerId in transaction where-clause", async () => {
    const findMany = mock(async () => []);
    const count = mock(async () => 0);

    const prismaClient = {
      transaction: {
        findMany,
        count,
      },
    } as any;

    await getTransactions(
      {
        storeId: "store-1",
        userId: "user-1",
        customerId: "customer-1",
      },
      prismaClient
    );

    const findManyArgs = (findMany.mock.calls as any[][])[0]?.[0];
    const countArgs = (count.mock.calls as any[][])[0]?.[0];

    expect(findManyArgs).toBeDefined();
    expect(countArgs).toBeDefined();
    expect(findManyArgs.where.customer_id).toBe("customer-1");
    expect(countArgs.where.customer_id).toBe("customer-1");
  });
});
