import { tool } from "ai";
import { z } from "zod";
import {
  getProducts,
  getProductById,
  getProductStock,
  getCategories,
  getOrder,
  notifyReturnInProcess,
  preauthorizeRefund,
  createReturn,
  getBackOfficeReturns,
  getBackOfficeSupportTickets,
  getBackOfficeStock,
  getBackOfficeSales,
} from "@/lib/api";
import {
  runSandboxCommand,
  readSandboxMemory,
  saveSandboxMemory,
} from "@/lib/sandbox";
import type {
  BackOfficeReturnStatus,
  BackOfficeReturnDecision,
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketCategory,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Shopping Agent Tools
// ---------------------------------------------------------------------------

export const searchProductsTool = tool({
  description:
    "Search the product catalog by keyword and/or category slug. Returns product details including id, name, slug, price, images, and category.",
  inputSchema: z.object({
    search: z
      .string()
      .optional()
      .describe("Keyword query for product title or description (e.g. 'mug', 'shirt', 'water')"),
    category: z
      .string()
      .optional()
      .describe("Category slug filter (e.g. 'mugs', 'bottles', 't-shirts', 'hoodies')"),
    page: z.number().optional().describe("Page number for pagination"),
    limit: z.number().optional().describe("Number of products to return (default 20)"),
  }),
  execute: async ({ search, category, page, limit }) => {
    try {
      const products = await getProducts({ search, category, page, limit });
      return {
        success: true,
        count: products.length,
        products,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search products",
        products: [],
      };
    }
  },
});

export const getAllCategoriesTool = tool({
  description:
    "Retrieve the store's current product categories. Use this to discover valid filters dynamically from store data.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const categories = await getCategories();
      return {
        success: true,
        categories,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch categories",
        categories: [],
      };
    }
  },
});

export const getProductDetailsTool = tool({
  description:
    "Retrieve complete details for a single product by its id or slug, including description, price, category, images, and live stock inventory.",
  inputSchema: z.object({
    idOrSlug: z
      .string()
      .describe("The product ID or slug (e.g. 'vercel-mug', 'prod_123')"),
  }),
  execute: async ({ idOrSlug }) => {
    try {
      const [product, stock] = await Promise.all([
        getProductById(idOrSlug),
        getProductStock(idOrSlug).catch(() => null),
      ]);
      return {
        success: true,
        product,
        stock,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : `Product not found: ${idOrSlug}`,
      };
    }
  },
});

export const returnOrderTool = tool({
  description:
    "Process a customer order return. Looks up order details, notifies the customer, pre-authorizes the refund, and submits the return filing to the store.",
  inputSchema: z.object({
    orderId: z
      .string()
      .describe("The 5-digit order identifier (e.g. '11111', '22222', '33333', '44444', '55555')"),
    reason: z
      .string()
      .describe("Customer's stated reason for the return (e.g. 'Defective item', 'Wrong size')"),
    items: z
      .array(
        z.object({
          productId: z.string().describe("Product ID to return"),
          quantity: z.number().int().positive().describe("Quantity of the item to return"),
        }),
      )
      .optional()
      .describe("Specific items to return. If omitted, returns all items in the order."),
  }),
  execute: async ({ orderId, reason, items }) => {
    try {
      // 1. Look up the order to verify and retrieve line items
      const order = await getOrder(orderId);
      if (!order) {
        return {
          success: false,
          error: `Order with ID ${orderId} was not found. Please double-check the order number.`,
        };
      }

      // 2. Prepare items list
      const returnItems =
        items && items.length > 0
          ? items
          : order.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            }));

      // 3. Notify the customer
      await notifyReturnInProcess(orderId);

      // 4. Pre-authorize refund
      const refundPreauth = await preauthorizeRefund(orderId);

      // 5. File the return
      const returnRecord = await createReturn({
        orderId,
        reason,
        items: returnItems,
      });

      return {
        success: true,
        message: `Return request successfully filed for order #${orderId}.`,
        orderId,
        returnRecord,
        refundPreauthorization: refundPreauth,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process return",
        orderId,
      };
    }
  },
});

export const shoppingTools = {
  searchProducts: searchProductsTool,
  getAllCategories: getAllCategoriesTool,
  getProductDetails: getProductDetailsTool,
  returnOrder: returnOrderTool,
};

// ---------------------------------------------------------------------------
// Store Admin Back-Office Tools
// ---------------------------------------------------------------------------

export const getSupportTicketsTool = tool({
  description:
    "Retrieve customer support tickets with optional filters by date range, status, priority, category, assignee, and limit.",
  inputSchema: z.object({
    from: z.string().optional().describe("Start date (YYYY-MM-DD or ISO 8601). Defaults to 30 days before 'to'"),
    to: z.string().optional().describe("End date (YYYY-MM-DD or ISO 8601). Defaults to now"),
    status: z
      .enum(["open", "pending", "resolved", "closed"])
      .optional()
      .describe("Ticket status filter"),
    priority: z
      .enum(["low", "medium", "high", "urgent"])
      .optional()
      .describe("Ticket priority filter"),
    category: z
      .enum(["order", "product", "shipping", "return", "billing", "general", "returns"])
      .optional()
      .describe("Ticket category filter"),
    assignee: z.string().optional().describe("Staff username (e.g. 'alex')"),
    limit: z.number().min(1).max(500).optional().describe("Max tickets to return (1-500, default 25)"),
  }),
  execute: async (params) => {
    try {
      const result = await getBackOfficeSupportTickets({
        ...params,
        category: params.category as SupportTicketCategory | undefined,
        status: params.status as SupportTicketStatus | undefined,
        priority: params.priority as SupportTicketPriority | undefined,
      });
      return {
        success: true,
        tickets: result.data,
        meta: result.meta,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch support tickets",
        tickets: [],
      };
    }
  },
});

