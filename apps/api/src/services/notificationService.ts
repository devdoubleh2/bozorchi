import TelegramBot from "node-telegram-bot-api";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import type { EcommerceOrderItem } from "../services/ecommerceOrders";

const SOURCE = "notificationService";

class NotificationService {
  private bot: TelegramBot | null = null;

  constructor() {
    const token = process.env["TELEGRAM_BOT_TOKEN"];
    if (token) {
      this.bot = new TelegramBot(token);
    }
  }

  private async sendMessage(
    chatId: number,
    text: string,
    options?: TelegramBot.SendMessageOptions
  ): Promise<void> {
    if (!this.bot) return;
    try {
      await this.bot.sendMessage(chatId, text, options);
    } catch (error) {
      logger.error("Error sending Telegram message", {
        source: SOURCE,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Notifies organization owner about a new transaction
   */
  async notifyTransactionToOwner(transactionData: {
    organizationId: string;
    storeName: string;
    transactionAmount: number;
    transactionType:
      | "sale"
      | "refund"
      | "import"
      | "transfer_in"
      | "transfer_out"
      | "adjustment"
      | "internal_use"
      | "supplier_return"
      | "debt";
    description?: string;
    remarks?: string;
    itemCount?: number;
    currency?: string;
    transactionId?: string;
    productName?: string;
    supplierName?: string;
    targetStoreName?: string;
  }): Promise<void> {
    try {
      const owner = await prisma.user.findFirst({
        where: {
          owned_organization: {
            id: transactionData.organizationId,
          },
        },
        include: {
          owned_organization: true,
        },
      });

      if (!owner || !owner.push_token) {
        logger.warn(
          "Organization owner not found or not connected to Telegram",
          {
            source: SOURCE,
            organizationId: transactionData.organizationId,
          }
        );
        return;
      }

      const chatId = Number(owner.push_token);
      const currency = transactionData.currency || "UZS";
      const formattedAmount =
        transactionData.transactionAmount.toLocaleString("ru-RU");

      const typeConfig = {
        sale: { emoji: "💰", title: "Продажа" },
        debt: { emoji: "💳", title: "Продажа в долг" },
        refund: { emoji: "↩️", title: "Возврат" },
        import: { emoji: "📦", title: "Закупка товара" },
        transfer_in: { emoji: "📥", title: "Поступление со склада" },
        transfer_out: { emoji: "📤", title: "Отправка на склад" },
        adjustment: { emoji: "⚖️", title: "Корректировка остатков" },
        internal_use: { emoji: "🔧", title: "Внутреннее использование" },
        supplier_return: { emoji: "📮", title: "Возврат поставщику" },
      };

      const config =
        typeConfig[transactionData.transactionType] || {
          emoji: "📝",
          title: "Транзакция",
        };

      let messageDetails = "";
      messageDetails += `🏪 *Магазин:* ${transactionData.storeName}\n`;

      if (transactionData.productName) {
        messageDetails += `📦 *Товар:* ${transactionData.productName}\n`;
      }

      if (transactionData.itemCount) {
        messageDetails += `🔢 *Количество:* ${transactionData.itemCount}\n`;
      }

      messageDetails += `💵 *Сумма:* ${formattedAmount} ${currency}\n`;

      if (
        transactionData.supplierName &&
        ["import", "supplier_return"].includes(
          transactionData.transactionType
        )
      ) {
        messageDetails += `👤 *Поставщик:* ${transactionData.supplierName}\n`;
      }

      if (
        transactionData.targetStoreName &&
        ["transfer_in", "transfer_out"].includes(
          transactionData.transactionType
        )
      ) {
        const label =
          transactionData.transactionType === "transfer_in"
            ? "Откуда"
            : "Куда";
        messageDetails += `🏬 *${label}:* ${transactionData.targetStoreName}\n`;
      }

      if (transactionData.remarks) {
        messageDetails += `\n📋 *Детали заказа:*\n${transactionData.remarks}\n`;
      }

      if (transactionData.description) {
        messageDetails += `\n📄 *Описание:* ${transactionData.description}\n`;
      }

      messageDetails += `\n📝 *ID:* \`${transactionData.transactionId || "N/A"}\`\n`;
      messageDetails += `🕐 *Время:* ${new Date().toLocaleString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })}\n`;

      const message =
        `${config.emoji} *${config.title}*\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        messageDetails +
        `\n━━━━━━━━━━━━━━━━━━`;

      await this.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (error) {
      logger.error(
        "Error notifying organization owner about transaction",
        {
          source: SOURCE,
          error: error instanceof Error ? error.message : String(error),
          organizationId: transactionData.organizationId,
        }
      );
    }
  }

  /**
   * Notifies organization owner about a batch of transactions
   */
  async notifyTransactionBatch(batchData: {
    organizationId: string;
    storeName: string;
    transactions: Array<{
      amount: number;
      type:
        | "sale"
        | "refund"
        | "import"
        | "transfer_in"
        | "transfer_out"
        | "adjustment"
        | "internal_use"
        | "supplier_return"
        | "debt";
      description?: string;
    }>;
    totalAmount: number;
    currency?: string;
  }): Promise<void> {
    try {
      const owner = await prisma.user.findFirst({
        where: {
          owned_organization: {
            id: batchData.organizationId,
          },
        },
        include: {
          owned_organization: true,
        },
      });

      if (!owner || !owner.push_token) {
        logger.warn(
          "Organization owner not found or not connected to Telegram",
          {
            source: SOURCE,
            organizationId: batchData.organizationId,
          }
        );
        return;
      }

      const chatId = Number(owner.push_token);
      const currency = batchData.currency || "UZS";
      const formattedTotal = batchData.totalAmount.toLocaleString("ru-RU");

      const typeCounts = {
        sale: batchData.transactions.filter((t) => t.type === "sale").length,
        debt: batchData.transactions.filter((t) => t.type === "debt").length,
        refund: batchData.transactions.filter((t) => t.type === "refund").length,
        import: batchData.transactions.filter((t) => t.type === "import").length,
        transfer_in: batchData.transactions.filter((t) => t.type === "transfer_in").length,
        transfer_out: batchData.transactions.filter((t) => t.type === "transfer_out").length,
        adjustment: batchData.transactions.filter((t) => t.type === "adjustment").length,
        internal_use: batchData.transactions.filter((t) => t.type === "internal_use").length,
        supplier_return: batchData.transactions.filter((t) => t.type === "supplier_return").length,
      };

      let summaryLines = "";
      if (typeCounts.sale > 0) summaryLines += `💰 *Продажи:* ${typeCounts.sale}\n`;
      if (typeCounts.debt > 0) summaryLines += `💳 *Продажи в долг:* ${typeCounts.debt}\n`;
      if (typeCounts.refund > 0) summaryLines += `↩️ *Возвраты:* ${typeCounts.refund}\n`;
      if (typeCounts.import > 0) summaryLines += `📦 *Закупки:* ${typeCounts.import}\n`;
      if (typeCounts.transfer_in > 0) summaryLines += `📥 *Поступления:* ${typeCounts.transfer_in}\n`;
      if (typeCounts.transfer_out > 0) summaryLines += `📤 *Отправки:* ${typeCounts.transfer_out}\n`;
      if (typeCounts.adjustment > 0) summaryLines += `⚖️ *Корректировки:* ${typeCounts.adjustment}\n`;
      if (typeCounts.internal_use > 0) summaryLines += `🔧 *Внутреннее использование:* ${typeCounts.internal_use}\n`;
      if (typeCounts.supplier_return > 0) summaryLines += `📮 *Возвраты поставщику:* ${typeCounts.supplier_return}\n`;

      const message =
        `📊 *Сводка транзакций*\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `🏪 *Магазин:* ${batchData.storeName}\n` +
        `📝 *Всего транзакций:* ${batchData.transactions.length}\n\n` +
        summaryLines +
        `\n💵 *Общая сумма:* ${formattedTotal} ${currency}\n` +
        `🕐 *Время отчета:* ${new Date().toLocaleString("ru-RU", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}\n\n` +
        `━━━━━━━━━━━━━━━━━━`;

      await this.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (error) {
      logger.error(
        "Error notifying organization owner about transaction batch",
        {
          source: SOURCE,
          error: error instanceof Error ? error.message : String(error),
          organizationId: batchData.organizationId,
        }
      );
    }
  }

  /**
   * Notifies organization owner about a pending e-commerce order
   */
  async notifyEcommerceOrderPending(data: {
    orderId: string;
    organizationId: string;
    storeName: string;
    phoneNumber: string;
    items: EcommerceOrderItem[];
    totalAmount: number;
    currency?: string;
  }): Promise<void> {
    try {
      const owner = await prisma.user.findFirst({
        where: {
          owned_organization: { id: data.organizationId },
        },
        include: { owned_organization: true },
      });

      if (!owner || !owner.push_token) {
        logger.warn(
          "Organization owner not connected to Telegram, attempting fallback channels",
          {
            source: SOURCE,
            organizationId: data.organizationId,
            ownerId: owner?.id,
          }
        );
        return;
      }

      const chatId = Number(owner.push_token);
      const currency = data.currency || "UZS";
      const formattedTotal = data.totalAmount.toLocaleString("ru-RU");

      const itemsText = data.items
        .map(
          (item, index) =>
            `${index + 1}. ${item.remarks ?? "Товар"} — ${item.quantity} шт.`
        )
        .join("\n");

      const message =
        `🛒 *Новый онлайн-заказ*\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `🏪 *Магазин:* ${data.storeName}\n` +
        `📞 *Телефон клиента:* ${data.phoneNumber}\n` +
        `📦 *Позиции:*\n${itemsText}\n\n` +
        `💵 *Сумма:* ${formattedTotal} ${currency}\n` +
        `📝 *ID заказа:* \`${data.orderId}\`\n\n` +
        `━━━━━━━━━━━━━━━━━━`;

      await this.sendMessage(chatId, message, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Принять", callback_data: `ecom_accept:${data.orderId}` },
              { text: "❌ Отклонить", callback_data: `ecom_decline:${data.orderId}` },
            ],
          ],
        },
      });
    } catch (error) {
      logger.error("Error notifying owner about e-commerce order", {
        source: SOURCE,
        error: error instanceof Error ? error.message : String(error),
        organizationId: data.organizationId,
      });
    }
  }
}

export const notificationService = new NotificationService();
