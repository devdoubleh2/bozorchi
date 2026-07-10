export const RESOURCE_GUIDES = [
  {
    key: "inventory_turnover",
    slug: "inventory-turnover-playbook",
    sections: [
      {
        heading: "Start with stock age, not just stock count",
        paragraphs: [
          "Most stores know how many units they have. Fewer know how long those units have been sitting. Split inventory into age bands such as 0 to 30 days, 31 to 60 days, 61 to 90 days, and over 90 days. That gives you a direct view of which products are converting and which ones are trapping cash.",
          "Once stock age is visible, sort every category into three groups: healthy movers, slow movers, and dead stock. Healthy movers should stay in stock. Slow movers need pricing, placement, or bundle changes. Dead stock needs decisive action instead of another month of passive waiting.",
        ],
      },
      {
        heading: "Set reorder rules from sales velocity",
        paragraphs: [
          "Reordering should not be based on instinct alone. Review average weekly sales for each SKU, then compare that number to supplier lead time and a minimum safety buffer. If a product sells 12 units per week and the supplier needs 10 days, your reorder point should reflect the sales likely to happen during that lead time plus a cushion.",
          "Use one simple rule consistently: reorder fast movers earlier, buy test quantities for uncertain products, and stop topping up items that are already failing to move. This keeps cash available for products that actually generate margin.",
        ],
      },
      {
        heading: "Run one turnover review every week",
        paragraphs: [
          "A weekly inventory review is enough for most small and mid-sized stores. Focus on five numbers: stock value, units sold, aging stock, low-stock fast movers, and markdown candidates. The point is not to generate a giant report. The point is to make five or six clear decisions before the next buying cycle.",
          "If the team leaves the meeting without actions, the dashboard is too complicated. End each review with named actions: reorder, hold, markdown, bundle, or discontinue.",
        ],
      },
    ],
  },
  {
    key: "faster_checkout",
    slug: "faster-checkout-experience",
    sections: [
      {
        heading: "Remove friction from the cashier workflow",
        paragraphs: [
          "Checkout speed usually breaks because cashiers are forced to think too much between scans. Product lookup, quantity edits, discount rules, and payment selection need to be obvious and close together. If the interface forces backtracking, queue time grows fast.",
          "Start by reducing the number of clicks required for the most common order path. Barcode scan, quantity confirmation, payment, and receipt should feel like one continuous motion. Edge cases can stay one layer deeper, but the default path must be fast.",
        ],
      },
      {
        heading: "Design for queue peaks, not quiet hours",
        paragraphs: [
          "A checkout flow that feels fine during slow periods can still fail at rush hour. Measure what happens when several customers arrive back to back, when one asks for a discount, or when the cashier needs to search for a missing barcode. That is where the real operational cost appears.",
          "Prepare quick actions for common exceptions: manual search, void last item, change payment method, and suspend the cart if needed. A store does not need a complex POS to move faster. It needs fewer interruptions in the moments that matter most.",
        ],
      },
      {
        heading: "Protect average order value while moving faster",
        paragraphs: [
          "Speed alone is not the only metric. The best checkout flows stay fast without suppressing upsells, bundles, or loyalty prompts. Keep those actions lightweight and contextual instead of forcing every cashier through a long script.",
          "Review average items per order and average order value alongside queue time. If speed improves but basket value drops, the process has become too aggressive. The goal is a clean balance between throughput and revenue quality.",
        ],
      },
    ],
  },
  {
    key: "kpi_dashboard",
    slug: "weekly-retail-kpi-dashboard",
    sections: [
      {
        heading: "Track a small set of numbers that drive action",
        paragraphs: [
          "Most store dashboards fail because they show everything and clarify nothing. A useful weekly dashboard should answer four questions quickly: how much you sold, what margin you kept, what inventory risk is growing, and whether customer traffic is improving or slipping.",
          "For many retailers, the core weekly numbers are revenue, gross profit, average order value, transaction count, top product movement, and low-stock risk. That is enough to see whether the store is moving in the right direction without drowning the owner in charts.",
        ],
      },
      {
        heading: "Review trends, not isolated snapshots",
        paragraphs: [
          "A single weak day can create noise. Weekly review works better because it exposes direction. Compare the current week to the prior week and to the same period pattern you expect from the business. Look for movement that requires action, not movement that is merely interesting.",
          "When a KPI changes, attach one operational explanation. Revenue dropped because foot traffic was down. Margin dropped because discounting increased. Inventory risk rose because a top seller was not reordered in time. Metrics become useful when they lead to decisions.",
        ],
      },
      {
        heading: "Turn the dashboard into a management routine",
        paragraphs: [
          "The dashboard should support a weekly operating rhythm. Spend 15 to 20 minutes reviewing the numbers, then convert the review into a short list of actions for stock, staffing, promotions, or pricing. If the dashboard does not change behavior, it is decoration.",
          "A good KPI dashboard is not impressive because it is dense. It is impressive because the owner can look at it on Monday and know exactly what to fix before Friday.",
        ],
      },
    ],
  },
] as const;

export type ResourceGuideKey = (typeof RESOURCE_GUIDES)[number]["key"];
export type ResourceGuideSlug = (typeof RESOURCE_GUIDES)[number]["slug"];

export const getResourceGuideBySlug = (slug: string) =>
  RESOURCE_GUIDES.find((guide) => guide.slug === slug);
