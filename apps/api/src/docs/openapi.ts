type SchemaObject = {
  type?: string;
  format?: string;
  nullable?: boolean;
  description?: string;
  enum?: readonly string[];
  properties?: Record<string, SchemaObject | ReferenceObject>;
  required?: string[];
  items?: SchemaObject | ReferenceObject;
  additionalProperties?: boolean | SchemaObject | ReferenceObject;
  oneOf?: Array<SchemaObject | ReferenceObject>;
  anyOf?: Array<SchemaObject | ReferenceObject>;
  example?: unknown;
  default?: unknown;
  minimum?: number;
  maximum?: number;
};

type ReferenceObject = {
  $ref: string;
};

type ParameterObject = {
  name: string;
  in: "query" | "header" | "path" | "cookie";
  required?: boolean;
  description?: string;
  schema: SchemaObject | ReferenceObject;
};

type RequestBodyObject = {
  required?: boolean;
  content: Record<
    string,
    {
      schema: SchemaObject | ReferenceObject;
    }
  >;
};

type ResponseObject = {
  description: string;
  content?: Record<
    string,
    {
      schema: SchemaObject | ReferenceObject;
    }
  >;
};

type OperationObject = {
  tags: string[];
  summary: string;
  description?: string;
  security?: Array<Record<string, string[]>>;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: Record<string, ResponseObject | ReferenceObject>;
};

type PathItemObject = Partial<
  Record<"get" | "post" | "put" | "patch" | "delete", OperationObject>
>;

type OpenApiDocument = {
  openapi: "3.1.0";
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  tags: Array<{
    name: string;
    description: string;
  }>;
  paths: Record<string, PathItemObject>;
  components: {
    securitySchemes: Record<
      string,
      | {
          type: "http";
          scheme: string;
          bearerFormat?: string;
        }
      | {
          type: "apiKey";
          in: "cookie" | "header" | "query";
          name: string;
        }
    >;
    schemas: Record<string, SchemaObject | ReferenceObject>;
    responses: Record<string, ResponseObject>;
  };
};

const jsonContent = (schema: SchemaObject | ReferenceObject) => ({
  "application/json": { schema },
});

const schemaRef = (name: string): ReferenceObject => ({
  $ref: `#/components/schemas/${name}`,
});

const responseRef = (name: string): ReferenceObject => ({
  $ref: `#/components/responses/${name}`,
});

const idParam = (name = "id", description = "Resource identifier"): ParameterObject => ({
  name,
  in: "path",
  required: true,
  description,
  schema: schemaRef("Id"),
});

const queryParam = (
  name: string,
  schema: SchemaObject | ReferenceObject = { type: "string" },
  description?: string
): ParameterObject => ({
  name,
  in: "query",
  required: false,
  description,
  schema,
});

const pageParams: ParameterObject[] = [
  queryParam("page", { type: "integer", minimum: 1 }, "Page number"),
  queryParam("limit", { type: "integer", minimum: 1, maximum: 100 }, "Page size"),
];

const dateRangeParams: ParameterObject[] = [
  queryParam("startDate", { type: "string", format: "date-time" }),
  queryParam("endDate", { type: "string", format: "date-time" }),
];

const protectedSecurity: Array<Record<string, string[]>> = [
  { CookieAuth: [] },
  { BearerAuth: [] },
];

const okResponse = (
  description = "Request completed successfully",
  schema: SchemaObject | ReferenceObject = schemaRef("ApiResponse")
): ResponseObject => ({
  description,
  content: jsonContent(schema),
});

const createdResponse = (
  description = "Resource created successfully",
  schema: SchemaObject | ReferenceObject = schemaRef("ApiResponse")
): ResponseObject => ({
  description,
  content: jsonContent(schema),
});

const body = (schema: SchemaObject | ReferenceObject, required = true): RequestBodyObject => ({
  required,
  content: jsonContent(schema),
});

const multipartBody = (
  schema: SchemaObject | ReferenceObject,
  required = true
): RequestBodyObject => ({
  required,
  content: {
    "multipart/form-data": { schema },
  },
});

const protectedResponses = {
  "401": responseRef("Unauthorized"),
  "403": responseRef("Forbidden"),
  "500": responseRef("InternalServerError"),
};

const validationResponses = {
  "400": responseRef("ValidationError"),
  ...protectedResponses,
};

const protectedOperation = (
  tags: string[],
  summary: string,
  options: Omit<OperationObject, "tags" | "summary" | "security" | "responses"> & {
    responses?: Record<string, ResponseObject | ReferenceObject>;
  } = {}
): OperationObject => ({
  tags,
  summary,
  security: protectedSecurity,
  ...options,
  responses: {
    "200": okResponse(),
    ...protectedResponses,
    ...options.responses,
  },
});

const publicOperation = (
  tags: string[],
  summary: string,
  options: Omit<OperationObject, "tags" | "summary" | "responses"> & {
    responses?: Record<string, ResponseObject | ReferenceObject>;
  } = {}
): OperationObject => ({
  tags,
  summary,
  ...options,
  responses: {
    "200": okResponse(),
    "500": responseRef("InternalServerError"),
    ...options.responses,
  },
});

const path = (item: PathItemObject): PathItemObject => item;

