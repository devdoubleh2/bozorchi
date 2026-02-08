"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsController = void 0;
var transactionService = require("../services/transactions");
var zod_1 = require("zod");
var index_1 = require("../generated/tenant/client/index");
var Decimal = index_1.Prisma.Decimal;
var getTransactionsSchema = zod_1.z.object({
    storeId: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    type: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional().transform(function (val) { return val ? parseInt(val, 10) : undefined; }),
    page: zod_1.z.string().optional().transform(function (val) { return val ? parseInt(val, 10) : undefined; }),
    // Allow store_id for backward compatibility if needed, though we prefer storeId
    store_id: zod_1.z.string().optional(),
});
var getTransactionsByGroupSchema = zod_1.z.object({
    groupId: zod_1.z.string().min(1),
});
var getTransactionsByGroupQuerySchema = zod_1.z.object({
    storeId: zod_1.z.string().optional(),
});
var createTransactionSchema = zod_1.z.object({
    product_variation_id: zod_1.z.string().min(1),
    store_id: zod_1.z.string().min(1),
    transaction_type: zod_1.z.enum(["sale", "import", "export", "loss", "return", "exchange"]),
    quantity: zod_1.z.number().int().positive(),
    unit_price: zod_1.z.number().optional(),
    total_amount: zod_1.z.number().optional(),
    payment_method: zod_1.z.nativeEnum(index_1.PaymentMethod).optional(),
    customer_id: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
var returnTransactionSchema = zod_1.z.object({
    quantity: zod_1.z.number().int().positive(),
});
var getTransactionSummarySchema = zod_1.z.object({
    storeId: zod_1.z.string().optional(),
    store_id: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
});
var exchangeTransactionSchema = zod_1.z.object({
    returnQuantity: zod_1.z.number().int().positive(),
    newProductVariationId: zod_1.z.string().min(1),
    newQuantity: zod_1.z.number().int().positive(),
    newUnitPrice: zod_1.z.number(),
    paymentMethod: zod_1.z.nativeEnum(index_1.PaymentMethod).optional(),
});
var repayDebtSchema = zod_1.z.object({
    customerId: zod_1.z.string().min(1),
    amount: zod_1.z.number().positive(),
    storeId: zod_1.z.string().min(1),
});
var TransactionsController = /** @class */ (function () {
    function TransactionsController() {
    }
    TransactionsController.prototype.getTransactions = function (req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var validation, _b, startDate, endDate, type, limit, page, userId, result, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        validation = getTransactionsSchema.safeParse(req.query);
                        if (!validation.success) {
                            return [2 /*return*/, res.status(400).json({ error: "Invalid query parameters", details: validation.error.issues })];
                        }
                        _b = validation.data, startDate = _b.startDate, endDate = _b.endDate, type = _b.type, limit = _b.limit, page = _b.page;
                        userId = req.userId;
                        if (!((_a = req.store) === null || _a === void 0 ? void 0 : _a.id)) {
                            return [2 /*return*/, res.status(400).json({ error: "Store ID is required" })];
                        }
                        if (!req.tenantPrisma) {
                            return [2 /*return*/, res.status(404).json({ error: "Tenant not found" })];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, transactionService.getTransactions({
                                storeId: req.store.id,
                                userId: userId,
                                startDate: startDate,
                                endDate: endDate,
                                transactionType: type,
                                limit: limit,
                                page: page,
                            }, req.tenantPrisma)];
                    case 2:
                        result = _c.sent();
                        return [2 /*return*/, res.json(result)];
                    case 3:
                        error_1 = _c.sent();
                        console.error("Error in getTransactions:", error_1);
                        return [2 /*return*/, res.status(500).json({ message: "Internal server error", error: String(error_1) })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    TransactionsController.prototype.getTransactionsByGroup = function (req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var paramsValidation, groupId, queryValidation, storeId, storeIdToUse, transactions;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        paramsValidation = getTransactionsByGroupSchema.safeParse(req.params);
                        if (!paramsValidation.success) {
                            return [2 /*return*/, res.status(400).json({ error: "Invalid params", details: paramsValidation.error.issues })];
                        }
                        groupId = paramsValidation.data.groupId;
                        queryValidation = getTransactionsByGroupQuerySchema.safeParse(req.query);
                        if (!queryValidation.success) {
                            return [2 /*return*/, res.status(400).json({ error: "Invalid query", details: queryValidation.error.issues })];
                        }
                        storeId = queryValidation.data.storeId;
                        storeIdToUse = storeId || ((_a = req.store) === null || _a === void 0 ? void 0 : _a.id);
                        if (!storeIdToUse) {
                            return [2 /*return*/, res.status(400).json({ message: "storeId is required" })];
                        }
                        if (!req.tenantPrisma) {
                            return [2 /*return*/, res.status(404).json({ error: "Tenant not found" })];
                        }
                        return [4 /*yield*/, transactionService.getTransactionsByGroupId(storeIdToUse, groupId, req.tenantPrisma)];
                    case 1:
                        transactions = _b.sent();
                        return [2 /*return*/, res.json({ transactions: transactions })];
                }
            });
        });
    };
    TransactionsController.prototype.createTransaction = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var validation, userId, _a, unit_price, total_amount, rest, transactionData, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        validation = createTransactionSchema.safeParse(req.body);
                        if (!validation.success) {
                            return [2 /*return*/, res.status(400).json({ error: "Invalid input data", details: validation.error.issues })];
                        }
                        userId = req.userId;
                        _a = validation.data, unit_price = _a.unit_price, total_amount = _a.total_amount, rest = __rest(_a, ["unit_price", "total_amount"]);
                        transactionData = __assign(__assign({}, rest), { unit_price: unit_price ? new Decimal(unit_price) : undefined, total_amount: total_amount ? new Decimal(total_amount) : undefined, userId: userId });
                        // Note: The service `createTransaction` might need to be updated to accept `Decimal` if it doesn't already,
                        // or we cast it. In `inventoryController`, it was passed `new Decimal()`.
                        // Actually, `inventoryController` imports `createTransaction` from `@/services/transactions`.
                        // Here we import `* as transactionService`.
                        if (!req.tenantPrisma) {
                            return [2 /*return*/, res.status(404).json({ error: "Tenant not found" })];
                        }
                        return [4 /*yield*/, transactionService.createTransaction(transactionData, req.tenantPrisma)];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, res.status(201).json({
                                message: "Transaction created successfully",
                                transaction: result,
                            })];
                }
            });
        });
    };
    TransactionsController.prototype.getTransaction = function (req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var id, transaction;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        id = req.params.id;
                        if (!id) {
                            return [2 /*return*/, res.status(400).json({ error: "Transaction ID is required" })];
                        }
                        // Fix: getTransaction expects (id, userId) or (id, userId, storeId). 
                        // The error said "Expected 1-2 arguments, but got 3".
                        // Let's check the service definition if possible, but based on error, it likely only takes 2 args.
                        // Or maybe (id, userId).
                        // I will try with 2 arguments first as `req.store?.id` might be implicit or not needed if ID is unique.
                        // Wait, the error `Expected 1-2 arguments, but got 3` implies it accepts at most 2.
                        if (!req.tenantPrisma) {
                            return [2 /*return*/, res.status(404).json({ error: "Tenant not found" })];
                        }
                        return [4 /*yield*/, transactionService.getTransaction(id, (_a = req.store) === null || _a === void 0 ? void 0 : _a.id, req.tenantPrisma)];
                    case 1:
                        transaction = _b.sent();
                        return [2 /*return*/, res.json({ transaction: transaction })];
                }
            });
        });
    };
    TransactionsController.prototype.returnTransaction = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, validation, quantity, userId, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = req.params.id;
                        if (!id) {
                            return [2 /*return*/, res.status(400).json({ error: "Transaction ID is required" })];
                        }
                        validation = returnTransactionSchema.safeParse(req.body);
                        if (!validation.success) {
                            return [2 /*return*/, res.status(400).json({ error: "Invalid input data", details: validation.error.issues })];
                        }
                        quantity = validation.data.quantity;
                        userId = req.userId;
                        if (!req.tenantPrisma) {
                            return [2 /*return*/, res.status(404).json({ error: "Tenant not found" })];
                        }
                        return [4 /*yield*/, transactionService.returnTransaction(id, userId, quantity, req.tenantPrisma)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, res.status(200).json({
                                message: "Transaction returned successfully",
                                transaction: result,
                            })];
                }
            });
        });
    };
    TransactionsController.prototype.getTransactionSummary = function (req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var validation, _b, storeId, store_id, startDate, endDate, storeIdToUse, summary;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        validation = getTransactionSummarySchema.safeParse(req.query);
                        if (!validation.success) {
                            return [2 /*return*/, res.status(400).json({ error: "Invalid query parameters", details: validation.error.issues })];
                        }
                        _b = validation.data, storeId = _b.storeId, store_id = _b.store_id, startDate = _b.startDate, endDate = _b.endDate;
                        storeIdToUse = storeId || store_id || ((_a = req.store) === null || _a === void 0 ? void 0 : _a.id);
                        if (!storeIdToUse) {
                            return [2 /*return*/, res.status(400).json({ error: "Store ID is required" })];
                        }
                        if (!startDate || !endDate) {
                            return [2 /*return*/, res.status(400).json({ error: "Start date and end date are required" })];
                        }
                        if (!req.tenantPrisma) {
                            return [2 /*return*/, res.status(404).json({ error: "Tenant not found" })];
                        }
                        return [4 /*yield*/, transactionService.getTransactionSummary(storeIdToUse, startDate, endDate, req.tenantPrisma)];
                    case 1:
                        summary = _c.sent();
                        return [2 /*return*/, res.json({ summary: summary })];
                }
            });
        });
    };
    TransactionsController.prototype.exchangeTransaction = function (req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var id, userId, transaction, validation, _b, returnQuantity, newProductVariationId, newQuantity, newUnitPrice, paymentMethod, result;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        id = req.params.id;
                        if (!id) {
                            return [2 /*return*/, res.status(400).json({ error: "Transaction ID is required" })];
                        }
                        userId = req.userId;
                        if (!req.tenantPrisma) {
                            return [2 /*return*/, res.status(404).json({ error: "Tenant not found" })];
                        }
                        return [4 /*yield*/, transactionService.getTransaction(id, (_a = req.store) === null || _a === void 0 ? void 0 : _a.id, req.tenantPrisma)];
                    case 1:
                        transaction = _c.sent();
                        if (!transaction) {
                            return [2 /*return*/, res.status(404).json({ error: "Transaction not found" })];
                        }
                        validation = exchangeTransactionSchema.safeParse(req.body);
                        if (!validation.success) {
                            return [2 /*return*/, res.status(400).json({ error: "Invalid input data", details: validation.error.issues })];
                        }
                        _b = validation.data, returnQuantity = _b.returnQuantity, newProductVariationId = _b.newProductVariationId, newQuantity = _b.newQuantity, newUnitPrice = _b.newUnitPrice, paymentMethod = _b.paymentMethod;
                        return [4 /*yield*/, transactionService.exchangeTransaction(id, userId, {
                                returnQuantity: returnQuantity,
                                newProductVariationId: newProductVariationId,
                                newQuantity: newQuantity,
                                newUnitPrice: new Decimal(newUnitPrice),
                                paymentMethod: paymentMethod,
                            }, req.tenantPrisma)];
                    case 2:
                        result = _c.sent();
                        return [2 /*return*/, res.json({
                                message: "Exchange processed successfully",
                                result: result,
                            })];
                }
            });
        });
    };
    TransactionsController.prototype.repayDebt = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, validation, _a, customerId, amount, storeId, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        userId = req.userId;
                        validation = repayDebtSchema.safeParse(req.body);
                        if (!validation.success) {
                            return [2 /*return*/, res.status(400).json({ error: "Invalid input data", details: validation.error.issues })];
                        }
                        _a = validation.data, customerId = _a.customerId, amount = _a.amount, storeId = _a.storeId;
                        if (!req.tenantPrisma) {
                            return [2 /*return*/, res.status(404).json({ error: "Tenant not found" })];
                        }
                        return [4 /*yield*/, transactionService.repayDebt(customerId, new Decimal(amount), storeId, userId, req.tenantPrisma)];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, res.json({
                                message: "Debt repayment processed successfully",
                                transaction: result,
                            })];
                }
            });
        });
    };
    return TransactionsController;
}());
exports.TransactionsController = TransactionsController;