export const getReturnsHistoryTool = tool({
  description:
    "Retrieve historical customer returns with optional filters by date range, status, decision, and limit. Includes associated order and refund details.",
  inputSchema: z.object({
    from: z.string().optional().describe("Start date (YYYY-MM-DD or ISO 8601)"),
    to: z.string().optional().describe("End date (YYYY-MM-DD or ISO 8601)"),
    status: z
      .enum(["pending", "approved", "rejected", "completed"])
      .optional()
      .describe("Return status filter"),
    decision: z
      .enum(["accepted", "declined", "refund_issued", "exchange_created", "escalated"])
      .optional()
      .describe("Return decision filter"),
    limit: z.number().min(1).max(500).optional().describe("Max returns to return (1-500, default 25)"),
  }),
  execute: async (params) => {
    try {
      const result = await getBackOfficeReturns({
        ...params,
        status: params.status as BackOfficeReturnStatus | undefined,
        decision: params.decision as BackOfficeReturnDecision | undefined,
      });
      return {
        success: true,
        returns: result.data,
        meta: result.meta,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch returns history",
        returns: [],
      };
    }
  },
});

export const getInventoryStockTool = tool({
  description:
    "Retrieve live back-office inventory stock levels with filters for specific products, low-stock items (1-5 units), in-stock items, and pagination.",
  inputSchema: z.object({
    productIds: z.array(z.string()).optional().describe("Array of specific product IDs to filter by"),
    lowStock: z.boolean().optional().describe("When true, filters to low-stock items (1-5 units in stock)"),
    inStock: z.boolean().optional().describe("When true, filters to items with at least 1 unit in stock"),
    page: z.number().optional().describe("Page number for pagination"),
    limit: z.number().min(1).max(200).optional().describe("Items per page (1-200, default 50)"),
  }),
  execute: async (params) => {
    try {
      const result = await getBackOfficeStock(params);
      return {
        success: true,
        stockEntries: result.data,
        meta: result.meta,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch inventory stock",
        stockEntries: [],
      };
    }
  },
});

export const getSalesAnalyticsTool = tool({
  description:
    "Retrieve sales and revenue analytics within a date range, with optional single-product filtering. Reports units sold, orders count, revenue, and return metrics.",
  inputSchema: z.object({
    from: z.string().optional().describe("Start date (YYYY-MM-DD or ISO 8601). Defaults to 30 days before 'to'"),
    to: z.string().optional().describe("End date (YYYY-MM-DD or ISO 8601). Defaults to now"),
    productId: z.string().optional().describe("Filter sales analytics for a specific product ID"),
  }),
  execute: async (params) => {
    try {
      const result = await getBackOfficeSales(params);
      return {
        success: true,
        sales: result.data,
        meta: result.meta,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch sales analytics",
        sales: [],
      };
    }
  },
});

export const bashTool = tool({
  description:
    "Execute commands or data analysis scripts in the isolated Vercel Sandbox. Use this for performing joins, aggregations, computing return rates, finding low-stock top sellers, or calculating revenue numbers accurately.",
  inputSchema: z.object({
    command: z
      .string()
      .describe("Bash/shell command, or node script (e.g. `node -e '...'` or python script) to compute results"),
  }),
  execute: async ({ command }) => {
    const start = Date.now();
    try {
      const result = await runSandboxCommand(command);
      return {
        success: true,
        command,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        command,
        stdout: "",
        stderr: error instanceof Error ? error.message : "Sandbox execution failed",
        exitCode: 1,
        durationMs: Date.now() - start,
      };
    }
  },
});

export const saveMemoryTool = tool({
  description:
    "Save important business context, employee preferences, operational notes, or user corrections into persistent sandbox memory for future conversations.",
  inputSchema: z.object({
    content: z
      .string()
      .describe("Complete updated persistent memory notes to store across sessions"),
  }),
  execute: async ({ content }) => {
    try {
      await saveSandboxMemory(content);
      return {
        success: true,
        message: "Memory successfully updated and saved in sandbox storage.",
        savedContent: content,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save memory",
      };
    }
  },
});

export const getMemoryTool = tool({
  description:
    "Read the current persistent memory context saved in the admin sandbox storage.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const memory = await readSandboxMemory();
      return {
        success: true,
        memory: memory || "No memory saved yet.",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to read memory",
        memory: "",
      };
    }
  },
});

export const adminTools = {
  getSupportTickets: getSupportTicketsTool,
  getReturnsHistory: getReturnsHistoryTool,
  getInventoryStock: getInventoryStockTool,
  getSalesAnalytics: getSalesAnalyticsTool,
  searchProducts: searchProductsTool,
  getAllCategories: getAllCategoriesTool,
  getProductDetails: getProductDetailsTool,
  bash: bashTool,
  saveMemory: saveMemoryTool,
  getMemory: getMemoryTool,
};