export const openApiDocument: OpenApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Bozorchi API",
    version: "1.0.0",
    description:
      "OpenAPI documentation for the Bozorchi Express API. Protected endpoints currently authenticate with the HttpOnly `token` cookie; a bearer scheme is also described for API clients and gateways that forward JWTs.",
  },
  servers: [
    {
      url: "/",
      description: "Current API host",
    },
  ],
  tags: [
    { name: "system", description: "Health and API discovery endpoints" },
    { name: "auth", description: "Authentication, profile, and password flows" },
    { name: "stores", description: "Store management and switching" },
    { name: "products", description: "Products and product variations" },
    { name: "categories", description: "Product category management" },
    { name: "inventory", description: "Stock, transfers, and audits" },
    { name: "transactions", description: "Sales, returns, exchanges, and stock movements" },
    { name: "customers", description: "Customers and loyalty cards" },
    { name: "suppliers", description: "Supplier management" },
    { name: "reports", description: "Analytics reports" },
    { name: "payments", description: "Billing and point-of-sale payment integrations" },
    { name: "notifications", description: "Push notification registration and counters" },
    { name: "organizations", description: "Organization and public e-commerce endpoints" },
    { name: "files", description: "File uploads" },
    { name: "import", description: "Bulk import workflows" },
    { name: "admin", description: "Staff, users, backup, and administrative utilities" },
    { name: "webhooks", description: "External service webhooks" },
  ],
  paths: {
    "/health": path({
      get: publicOperation(["system"], "Health check", {
        responses: {
          "200": okResponse("API process health", schemaRef("HealthResponse")),
        },
      }),
    }),
    "/api": path({
      get: publicOperation(["system"], "API discovery", {
        responses: {
          "200": okResponse("API metadata and endpoint links", schemaRef("ApiDiscovery")),
        },
      }),
    }),

    "/api/auth/register": path({
      post: publicOperation(["auth"], "Register a user", {
        requestBody: body(schemaRef("RegisterRequest")),
        responses: {
          "201": createdResponse("User registered", schemaRef("AuthResponse")),
          "400": responseRef("ValidationError"),
        },
      }),
    }),
    "/api/auth/login": path({
      post: publicOperation(["auth"], "Log in and receive an auth cookie", {
        requestBody: body(schemaRef("LoginRequest")),
        responses: {
          "200": okResponse("Logged in", schemaRef("AuthResponse")),
          "400": responseRef("ValidationError"),
          "401": responseRef("Unauthorized"),
        },
      }),
    }),
    "/api/auth/logout": path({
      post: publicOperation(["auth"], "Clear the auth cookie", {
        responses: {
          "200": okResponse("Logged out", schemaRef("MessageResponse")),
        },
      }),
    }),
    "/api/auth/profile": path({
      get: protectedOperation(["auth"], "Get current user profile"),
      put: protectedOperation(["auth"], "Update current user profile", {
        requestBody: body(schemaRef("UpdateProfileRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/auth/password": path({
      put: protectedOperation(["auth"], "Change current user password", {
        requestBody: body(schemaRef("ChangePasswordRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/auth/me": path({
      delete: protectedOperation(["auth"], "Delete current user account", {
        responses: {
          "204": { description: "Account deleted" },
          ...protectedResponses,
        },
      }),
    }),
    "/api/auth/forgot-password": path({
      post: publicOperation(["auth"], "Request a password reset", {
        requestBody: body(schemaRef("ForgotPasswordRequest")),
        responses: {
          "200": okResponse("Password reset requested", schemaRef("MessageResponse")),
          "400": responseRef("ValidationError"),
        },
      }),
    }),
    "/api/auth/reset-password": path({
      post: publicOperation(["auth"], "Reset password with token", {
        requestBody: body(schemaRef("ResetPasswordRequest")),
        responses: {
          "200": okResponse("Password reset", schemaRef("MessageResponse")),
          "400": responseRef("ValidationError"),
        },
      }),
    }),

    "/api/stores/create": path({
      post: protectedOperation(["stores"], "Create a store", {
        requestBody: body(schemaRef("CreateStoreRequest")),
        responses: {
          "201": createdResponse(),
          ...validationResponses,
        },
      }),
    }),
    "/api/stores": path({
      get: protectedOperation(["stores"], "List stores", {
        parameters: pageParams,
      }),
      put: protectedOperation(["stores"], "Update active store", {
        requestBody: body(schemaRef("UpdateStoreRequest")),
        responses: validationResponses,
      }),
      delete: protectedOperation(["stores"], "Delete active store", {
        responses: protectedResponses,
      }),
    }),
    "/api/stores/search": path({
      get: protectedOperation(["stores"], "Search stores", {
        parameters: [
          queryParam("q", { type: "string", minimum: 2 }, "Search query"),
        ],
        responses: validationResponses,
      }),
    }),
    "/api/stores/switch": path({
      post: protectedOperation(["stores"], "Switch active store", {
        requestBody: body(schemaRef("SwitchStoreRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/stores/switch/{id}": path({
      get: protectedOperation(["stores"], "Get store by ID using legacy switch route", {
        parameters: [idParam()],
      }),
    }),
    "/api/stores/my-store": path({
      get: protectedOperation(["stores"], "Get current user's store"),
    }),
    "/api/stores/stats": path({
      get: protectedOperation(["stores"], "Get store statistics"),
    }),
    "/api/stores/history": path({
      get: protectedOperation(["stores"], "Get store subscription history"),
    }),
    "/api/stores/{id}": path({
      get: protectedOperation(["stores"], "Get store by ID", {
        parameters: [idParam()],
      }),
    }),

    "/api/products/list": path({
      get: protectedOperation(["products"], "List products", {
        parameters: [
          ...pageParams,
          queryParam("search", { type: "string" }),
          queryParam("category", { type: "string" }),
          queryParam("storeId", { type: "string" }),
        ],
      }),
    }),
    "/api/products/search": path({
      get: protectedOperation(["products"], "Search products", {
        parameters: [queryParam("q", { type: "string" })],
      }),
    }),
    "/api/products/barcode/{barcode}": path({
      get: protectedOperation(["products"], "Get product by barcode", {
        parameters: [
          {
            name: "barcode",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
      }),
    }),
    "/api/products": path({
      post: protectedOperation(["products"], "Create a product", {
        requestBody: body(schemaRef("CreateProductRequest")),
        responses: {
          "201": createdResponse(),
          ...validationResponses,
        },
      }),
    }),
    "/api/products/bulk-update": path({
      put: protectedOperation(["products"], "Bulk update products and variations", {
        requestBody: body(schemaRef("BulkProductUpdateRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/products/bulk": path({
      delete: protectedOperation(["products"], "Bulk delete products", {
        requestBody: body(schemaRef("BulkDeleteRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/products/{id}": path({
      get: protectedOperation(["products"], "Get product by ID", {
        parameters: [idParam()],
      }),
      put: protectedOperation(["products"], "Update product", {
        parameters: [idParam()],
        requestBody: body(schemaRef("UpdateProductRequest")),
        responses: validationResponses,
      }),
      delete: protectedOperation(["products"], "Delete product", {
        parameters: [idParam()],
        responses: validationResponses,
      }),
    }),
    "/api/product-variations/{id}": path({
      get: protectedOperation(["products"], "Get product variation by ID", {
        parameters: [idParam()],
      }),
    }),

    "/api/product-categories/names": path({
      get: protectedOperation(["categories"], "List product category names"),
    }),
    "/api/product-categories": path({
      get: protectedOperation(["categories"], "List product categories"),
      post: protectedOperation(["categories"], "Create product category", {
        requestBody: body(schemaRef("ProductCategoryRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/product-categories/{id}": path({
      put: protectedOperation(["categories"], "Update product category", {
        parameters: [idParam()],
        requestBody: body(schemaRef("ProductCategoryRequest")),
        responses: validationResponses,
      }),
      delete: protectedOperation(["categories"], "Delete product category", {
        parameters: [idParam()],
        responses: validationResponses,
      }),
    }),

    "/api/inventory": path({
      get: protectedOperation(["inventory"], "List inventory", {
        parameters: [
          ...pageParams,
          queryParam("storeId"),
          queryParam("productId"),
          queryParam("lowStock", { type: "boolean" }),
          queryParam("stock_level", {
            type: "string",
            enum: ["low", "out", "in_stock"],
          }),
          queryParam("search"),
          queryParam("category"),
          queryParam("price_min", { type: "number", minimum: 0 }),
          queryParam("price_max", { type: "number", minimum: 0 }),
          queryParam("includeAll", { type: "boolean" }),
        ],
        responses: validationResponses,
      }),
    }),
    "/api/inventory/stats": path({
      get: protectedOperation(["inventory"], "Get stock report", {
        parameters: pageParams,
      }),
    }),
    "/api/inventory/low-stock": path({
      get: protectedOperation(["inventory"], "List low stock items", {
        parameters: pageParams,
      }),
    }),
    "/api/inventory/{id}": path({
      get: protectedOperation(["inventory"], "Get inventory record", {
        parameters: [idParam("id", "Inventory identifier")],
        responses: validationResponses,
      }),
    }),
    "/api/inventory/restock": path({
      post: protectedOperation(["inventory"], "Restock inventory", {
        requestBody: body(schemaRef("RestockRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/inventory/transfer": path({
      post: protectedOperation(["inventory"], "Transfer inventory between stores", {
        requestBody: body(schemaRef("InventoryTransferRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/audit/history": path({
      get: protectedOperation(["inventory"], "List inventory audits", {
        parameters: [
          queryParam("status", {
            type: "string",
            enum: ["in_progress", "completed", "cancelled"],
          }),
        ],
      }),
    }),
    "/api/audit/start": path({
      post: protectedOperation(["inventory"], "Start inventory audit", {
        requestBody: body(schemaRef("StartAuditRequest"), false),
        responses: {
          "201": createdResponse(),
          ...validationResponses,
        },
      }),
    }),
    "/api/audit/{id}": path({
      get: protectedOperation(["inventory"], "Get inventory audit", {
        parameters: [idParam()],
      }),
    }),
    "/api/audit/{id}/scan": path({
      post: protectedOperation(["inventory"], "Scan item during inventory audit", {
        parameters: [idParam()],
        requestBody: body(schemaRef("AuditScanRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/audit/{id}/item": path({
      put: protectedOperation(["inventory"], "Update inventory audit item", {
        parameters: [idParam()],
        requestBody: body(schemaRef("AuditItemUpdateRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/audit/{id}/complete": path({
      post: protectedOperation(["inventory"], "Complete inventory audit", {
        parameters: [idParam()],
      }),
    }),
    "/api/audit/{id}/cancel": path({
      put: protectedOperation(["inventory"], "Cancel inventory audit", {
        parameters: [idParam()],
      }),
    }),

    "/api/transactions": path({
      get: protectedOperation(["transactions"], "List transactions", {
        parameters: [
          ...dateRangeParams,
          queryParam("type", schemaRef("TransactionType")),
          ...pageParams,
        ],
        responses: validationResponses,
      }),
      post: protectedOperation(["transactions"], "Create transaction", {
        requestBody: body(schemaRef("CreateTransactionRequest")),
        responses: {
          "201": createdResponse(),
          ...validationResponses,
        },
      }),
    }),
    "/api/transactions/stats": path({
      get: protectedOperation(["transactions"], "Get dashboard transaction statistics", {
        parameters: dateRangeParams,
        responses: validationResponses,
      }),
    }),
    "/api/transactions/group/{groupId}": path({
      get: protectedOperation(["transactions"], "List transactions by group", {
        parameters: [
          idParam("groupId", "Transaction group identifier"),
          {
            name: "storeId",
            in: "query",
            required: true,
            schema: schemaRef("Id"),
          },
        ],
        responses: validationResponses,
      }),
    }),
    "/api/transactions/{id}": path({
      get: protectedOperation(["transactions"], "Get transaction by ID", {
        parameters: [idParam()],
      }),
      delete: protectedOperation(["transactions"], "Delete transaction", {
        parameters: [idParam()],
        responses: validationResponses,
      }),
    }),
    "/api/transactions/{id}/return": path({
      post: protectedOperation(["transactions"], "Return transaction items", {
        parameters: [idParam()],
        requestBody: body(schemaRef("ReturnTransactionRequest"), false),
        responses: validationResponses,
      }),
    }),
    "/api/transactions/{id}/exchange": path({
      post: protectedOperation(["transactions"], "Exchange transaction items", {
        parameters: [idParam()],
        requestBody: body(schemaRef("ExchangeTransactionRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/transactions/debt-repayment": path({
      post: protectedOperation(["transactions"], "Record customer debt repayment", {
        requestBody: body(schemaRef("DebtRepaymentRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/transactions/transfer": path({
      post: protectedOperation(["transactions"], "Transfer stock", {
        requestBody: body(schemaRef("StockTransferRequest")),
        responses: validationResponses,
      }),
    }),

    "/api/customers": path({
      get: protectedOperation(["customers"], "List customers"),
      post: protectedOperation(["customers"], "Create customer", {
        requestBody: body(schemaRef("CustomerRequest")),
      }),
    }),
    "/api/customers/{id}": path({
      get: protectedOperation(["customers"], "Get customer", {
        parameters: [idParam()],
      }),
      put: protectedOperation(["customers"], "Update customer", {
        parameters: [idParam()],
        requestBody: body(schemaRef("CustomerRequest"), false),
      }),
      delete: protectedOperation(["customers"], "Delete customer", {
        parameters: [idParam()],
      }),
    }),
    "/api/customers/loyalty-cards": path({
      post: protectedOperation(["customers"], "Create customer loyalty card", {
        requestBody: body(schemaRef("LoyaltyCardRequest")),
      }),
    }),
    "/api/customers/{customer_id}/loyalty-points": path({
      put: protectedOperation(["customers"], "Update customer loyalty points", {
        parameters: [idParam("customer_id", "Customer identifier")],
        requestBody: body(schemaRef("LoyaltyPointsRequest")),
      }),
    }),
    "/api/customers/{customer_id}/loyalty-card": path({
      delete: protectedOperation(["customers"], "Delete customer loyalty card", {
        parameters: [idParam("customer_id", "Customer identifier")],
      }),
    }),

    "/api/suppliers": path({
      get: protectedOperation(["suppliers"], "List suppliers"),
      post: protectedOperation(["suppliers"], "Create supplier", {
        requestBody: body(schemaRef("SupplierRequest")),
      }),
    }),
    "/api/suppliers/stats": path({
      get: protectedOperation(["suppliers"], "Get supplier statistics"),
    }),
    "/api/suppliers/{id}": path({
      get: protectedOperation(["suppliers"], "Get supplier", {
        parameters: [idParam()],
      }),
      put: protectedOperation(["suppliers"], "Update supplier", {
        parameters: [idParam()],
        requestBody: body(schemaRef("SupplierRequest"), false),
      }),
      delete: protectedOperation(["suppliers"], "Delete supplier", {
        parameters: [idParam()],
      }),
    }),

    "/api/units": path({
      get: protectedOperation(["products"], "List units", {
        parameters: [
          queryParam("search", { type: "string", maximum: 50 }),
          ...pageParams,
        ],
        responses: validationResponses,
      }),
      post: protectedOperation(["products"], "Create unit", {
        requestBody: body(schemaRef("UnitRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/units/{id}": path({
      get: protectedOperation(["products"], "Get unit", {
        parameters: [idParam()],
      }),
      put: protectedOperation(["products"], "Update unit", {
        parameters: [idParam()],
        requestBody: body(schemaRef("UnitRequest")),
        responses: validationResponses,
      }),
      delete: protectedOperation(["products"], "Delete unit", {
        parameters: [idParam()],
        responses: validationResponses,
      }),
    }),

    "/api/write-offs": path({
      get: protectedOperation(["inventory"], "List write-offs"),
      post: protectedOperation(["inventory"], "Create write-off", {
        requestBody: body(schemaRef("WriteOffRequest")),
      }),
    }),
    "/api/write-offs/summary": path({
      get: protectedOperation(["inventory"], "Get write-off summary"),
    }),
    "/api/write-offs/{id}": path({
      delete: protectedOperation(["inventory"], "Delete or reverse write-off", {
        parameters: [idParam()],
      }),
    }),

    "/api/reports/sellers": path({
      get: protectedOperation(["reports"], "Get seller performance report", {
        parameters: [
          ...dateRangeParams,
          queryParam("sortBy", {
            type: "string",
            enum: ["revenue", "quantity", "profit"],
          }),
          queryParam("limit", { type: "integer", minimum: 1, maximum: 500 }),
        ],
      }),
    }),
    "/api/reports/products": path({
      get: protectedOperation(["reports"], "Get product performance report", {
        parameters: [
          ...dateRangeParams,
          queryParam("sortBy", {
            type: "string",
            enum: ["revenue", "quantity", "profit"],
          }),
          queryParam("limit", { type: "integer", minimum: 1, maximum: 500 }),
        ],
      }),
    }),

    "/api/currencies": path({
      get: protectedOperation(["admin"], "List currencies"),
      post: protectedOperation(["admin"], "Create currency", {
        requestBody: body(schemaRef("CurrencyRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/currencies/{id}": path({
      put: protectedOperation(["admin"], "Update currency", {
        parameters: [idParam()],
        requestBody: body(schemaRef("CurrencyRequest"), false),
        responses: validationResponses,
      }),
      delete: protectedOperation(["admin"], "Delete currency", {
        parameters: [idParam()],
        responses: validationResponses,
      }),
    }),

    "/api/files/upload": path({
      post: protectedOperation(["files"], "Upload an image", {
        requestBody: multipartBody(schemaRef("FileUploadRequest")),
        responses: {
          "201": createdResponse("File uploaded", schemaRef("FileUploadResponse")),
          ...validationResponses,
        },
      }),
    }),
    "/api/import/template": path({
      get: protectedOperation(["import"], "Download import template", {
        responses: {
          "200": {
            description: "Spreadsheet template file",
            content: {
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
                schema: { type: "string", format: "binary" },
              },
            },
          },
          ...protectedResponses,
        },
      }),
    }),
    "/api/import/validate": path({
      post: protectedOperation(["import"], "Validate uploaded import file", {
        requestBody: multipartBody(schemaRef("ImportFileRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/import/validate-json": path({
      post: protectedOperation(["import"], "Validate JSON import rows", {
        requestBody: body(schemaRef("ImportRowsRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/import/execute": path({
      post: protectedOperation(["import"], "Execute bulk import", {
        requestBody: body(schemaRef("ImportRowsRequest")),
        responses: {
          "202": okResponse("Import job accepted", schemaRef("ImportJobResponse")),
          ...validationResponses,
        },
      }),
    }),
    "/api/import/jobs/{jobId}": path({
      get: protectedOperation(["import"], "Get import job status", {
        parameters: [idParam("jobId", "Import job identifier")],
      }),
    }),

    "/api/repricing/preview": path({
      post: protectedOperation(["products"], "Preview repricing changes", {
        requestBody: body(schemaRef("RepricingRequest")),
      }),
    }),
    "/api/repricing/apply": path({
      post: protectedOperation(["products"], "Apply repricing changes", {
        requestBody: body(schemaRef("RepricingRequest")),
      }),
    }),
    "/api/repricing/history": path({
      get: protectedOperation(["products"], "Get price change history"),
    }),

    "/api/staff/assignments": path({
      get: protectedOperation(["admin"], "List staff assignments"),
    }),
    "/api/staff/assignments/{assignmentId}": path({
      put: protectedOperation(["admin"], "Update staff assignment", {
        parameters: [idParam("assignmentId", "Staff assignment identifier")],
        requestBody: body(schemaRef("StaffAssignmentRequest")),
      }),
      delete: protectedOperation(["admin"], "Remove staff assignment", {
        parameters: [idParam("assignmentId", "Staff assignment identifier")],
      }),
    }),
    "/api/staff/assignments/{assignmentId}/approve": path({
      post: protectedOperation(["admin"], "Approve staff assignment", {
        parameters: [idParam("assignmentId", "Staff assignment identifier")],
      }),
    }),
    "/api/users/assign-store": path({
      post: protectedOperation(["admin"], "Assign user to store", {
        requestBody: body(schemaRef("AssignStoreRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/users/me": path({
      delete: protectedOperation(["admin"], "Delete current user account"),
    }),
    "/api/backup/manual": path({
      post: protectedOperation(["admin"], "Trigger manual database backup"),
    }),

    "/api/checkout/create-checkout": path({
      post: protectedOperation(["payments"], "Create subscription checkout", {
        requestBody: body(schemaRef("CheckoutRequest")),
      }),
    }),
    "/api/checkout/cancel-subscription": path({
      post: protectedOperation(["payments"], "Cancel subscription", {
        requestBody: body(schemaRef("CancelSubscriptionRequest")),
      }),
    }),
    "/api/payments/dynamic-qr/initiate": path({
      post: protectedOperation(["payments"], "Initiate dynamic QR payment", {
        requestBody: body(schemaRef("DynamicQrInitiateRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/payments/dynamic-qr/status/{paymentId}": path({
      get: protectedOperation(["payments"], "Check dynamic QR payment status", {
        parameters: [idParam("paymentId", "Payment identifier")],
        responses: validationResponses,
      }),
    }),
    "/api/payments/dynamic-qr/cancel/{orderId}": path({
      post: protectedOperation(["payments"], "Cancel dynamic QR payment", {
        parameters: [idParam("orderId", "Order identifier")],
        requestBody: body(schemaRef("DynamicQrCancelRequest"), false),
        responses: validationResponses,
      }),
    }),
    "/api/payments/dynamic-qr/poll/{paymentId}": path({
      get: protectedOperation(["payments"], "Poll dynamic QR payment status", {
        parameters: [
          idParam("paymentId", "Payment identifier"),
          queryParam("maxAttempts", { type: "integer", minimum: 1 }),
          queryParam("intervalMs", { type: "integer", minimum: 1 }),
        ],
        responses: validationResponses,
      }),
    }),
    "/api/payments/dynamic-qr/generate-qr": path({
      post: protectedOperation(["payments"], "Generate dynamic QR code", {
        requestBody: body(schemaRef("DynamicQrGenerateRequest")),
        responses: validationResponses,
      }),
    }),

    "/api/notifications/token": path({
      post: protectedOperation(["notifications"], "Register push token", {
        requestBody: body(schemaRef("RegisterPushTokenRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/notifications/token/remove": path({
      post: protectedOperation(["notifications"], "Unregister push token", {
        requestBody: body(schemaRef("UnregisterPushTokenRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/notifications/test": path({
      post: protectedOperation(["notifications"], "Send test push notification", {
        requestBody: body(schemaRef("SendTestNotificationRequest")),
        responses: validationResponses,
      }),
    }),
    "/api/notifications/unread-count": path({
      get: protectedOperation(["notifications"], "Get unread notification count"),
    }),

    "/api/organizations": path({
      get: protectedOperation(["organizations"], "Get current user's organization"),
    }),
    "/api/organizations/ecommerce-status": path({
      patch: protectedOperation(["organizations"], "Update organization e-commerce status", {
        requestBody: body(schemaRef("EcommerceStatusRequest"), false),
      }),
    }),
    "/api/organizations/by-name/{slug}": path({
      get: publicOperation(["organizations"], "Get public organization by slug", {
        parameters: [
          {
            name: "slug",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
      }),
    }),
    "/api/organizations/{organizationId}/products": path({
      get: publicOperation(["organizations"], "List public organization products", {
        parameters: [idParam("organizationId", "Organization identifier")],
      }),
    }),
    "/api/organizations/{organizationId}/transactions": path({
      post: publicOperation(["organizations"], "Create public e-commerce order", {
        parameters: [idParam("organizationId", "Organization identifier")],
        requestBody: body(schemaRef("EcommerceTransactionRequest")),
        responses: {
          "202": okResponse("Order received", schemaRef("EcommerceOrderResponse")),
          "400": responseRef("ValidationError"),
          "403": responseRef("Forbidden"),
          "404": responseRef("NotFound"),
          "500": responseRef("InternalServerError"),
        },
      }),
    }),

    "/api/webhook/polar": path({
      post: publicOperation(["webhooks"], "Handle Polar webhook", {
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: true,
              },
            },
          },
        },
        responses: {
          "200": { description: "Webhook accepted" },
          "400": { description: "Invalid webhook signature or payload" },
          "500": responseRef("InternalServerError"),
        },
      }),
    }),
    "/api/telegram/webhook": path({
      post: publicOperation(["webhooks"], "Handle Telegram webhook", {
        requestBody: body({ type: "object", additionalProperties: true }),
      }),
    }),
  },
  components: {
    securitySchemes: {
      CookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
      },
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Id: {
        type: "string",
        description: "Application resource identifier",
        example: "clx123abc456",
      },
      ApiResponse: {
        type: "object",
        additionalProperties: true,
      },
      MessageResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
        required: ["message"],
      },
      ErrorResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "fail" },
          message: { type: "string" },
          error: { type: "string" },
          code: { type: "string" },
          details: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: true,
      },
      ValidationErrorResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "fail" },
          message: { type: "string", example: "Validation failed" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                path: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
        additionalProperties: true,
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1 },
          limit: { type: "integer", minimum: 1 },
          total: { type: "integer", minimum: 0 },
          totalPages: { type: "integer", minimum: 0 },
        },
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["OK"] },
          timestamp: { type: "string", format: "date-time" },
          uptime: { type: "number" },
          environment: { type: "string" },
        },
        required: ["status", "timestamp", "uptime", "environment"],
      },
      ApiDiscovery: {
        type: "object",
        properties: {
          message: { type: "string" },
          version: { type: "string" },
          endpoints: {
            type: "object",
            additionalProperties: { type: "string" },
          },
          documentation: { type: "string" },
          openapi: { type: "string" },
        },
        required: ["message", "version", "endpoints"],
      },
      User: {
        type: "object",
        properties: {
          id: schemaRef("Id"),
          email: { type: "string", format: "email" },
          name: { type: "string", nullable: true },
          role: { type: "string", enum: ["admin", "user"] },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          user: schemaRef("User"),
          token: { type: "string", description: "JWT token when returned in response body" },
          message: { type: "string" },
        },
        additionalProperties: true,
      },
      RegisterRequest: {
        oneOf: [
          {
            type: "object",
            properties: {
              role: { type: "string", enum: ["admin"] },
              name: { type: "string" },
              email: { type: "string", format: "email" },
              password: { type: "string", format: "password", minimum: 8 },
              organization_name: { type: "string" },
              address: { type: "string" },
              currency: { type: "string" },
              phone: { type: "string" },
            },
            required: [
              "role",
              "name",
              "email",
              "password",
              "organization_name",
              "address",
              "currency",
              "phone",
            ],
          },
          {
            type: "object",
            properties: {
              role: { type: "string", enum: ["user"] },
              name: { type: "string" },
              email: { type: "string", format: "email" },
              password: { type: "string", format: "password", minimum: 8 },
              store_id: schemaRef("Id"),
            },
            required: ["role", "name", "email", "password", "store_id"],
          },
        ],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
        },
        required: ["email", "password"],
      },
      ChangePasswordRequest: {
        type: "object",
        properties: {
          currentPassword: { type: "string", format: "password" },
          newPassword: { type: "string", format: "password", minimum: 8 },
        },
        required: ["currentPassword", "newPassword"],
      },
      UpdateProfileRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          name: { type: "string", nullable: true },
          pushToken: { type: "string", nullable: true },
        },
        required: ["email"],
      },
      ForgotPasswordRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
        },
        required: ["email"],
      },
      ResetPasswordRequest: {
        type: "object",
        properties: {
          token: { type: "string" },
          password: { type: "string", format: "password", minimum: 8 },
        },
        required: ["token", "password"],
      },
      Store: {
        type: "object",
        properties: {
          id: schemaRef("Id"),
          name: { type: "string" },
          currency: { type: "string" },
          phone: { type: "string" },
          address: { type: "string" },
        },
        additionalProperties: true,
      },
      CreateStoreRequest: {
        type: "object",
        properties: {
          name: { type: "string", maximum: 100 },
          currency: { type: "string", enum: ["USD", "UZS", "EUR", "RUB"] },
          phone: { type: "string" },
          address: { type: "string" },
          unit_id: schemaRef("Id"),
          loyalty_cashback_percentage: { type: "number", minimum: 0, maximum: 100 },
          online_store_enabled: { type: "boolean" },
          online_store_slug: { type: "string" },
          bopis_enabled: { type: "boolean" },
          online_order_prefix: { type: "string" },
        },
        required: ["name", "currency", "phone", "address"],
      },
      UpdateStoreRequest: {
        type: "object",
        properties: {
          name: { type: "string", maximum: 100 },
          currency: { type: "string", maximum: 3 },
          unit_id: schemaRef("Id"),
          loyalty_cashback_percentage: { type: "number", minimum: 0, maximum: 100 },
          online_store_enabled: { type: "boolean" },
          online_store_slug: { type: "string" },
          bopis_enabled: { type: "boolean" },
          online_order_prefix: { type: "string" },
        },
      },
      SwitchStoreRequest: {
        type: "object",
        properties: {
          storeId: schemaRef("Id"),
        },
        required: ["storeId"],
      },
      ProductVariationInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string", nullable: true },
          barcode: { type: "string", nullable: true },
          sku: { type: "string", nullable: true },
          price: { type: "number", minimum: 0 },
          selling_price: { type: "number", minimum: 0 },
          delivery_cost: { type: "number", minimum: 0, default: 0 },
          wholesale_price: { type: "number", minimum: 0, default: 0 },
          cost_price: { type: "number", minimum: 0, default: 0 },
          unit_id: schemaRef("Id"),
          color: { type: "string", nullable: true },
          initial_stock: { type: "number", minimum: 0, default: 0 },
          image_url: { type: "string", nullable: true },
        },
        required: ["name", "price", "selling_price", "unit_id"],
      },
      CreateProductRequest: {
        type: "object",
        properties: {
          name: { type: "string", maximum: 200 },
          category_id: { type: "string", nullable: true },
          product_category_id: schemaRef("Id"),
          image_url: { type: "string", nullable: true },
          type: { type: "string", enum: ["simple", "variable", "service"], default: "simple" },
          variations: {
            type: "array",
            items: schemaRef("ProductVariationInput"),
          },
        },
        required: ["name", "product_category_id", "variations"],
      },
      UpdateProductRequest: {
        type: "object",
        properties: {
          id: schemaRef("Id"),
          name: { type: "string", maximum: 200 },
          category_id: schemaRef("Id"),
          product_category_id: schemaRef("Id"),
          image_url: { type: "string", nullable: true },
          color: { type: "string", nullable: true },
          variations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: schemaRef("Id"),
                price: { type: "number", minimum: 0 },
                selling_price: { type: "number", minimum: 0 },
                delivery_cost: { type: "number", minimum: 0 },
                wholesale_price: { type: "number", minimum: 0 },
                unit_id: schemaRef("Id"),
                image_url: { type: "string", nullable: true },
              },
            },
          },
        },
      },
      BulkProductUpdateRequest: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productId: schemaRef("Id"),
                variationId: schemaRef("Id"),
                productImageUrl: { type: "string", nullable: true },
                variationImageUrl: { type: "string", nullable: true },
                productCategoryId: { type: "string", nullable: true },
                sellingPrice: { type: "number", minimum: 0 },
                price: { type: "number", minimum: 0 },
                deliveryCost: { type: "number", minimum: 0 },
                supplierId: { type: "string", nullable: true },
                unitId: { type: "string", nullable: true },
              },
              required: ["productId", "variationId"],
            },
          },
        },
        required: ["items"],
      },
      BulkDeleteRequest: {
        type: "object",
        properties: {
          ids: {
            type: "array",
            items: schemaRef("Id"),
          },
        },
        required: ["ids"],
      },
      ProductCategoryRequest: {
        type: "object",
        properties: {
          name: { type: "string", maximum: 255 },
          color: { type: "string", example: "#22c55e" },
        },
        required: ["name"],
      },
      UnitRequest: {
        type: "object",
        properties: {
          name: { type: "string", maximum: 50 },
        },
        required: ["name"],
      },
      RestockRequest: {
        type: "object",
        properties: {
          variationId: schemaRef("Id"),
          quantity: { type: "integer", minimum: 1 },
          cost_price: { type: "number", minimum: 0 },
          price: { type: "number", minimum: 0 },
          delivery_cost: { type: "number", minimum: 0 },
          selling_price: { type: "number", minimum: 0 },
        },
        required: ["variationId", "quantity"],
      },
      InventoryTransferRequest: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                variationId: schemaRef("Id"),
                quantity: { type: "integer", minimum: 1 },
              },
              required: ["variationId", "quantity"],
            },
          },
          destinationStoreId: schemaRef("Id"),
        },
        required: ["items", "destinationStoreId"],
      },
      StartAuditRequest: {
        type: "object",
        properties: {
          notes: { type: "string" },
        },
      },
      AuditScanRequest: {
        type: "object",
        properties: {
          barcode: { type: "string" },
        },
        required: ["barcode"],
      },
      AuditItemUpdateRequest: {
        type: "object",
        properties: {
          itemId: schemaRef("Id"),
          countedQuantity: { type: "number", minimum: 0 },
          notes: { type: "string" },
        },
        additionalProperties: true,
      },
      TransactionType: {
        type: "string",
        enum: [
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
        ],
      },
      PaymentInput: {
        type: "object",
        properties: {
          amount: { type: "number", minimum: 0 },
          payment_method: { type: "string", enum: ["cash", "card", "transfer", "other"] },
          currency: { type: "string" },
          received_at: { type: "string", format: "date-time" },
          payer_id: schemaRef("Id"),
        },
        required: ["amount", "payment_method", "currency", "received_at"],
      },
      CreateTransactionRequest: {
        type: "object",
        properties: {
          product_variation_id: schemaRef("Id"),
          quantity: { type: "number", minimum: 0 },
          unit_price: { type: "number", minimum: 0 },
          total_amount: { type: "number", minimum: 0 },
          transaction_type: schemaRef("TransactionType"),
          customer_id: schemaRef("Id"),
          group_id: schemaRef("Id"),
          payments: {
            type: "array",
            items: schemaRef("PaymentInput"),
          },
          redeem_points: { type: "number", minimum: 0 },
          loyalty_discount_amount: { type: "number", minimum: 0 },
          remarks: { type: "string" },
        },
        required: [
          "product_variation_id",
          "quantity",
          "unit_price",
          "total_amount",
          "transaction_type",
        ],
      },
      ReturnTransactionRequest: {
        type: "object",
        properties: {
          quantity: { type: "number", minimum: 0 },
        },
      },
      ExchangeTransactionRequest: {
        type: "object",
        properties: {
          returnQuantity: { type: "number", minimum: 0 },
          newProductVariationId: schemaRef("Id"),
          newQuantity: { type: "number", minimum: 0 },
          newUnitPrice: { type: "number", minimum: 0 },
          paymentMethod: { type: "string" },
        },
        required: ["returnQuantity", "newProductVariationId", "newQuantity"],
      },
      DebtRepaymentRequest: {
        type: "object",
        properties: {
          customerId: schemaRef("Id"),
          amount: { type: "number", minimum: 0 },
          storeId: schemaRef("Id"),
        },
        required: ["customerId", "amount", "storeId"],
      },
      StockTransferRequest: {
        type: "object",
        properties: {
          targetStoreId: schemaRef("Id"),
          productVariationId: schemaRef("Id"),
          quantity: { type: "number", minimum: 0 },
        },
        required: ["targetStoreId", "productVariationId", "quantity"],
      },
      CustomerRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string", format: "email" },
          address: { type: "string" },
        },
        additionalProperties: true,
      },
      LoyaltyCardRequest: {
        type: "object",
        properties: {
          customer_id: schemaRef("Id"),
          card_number: { type: "string" },
        },
        additionalProperties: true,
      },
      LoyaltyPointsRequest: {
        type: "object",
        properties: {
          points: { type: "number" },
          reason: { type: "string" },
        },
        additionalProperties: true,
      },
      SupplierRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string", format: "email" },
          address: { type: "string" },
        },
        additionalProperties: true,
      },
      WriteOffRequest: {
        type: "object",
        properties: {
          product_variation_id: schemaRef("Id"),
          quantity: { type: "number", minimum: 0 },
          reason: { type: "string" },
          notes: { type: "string" },
        },
        additionalProperties: true,
      },
      CurrencyRequest: {
        type: "object",
        properties: {
          code: { type: "string", maximum: 3 },
          name: { type: "string" },
          symbol: { type: "string" },
          rate: { type: "number", minimum: 0 },
          is_base: { type: "boolean" },
          is_active: { type: "boolean" },
        },
        required: ["code", "name", "symbol", "rate"],
      },
      FileUploadRequest: {
        type: "object",
        properties: {
          file: {
            type: "string",
            format: "binary",
            description: "JPEG, PNG, GIF, or WebP image up to 5 MB",
          },
        },
        required: ["file"],
      },
      FileUploadResponse: {
        type: "object",
        properties: {
          url: { type: "string" },
          path: { type: "string" },
        },
        required: ["url", "path"],
      },
      ImportFileRequest: {
        type: "object",
        properties: {
          file: {
            type: "string",
            format: "binary",
            description: "Excel or CSV file up to 10 MB",
          },
        },
        required: ["file"],
      },
      ImportRowsRequest: {
        type: "object",
        properties: {
          rows: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: true,
            },
          },
        },
        additionalProperties: true,
      },
      ImportJobResponse: {
        type: "object",
        properties: {
          jobId: { type: "string" },
          status: { type: "string" },
        },
        additionalProperties: true,
      },
      RepricingRequest: {
        type: "object",
        properties: {
          strategy: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: true,
            },
          },
        },
        additionalProperties: true,
      },
      StaffAssignmentRequest: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["admin", "user"] },
          permissions: {
            type: "array",
            items: { type: "string" },
          },
          store_id: { type: "string", nullable: true },
          approved: { type: "boolean" },
        },
        additionalProperties: true,
      },
      AssignStoreRequest: {
        type: "object",
        properties: {
          storeId: schemaRef("Id"),
          role: { type: "string", enum: ["admin", "user"] },
        },
        required: ["storeId"],
      },
      CheckoutRequest: {
        type: "object",
        properties: {
          customerEmail: { type: "string", format: "email" },
          organizationId: schemaRef("Id"),
        },
        required: ["organizationId"],
      },
      CancelSubscriptionRequest: {
        type: "object",
        properties: {
          organizationId: schemaRef("Id"),
        },
        required: ["organizationId"],
      },
      DynamicQrInitiateRequest: {
        type: "object",
        properties: {
          amount: { type: "number", minimum: 0 },
          orderId: { type: "string" },
          groupId: { type: "string" },
          cashboxCode: { type: "string" },
          otpData: { type: "string" },
        },
        required: ["amount", "orderId"],
      },
      DynamicQrCancelRequest: {
        type: "object",
        properties: {
          paymentId: { type: "string" },
        },
      },
      DynamicQrGenerateRequest: {
        type: "object",
        properties: {
          paymentId: { type: "string" },
          amount: { type: "number", minimum: 0 },
          orderId: { type: "string" },
        },
        required: ["paymentId", "amount", "orderId"],
      },
      RegisterPushTokenRequest: {
        type: "object",
        properties: {
          token: { type: "string" },
          platform: { type: "string", enum: ["ios", "android"] },
          provider: { type: "string" },
          deviceName: { type: "string", nullable: true },
          appVersion: { type: "string", nullable: true },
          buildNumber: { type: "string", nullable: true },
        },
        required: ["token", "platform", "provider"],
      },
      UnregisterPushTokenRequest: {
        type: "object",
        properties: {
          token: { type: "string" },
        },
        required: ["token"],
      },
      SendTestNotificationRequest: {
        type: "object",
        properties: {
          title: { type: "string" },
          body: { type: "string" },
          data: {
            type: "object",
            additionalProperties: { type: "string" },
          },
        },
        required: ["title", "body"],
      },
      EcommerceStatusRequest: {
        type: "object",
        properties: {
          ecommerce_enabled: { type: "boolean" },
          slug: { type: "string" },
        },
        additionalProperties: true,
      },
      EcommerceTransactionRequest: {
        type: "object",
        properties: {
          product_variation_id: schemaRef("Id"),
          quantity: { type: "integer", minimum: 1 },
          unit_price: { type: "number", minimum: 0 },
          total_amount: { type: "number", minimum: 0 },
          transaction_type: { type: "string", enum: ["export"] },
          phone_number: { type: "string" },
          remarks: { type: "string", maximum: 500 },
          group_id: { type: "string", maximum: 100 },
          currency: { type: "string" },
        },
        required: [
          "product_variation_id",
          "quantity",
          "unit_price",
          "total_amount",
          "transaction_type",
          "phone_number",
        ],
      },
      EcommerceOrderResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          orderId: { type: "string" },
          status: { type: "string" },
        },
        required: ["message", "orderId", "status"],
      },
    },
    responses: {
      ValidationError: {
        description: "Request validation failed",
        content: jsonContent(schemaRef("ValidationErrorResponse")),
      },
      Unauthorized: {
        description: "Authentication is required or the token is invalid",
        content: jsonContent(schemaRef("ErrorResponse")),
      },
      Forbidden: {
        description: "The authenticated user does not have access",
        content: jsonContent(schemaRef("ErrorResponse")),
      },
      NotFound: {
        description: "Requested resource was not found",
        content: jsonContent(schemaRef("ErrorResponse")),
      },
      InternalServerError: {
        description: "Unexpected server error",
        content: jsonContent(schemaRef("ErrorResponse")),
      },
    },
  },
};
