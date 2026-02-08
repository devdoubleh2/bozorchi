import { type ReceiptData } from "@/context/POSStore";

// Storage keys for receipt customization
export const RECEIPT_STORAGE_KEYS = {
  template: "receipt_template",
  width: "receipt_width",
  customVariables: "receipt_custom_variables",
} as const;

// Default template that matches the ReceiptDesign page
export const DEFAULT_RECEIPT_TEMPLATE = `<center>
{{storeLogo}}
</center>

<center>
# {{storeName}}
{{storeAddress}}
{{storePhone}}
</center>

---

**Receipt**: {{receiptId}}
**Date**: {{date}}
**Cashier**: {{cashierName}}
**Customer**: {{customerName}}

| Item | Qty | Price | Total |
| :--- | :--: | :---: | :---: |
{{itemsTable}}

---

**Subtotal**: {{subtotal}}
**Discount**: {{discount}}
**Loyalty Discount**: {{loyaltyDiscount}}
**Total**: {{total}}

{{debtSaleLabel}}

<center>
{{qrCode}}

**Scan to pay or view online**
</center>

---

<center>
{{marketingMessage}}

Thank you for shopping with us!
</center>
`;

export const DEFAULT_CUSTOM_VARIABLES: Record<string, string> = {
  storeLogo: `<img src="" alt="Store Logo" width="100" style="display:none" />`,
  qrCode: ``,
  marketingMessage: "",
};

export interface ReceiptRenderOptions {
  /** Format currency values */
  formatCurrency?: (amount: number) => string;
  /** Locale for number formatting */
  locale?: string;
  /** Currency code */
  currency?: string;
}

/**
 * Get the saved receipt template from localStorage, or return the default
 */
export function getReceiptTemplate(): string {
  if (typeof window === "undefined") return DEFAULT_RECEIPT_TEMPLATE;
  return localStorage.getItem(RECEIPT_STORAGE_KEYS.template) || DEFAULT_RECEIPT_TEMPLATE;
}

/**
 * Get the saved receipt width from localStorage (in mm)
 */
export function getReceiptWidth(): number {
  if (typeof window === "undefined") return 80;
  const saved = localStorage.getItem(RECEIPT_STORAGE_KEYS.width);
  return saved ? Number(saved) : 80;
}

/**
 * Get custom variables saved in localStorage
 */
export function getCustomVariables(): Record<string, string> {
  if (typeof window === "undefined") return DEFAULT_CUSTOM_VARIABLES;
  const saved = localStorage.getItem(RECEIPT_STORAGE_KEYS.customVariables);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_CUSTOM_VARIABLES;
    }
  }
  return DEFAULT_CUSTOM_VARIABLES;
}

/**
 * Convert ReceiptData lines array to a Markdown table string
 */
export function linesToMarkdownTable(
  lines: ReceiptData["lines"],
  formatCurrency: (amount: number) => string,
  formatNumber: (num: number) => string
): string {
  if (!lines || lines.length === 0) return "";

  return lines
    .map((line) => {
      const name = line.variationName
        ? `${line.productName} (${line.variationName})`
        : line.productName;
      const qty = `${formatNumber(line.quantity)}${line.unitName ? ` ${line.unitName}` : ""}`;
      const price = formatCurrency(line.unitPrice);
      const total = formatCurrency(line.lineTotal);
      return `| ${name} | ${qty} | ${price} | ${total} |`;
    })
    .join("\n");
}

/**
 * Map ReceiptData to template variable values
 */
export function mapReceiptToVariables(
  receipt: ReceiptData,
  options: ReceiptRenderOptions = {}
): Record<string, string> {
  const {
    formatCurrency = (n) => n.toLocaleString(),
    locale = "ru-RU",
  } = options;

  const formatNumber = (n: number) => n.toLocaleString(locale);

  const dateStr = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(receipt.createdAt));

  return {
    storeName: receipt.storeName || "Store",
    storeAddress: receipt.storeAddress || "",
    storePhone: receipt.storePhone || "",
    receiptId: receipt.id,
    date: dateStr,
    cashierName: receipt.cashierName || "",
    customerName: receipt.customerName || "—",
    itemsTable: linesToMarkdownTable(receipt.lines, formatCurrency, formatNumber),
    subtotal: formatCurrency(receipt.subtotal),
    discount: receipt.discountAmount > 0 ? `- ${formatCurrency(receipt.discountAmount)}` : "0",
    loyaltyDiscount: receipt.loyaltyDiscountAmount > 0
      ? `- ${formatCurrency(receipt.loyaltyDiscountAmount)}`
      : "0",
    total: formatCurrency(receipt.total),
    debtSaleLabel: receipt.isDebtSale
      ? `<div style="color: #d97706; font-weight: bold; text-align: center; margin-top: 8px;">⚠️ DEBT SALE</div>`
      : "",
  };
}

