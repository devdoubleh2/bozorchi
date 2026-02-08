import { Response } from "express";
import TelegramBot from "node-telegram-bot-api";
import { Decimal } from "decimal.js";
import { prisma, getTenantPrisma } from "../lib/prisma";
import authService from "../services/auth";
import logger from "../../logs/log";
import * as transactionService from "../services/transactions";
import {
  approveOrder,
  declineOrder,
  getOrder,
  type EcommerceOrderItem,
} from "../services/ecommerceOrders";

export class TelegramController {
  private bot: TelegramBot | null = null;

  constructor() {
    const token = process.env["TELEGRAM_BOT_TOKEN"];
    if (token) {
      this.bot = new TelegramBot(token);
    }
  }

  /**
   * Handles incoming Telegram webhook updates
   * Only processes messages from organization owners
   */
  async handleWebhook(req: any, res: Response) {
    try {
      if (!this.bot) {
        return res.status(500).json({ error: "Telegram bot not configured" });
      }

      const update = req.body as TelegramBot.Update;

      // Handle text messages
      if (update.message?.text) {
        await this.handleMessage(update.message);
      }

      // Handle inline button callbacks
      if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }

      return res.status(200).json({ ok: true });
    } catch (error) {
      logger.error("Telegram webhook error", "telegramController", {
        error: (error as Error).message,
      });
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Processes messages from organization owners only
   */
  private async handleMessage(message: TelegramBot.Message) {
    const chatId = message.chat.id;
    const text = message.text;

    if (!text) return;

    try {
      // Handle /start or /login command (no auth required)
      if (text.startsWith("/start") || text.startsWith("/login")) {
        await this.handleLogin(chatId);
        return;
      }

      // Handle /auth command (authentication)
      if (text.startsWith("/auth ")) {
        await this.handleAuthCommand(chatId, text);
        return;
      }

      // For all other commands, verify user is authenticated
      const user = await prisma.user.findFirst({
        where: {
          push_token: chatId.toString(),
        },
        include: {
          owned_organization: true,
        },
      });

      if (!user?.owned_organization) {
        await this.sendMessage(
          chatId,
          "🔒 *Требуется авторизация*\n\n" +
            "Сначала вам нужно войти в систему, чтобы использовать эту команду.\n\n" +
            "Используйте /start для просмотра инструкций по входу.",
          { parse_mode: "Markdown" }
        );
        return;
      }

      // Handle authenticated commands
      await this.handleAuthenticatedCommand(chatId, text, user);
    } catch (error) {
      logger.error("Error handling Telegram message", "telegramController", {
        error: (error as Error).message,
      });
      await this.sendMessage(
        chatId,
        "❌ Произошла ошибка. Пожалуйста, попробуйте еще раз."
      );
    }
  }

  /**
   * Handles login for organization owners
   */
  private async handleLogin(chatId: number) {
    await this.sendMessage(
      chatId,
      "👋 *Добро пожаловать в Портал Владельца Bozorchi!*\n\n" +
        "Этот бот предназначен исключительно для *владельцев организаций* для управления их бизнесом.\n\n" +
        "🔐 *Для начала работы:*\n" +
        "Отправьте свои учетные данные в этом формате:\n\n" +
        "`/auth ваш@email.com ваш_пароль`\n\n" +
        "⚡️ *Быстрый пример:*\n" +
        "`/auth owner@store.com mypassword123`\n\n" +
        "⚠️ *Примечание по безопасности:*\n" +
        "• Ваши учетные данные зашифрованы и защищены\n" +
        "• Доступ имеют только владельцы организаций\n" +
        "• Удалите сообщение после отправки для дополнительной безопасности",
      { parse_mode: "Markdown" }
    );
  }

  /**
   * Handles authentication command
   */
  private async handleAuthCommand(chatId: number, text: string) {
    const parts = text.split(" ");
    if (parts.length < 3) {
      await this.sendMessage(
        chatId,
        "❌ *Неверный формат*\n\n" +
          "Пожалуйста, используйте правильный формат:\n" +
          "`/auth ваш@email.com ваш_пароль`\n\n" +
          "💡 *Пример:*\n" +
          "`/auth owner@store.com mypassword123`",
        { parse_mode: "Markdown" }
      );
      return;
    }

    const email = parts[1];
    const password = parts.slice(2).join(" ");

    if (!email || !password) {
      await this.sendMessage(
        chatId,
        "❌ *Отсутствуют учетные данные*\n\n" +
          "Требуются и email, и пароль.\n\n" +
          "Формат: `/auth email пароль`",
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Send "authenticating" message
    await this.sendMessage(chatId, "🔄 *Аутентификация...*", {
      parse_mode: "Markdown",
    });

    try {
      const result = await authService.login({ email, password });

      // Check if user is an owner
      if (!result.user.owned_organization) {
        await this.sendMessage(
          chatId,
          "⚠️ *Доступ запрещен*\n\n" +
            "Этот бот доступен только для *владельцев организаций*.\n\n" +
            "Сотрудники и обычные пользователи не могут получить доступ к этому порталу.\n\n" +
            "Если вам нужен доступ, обратитесь к владельцу вашей организации."
        );
        return;
      }

      // Store telegram chat ID in user push_token field
      await prisma.user.update({
        where: { id: result.user.id },
        data: { push_token: chatId.toString() },
      });

      await this.sendMessage(
        chatId,
        `✅ *Аутентификация успешна!*\n\n` +
          `👤 *Добро пожаловать, ${result.user.name || result.user.email}!*\n\n` +
          `🏢 *Организация:* ${result.user.owned_organization["name"]}\n` +
          `📊 *Статус:* ${result.user.owned_organization["subscription_status"] || "Активен"}\n\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `🎯 *Быстрые действия:*\n` +
          `• /status - Просмотр деталей организации\n` +
          `• /help - Все доступные команды\n` +
          `• /logout - Завершить сеанс\n\n` +
          `💡 _Совет: Вы можете удалить свое сообщение входа для безопасности_`,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      await this.sendMessage(
        chatId,
        "❌ *Ошибка аутентификации*\n\n" +
          "Пожалуйста, проверьте свои учетные данные и попробуйте снова.\n\n" +
          "📧 *Частые проблемы:*\n" +
          "• Неверный email или пароль\n" +
          "• Аккаунт не существует\n" +
          "• Вы не являетесь владельцем организации\n\n" +
          "Нужна помощь? Используйте /start чтобы снова увидеть инструкции."
      );
    }
  }

  /**
   * Handles commands from authenticated users
   */
  private async handleAuthenticatedCommand(
    chatId: number,
    text: string,
    user: any
  ) {
    // Handle /help command
    if (text === "/help") {
      await this.sendMessage(
        chatId,
        "📚 *Доступные команды*\n\n" +
          "━━━━━━━━━━━━━━━━━━\n\n" +
          "🔍 *Информация:*\n" +
          "/status - Просмотр статуса организации\n" +
          "/help - Показать это сообщение помощи\n\n" +
          "🔐 *Аккаунт:*\n" +
          "/logout - Завершить сеанс бота\n\n" +
          "━━━━━━━━━━━━━━━━━━\n\n" +
          "💡 *Скоро появится:*\n" +
          "• Отчеты о продажах\n" +
          "• Уведомления об инвентаре\n" +
          "• Быстрые действия\n\n" +
          "_Новые функции добавляются регулярно!_",
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Handle /status command
    if (text === "/status") {
      const org = user.owned_organization;
      const createdDate = new Date(org["created_at"]);
      const daysActive = Math.floor(
        (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      await this.sendMessage(
        chatId,
        `📊 *Панель управления организацией*\n\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `🏢 *Название:* ${org["name"]}\n` +
          `🔗 *Slug:* \`${org["slug"]}\`\n` +
          `💳 *Подписка:* ${org["subscription_status"] || "Бесплатный план"}\n` +
          `📅 *Дата создания:* ${createdDate.toLocaleDateString("ru-RU", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}\n` +
          `⏱️ *Активных дней:* ${daysActive} дней\n\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `💡 Нужно больше функций? Обновите свой план!`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Handle /logout command
    if (text === "/logout") {
      await prisma.user.update({
        where: { id: user.id },
        data: { push_token: null },
      });
      await this.sendMessage(
        chatId,
        "👋 *Выход выполнен успешно*\n\n" +
          "Ваш сеанс завершен.\n\n" +
          "Чтобы войти снова, используйте /start\n\n" +
          "_Будьте в безопасности! 🔐_",
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Default response for unknown commands
    await this.sendMessage(
      chatId,
      "❓ *Неизвестная команда*\n\n" +
        "Я не понял эту команду.\n\n" +
        "Используйте /help чтобы увидеть все доступные команды.\n\n" +
        "💡 _Попробуйте /status чтобы увидеть детали вашей организации_",
      { parse_mode: "Markdown" }
    );
  }

  /**
   * Handles inline button callbacks (approve/decline)
   */
  private async handleCallbackQuery(query: TelegramBot.CallbackQuery) {
    const data = query.data;
    const message = query.message;
    const chatId = message?.chat.id;

    if (!data || !chatId) {
      return;
    }

    const [action, orderId] = data.split(":");
    if (!orderId) {
      await this.answerCallback(query.id, "Некорректные данные");
      return;
    }

    const user = await prisma.user.findFirst({
      where: { push_token: chatId.toString() },
      include: { owned_organization: true },
    });

    if (!user?.owned_organization) {
      await this.answerCallback(query.id, "Требуется авторизация");
      return;
    }

    const order = getOrder(orderId);
    if (!order) {
      await this.answerCallback(query.id, "Заказ не найден или истек");
      return;
    }

    if (user.owned_organization.id !== order.organizationId) {
      await this.answerCallback(query.id, "Нет доступа к этому заказу");
      return;
    }

    if (action === "ecom_accept") {
      const approved = approveOrder(orderId);
      if (!approved || approved.status !== "approved") {
        await this.answerCallback(query.id, "Заказ уже обработан");
        return;
      }

      try {
        const tenantPrisma = await getTenantPrisma(order.organizationId);
        for (const item of approved.items) {
          await transactionService.createTransaction(
            {
              product_variation_id: item.product_variation_id,
              quantity: item.quantity,
              unit_price: new Decimal(item.unit_price),
              total_amount: new Decimal(item.total_amount),
              transaction_type: "export",
              remarks: item.remarks,
              store_id: approved.storeId,
              userId: user.id,
              group_id: approved.groupId,
              currency: approved.currency,
            },
            tenantPrisma
          );
        }

        await this.answerCallback(query.id, "Заказ принят");
        // Preserve original message details and append status
        const currency = approved.currency || "UZS";
        const formattedTotal = approved.totalAmount.toLocaleString("ru-RU");
        const itemsText = approved.items
          .map(
            (item, index) =>
              `${index + 1}. ${item.remarks ?? "Товар"} — ${item.quantity} шт.`
          )
          .join("\n");
        const originalMessage =
          `🛒 *Новый онлайн-заказ*\n\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `🏪 *Магазин:* ${approved.storeId}\n` +
          `📞 *Телефон клиента:* ${approved.phoneNumber}\n` +
          `📦 *Позиции:*\n${itemsText}\n\n` +
          `💵 *Сумма:* ${formattedTotal} ${currency}\n` +
          `📝 *ID заказа:* \`${orderId}\`\n\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `✅ Заказ принят`;
        await this.updateMessageButtons(chatId, message.message_id, originalMessage);
      } catch (error) {
        logger.error("Failed to approve e-commerce order", "telegramController", {
          error: (error as Error).message,
          orderId,
        });
        await this.answerCallback(query.id, "Ошибка при создании продажи");
      }

      return;
    }

    if (action === "ecom_decline") {
      const declined = declineOrder(orderId);
      if (!declined || declined.status !== "declined") {
        await this.answerCallback(query.id, "Заказ уже обработан");
        return;
      }

      await this.answerCallback(query.id, "Заказ отклонен");
      // Preserve original message details and append status
      const currency = declined.currency || "UZS";
      const formattedTotal = declined.totalAmount.toLocaleString("ru-RU");
      const itemsText = declined.items
        .map(
          (item, index) =>
            `${index + 1}. ${item.remarks ?? "Товар"} — ${item.quantity} шт.`
        )
        .join("\n");
      const originalMessage =
        `🛒 *Новый онлайн-заказ*\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `🏪 *Магазин:* ${declined.storeId}\n` +
        `📞 *Телефон клиента:* ${declined.phoneNumber}\n` +
        `📦 *Позиции:*\n${itemsText}\n\n` +
        `💵 *Сумма:* ${formattedTotal} ${currency}\n` +
        `📝 *ID заказа:* \`${orderId}\`\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `❌ Заказ отклонен`;
      await this.updateMessageButtons(chatId, message.message_id, originalMessage);
      return;
    }

    await this.answerCallback(query.id, "Неизвестное действие");
  }

  /**
   * Sends pending e-commerce order notification to owner
   */
  async notifyEcommerceOrderPending(data: {
    orderId: string;
    organizationId: string;
    storeName: string;
    phoneNumber: string;
    items: EcommerceOrderItem[];
    totalAmount: number;
    currency?: string;
  }) {
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
          "telegramController",
          { organizationId: data.organizationId, ownerId: owner?.id }
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
      logger.error(
        "Error notifying owner about e-commerce order",
        "telegramController",
        { error: (error as Error).message, organizationId: data.organizationId }
      );
    }
  }

  /**
   * Notifies organization owner about a new transaction from their store
   */
  async notifyTransactionToOwner(transactionData: {
    organizationId: string;
    storeName: string;
    transactionAmount: number;
    transactionType: "sale" | "refund" | "import" | "transfer_in" | "transfer_out" | "adjustment" | "internal_use" | "supplier_return" | "debt";
    description?: string;
    remarks?: string;
    itemCount?: number;
    currency?: string;
    transactionId?: string;
    productName?: string;
    supplierName?: string;
    targetStoreName?: string;
  }) {
    try {
      // Find the organization owner
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
          "telegramController",
          { organizationId: transactionData.organizationId }
        );
        return;
      }

      const chatId = Number(owner.push_token);
      const currency = transactionData.currency || "UZS";
      const formattedAmount = transactionData.transactionAmount.toLocaleString(
        "ru-RU"
      );

      // Determine emoji and title based on transaction type
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

      const config = typeConfig[transactionData.transactionType] || { emoji: "📝", title: "Транзакция" };

      // Build message parts based on transaction type
      let messageDetails = "";
      
      // Common fields
      messageDetails += `🏪 *Магазин:* ${transactionData.storeName}\n`;
      
      // Product name if available
      if (transactionData.productName) {
        messageDetails += `📦 *Товар:* ${transactionData.productName}\n`;
      }
      
      // Quantity
      if (transactionData.itemCount) {
        messageDetails += `🔢 *Количество:* ${transactionData.itemCount}\n`;
      }
      
      // Amount
      messageDetails += `💵 *Сумма:* ${formattedAmount} ${currency}\n`;
      
      // Supplier for import/supplier_return
      if (transactionData.supplierName && ["import", "supplier_return"].includes(transactionData.transactionType)) {
        messageDetails += `👤 *Поставщик:* ${transactionData.supplierName}\n`;
      }
      
      // Target store for transfers
      if (transactionData.targetStoreName && ["transfer_in", "transfer_out"].includes(transactionData.transactionType)) {
        const label = transactionData.transactionType === "transfer_in" ? "Откуда" : "Куда";
        messageDetails += `🏬 *${label}:* ${transactionData.targetStoreName}\n`;
      }
      
      // Remarks (important for e-commerce orders with phone numbers)
      if (transactionData.remarks) {
        messageDetails += `\n📋 *Детали заказа:*\n${transactionData.remarks}\n`;
      }
      
      // Description
      if (transactionData.description) {
        messageDetails += `\n📄 *Описание:* ${transactionData.description}\n`;
      }
      
      // Transaction ID
      messageDetails += `\n📝 *ID:* \`${transactionData.transactionId || "N/A"}\`\n`;
      
      // Time
      messageDetails += `🕐 *Время:* ${new Date().toLocaleString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })}\n`;

      // Format transaction message
      const message =
        `${config.emoji} *${config.title}*\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        messageDetails +
        `\n━━━━━━━━━━━━━━━━━━`;

      await this.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (error) {
      logger.error(
        "Error notifying organization owner about transaction",
        "telegramController",
        {
          error: (error as Error).message,
          organizationId: transactionData.organizationId,
        }
      );
    }
  }

  /**
   * Notifies organization owner about multiple transactions (batch summary)
   */
  async notifyTransactionBatch(batchData: {
    organizationId: string;
    storeName: string;
    transactions: Array<{
      amount: number;
      type: "sale" | "refund" | "import" | "transfer_in" | "transfer_out" | "adjustment" | "internal_use" | "supplier_return" | "debt";
      description?: string;
    }>;
    totalAmount: number;
    currency?: string;
  }) {
    try {
      // Find the organization owner
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
          "telegramController",
          { organizationId: batchData.organizationId }
        );
        return;
      }

      const chatId = Number(owner.push_token);
      const currency = batchData.currency || "UZS";
      const formattedTotal = batchData.totalAmount.toLocaleString("ru-RU");

      // Count transaction types
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

      // Build summary lines only for non-zero counts
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
        "telegramController",
        {
          error: (error as Error).message,
          organizationId: batchData.organizationId,
        }
      );
    }
  }

  /**
   * Answers callback query
   */
  private async answerCallback(callbackQueryId: string, text: string) {
    if (!this.bot) return;
    try {
      await this.bot.answerCallbackQuery(callbackQueryId, { text });
    } catch (error) {
      logger.error("Error answering callback query", "telegramController", {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Updates message text and removes inline buttons
   */
  private async updateMessageButtons(
    chatId: number,
    messageId: number | undefined,
    statusText: string
  ) {
    if (!this.bot || !messageId) return;
    try {
      await this.bot.editMessageText(statusText, {
        chat_id: chatId,
        message_id: messageId,
      });
    } catch (error) {
      logger.error("Error updating Telegram message", "telegramController", {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Sends a message to a chat
   */
  private async sendMessage(
    chatId: number,
    text: string,
    options?: TelegramBot.SendMessageOptions
  ) {
    if (!this.bot) return;
    try {
      await this.bot.sendMessage(chatId, text, options);
    } catch (error) {
      logger.error("Error sending Telegram message", "telegramController", {
        error: (error as Error).message,
      });
    }
  }
}
