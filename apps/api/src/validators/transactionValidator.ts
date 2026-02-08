import { z } from "zod";

const validTransactionTypes = [
  "export",
  "import",
  "debt",
  "return",
  "repayment",
  "exchange",
  "adjustment",
  "transfer_in",
  "transfer_out",
  "internal_use",
  "supplier_return",
] as const;

export const createTransactionSchema = z.object({
  product_variation_id: z.string(),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
  total_amount: z.number().min(0),
  transaction_type: z.enum(validTransactionTypes),
  customer_id: z.string().optional(),
  group_id: z.string().optional(),
  payments: z
    .array(
      z.object({
        amount: z.number().positive(),
        payment_method: z.enum(["cash", "card", "transfer", "other"]),
        currency: z.string(),
        received_at: z.string().datetime(),
        payer_id: z.string().optional(), // Added payer_id support
      })
    )
    .optional(),
  redeem_points: z.number().min(0).optional(),
  loyalty_discount_amount: z.number().min(0).optional(),
  remarks: z.string().optional(),
});

export const getTransactionsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.enum(validTransactionTypes).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});