/**
 * Render a receipt by substituting template variables with actual values
 */
export function renderReceiptMarkdown(
  receipt: ReceiptData,
  options: ReceiptRenderOptions = {}
): string {
  const template = getReceiptTemplate();
  const customVariables = getCustomVariables();
  const receiptVariables = mapReceiptToVariables(receipt, options);

  // Merge all variables (receipt data takes priority over custom variables)
  const allVariables = { ...customVariables, ...receiptVariables };

  // Replace all {{variable}} placeholders
  let content = template;
  Object.entries(allVariables).forEach(([key, value]) => {
    content = content.replace(new RegExp(`{{${key}}}`, "g"), value || "");
  });

  // Clean up any remaining unreplaced variables
  content = content.replace(/\{\{[^}]+\}\}/g, "");

  return content;
}

/**
 * Convert Markdown to basic HTML for printing
 * This is a simplified converter for receipt printing
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Handle center tags (already HTML)
  // No conversion needed

  // Headers
  html = html.replace(/^# (.+)$/gm, '<h1 style="margin: 4px 0; font-size: 16px;">$1</h1>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="margin: 4px 0; font-size: 14px;">$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3 style="margin: 4px 0; font-size: 12px;">$1</h3>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr style="border: none; border-top: 1px dashed #ccc; margin: 8px 0;" />');

  // Tables - convert markdown tables to HTML
  const tableRegex = /\|(.+)\|\n\|[\s:-]+\|\n((?:\|.+\|\n?)+)/g;
  html = html.replace(tableRegex, (_, header, rows) => {
    const headerCells = header.split('|').map((c: string) => c.trim()).filter(Boolean);
    const rowLines = rows.trim().split('\n');

    let tableHtml = '<table style="width: 100%; border-collapse: collapse; font-size: 11px; margin: 8px 0;">';
    tableHtml += '<thead><tr>';
    headerCells.forEach((cell: string) => {
      tableHtml += `<th style="text-align: left; padding: 2px 4px; border-bottom: 1px solid #ddd;">${cell}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    rowLines.forEach((row: string) => {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      tableHtml += '<tr>';
      cells.forEach((cell, i) => {
        const align = i === 0 ? 'left' : 'right';
        tableHtml += `<td style="text-align: ${align}; padding: 2px 4px;">${cell}</td>`;
      });
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';
    return tableHtml;
  });

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br />');

  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`;
  }

  return html;
}

/**
 * Generate full HTML document for receipt printing
 */
export function generatePrintableReceipt(
  receipt: ReceiptData,
  options: ReceiptRenderOptions = {}
): string {
  const markdown = renderReceiptMarkdown(receipt, options);
  const content = markdownToHtml(markdown);
  const width = getReceiptWidth();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${receipt.id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
      background: #fff;
      width: ${width}mm;
      max-width: 100%;
      margin: 0 auto;
      padding: 8px;
    }
    center {
      text-align: center;
    }
    h1 { font-size: 16px; margin: 4px 0; }
    h2 { font-size: 14px; margin: 4px 0; }
    h3 { font-size: 12px; margin: 4px 0; }
    p { margin: 4px 0; }
    hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 2px 4px; text-align: left; }
    th { border-bottom: 1px solid #000; }
    img { max-width: 100%; height: auto; }
    @media print {
      body { width: 100%; }
      @page { margin: 0; size: ${width}mm auto; }
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>
  `.trim();
}

/**
 * Print a receipt using a new window (non-destructive)
 */
export function printReceipt(
  receipt: ReceiptData,
  options: ReceiptRenderOptions = {}
): void {
  const html = generatePrintableReceipt(receipt, options);

  const printWindow = window.open("", "_blank", "width=400,height=600");
  if (!printWindow) {
    console.error("Failed to open print window. Check popup blocker.");
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}
