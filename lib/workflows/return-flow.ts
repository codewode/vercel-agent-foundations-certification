import {
  getOrder,
  notifyReturnInProcess,
  preauthorizeRefund,
  createReturn,
} from "@/lib/api";
import type { Order, Return, RefundPreauthorization } from "@/lib/types";

export interface ReturnWorkflowInput {
  orderId: string;
  reason: string;
  items?: { productId: string; quantity: number }[];
}

export interface ReturnWorkflowOutput {
  success: boolean;
  orderId: string;
  order: Order;
  refundPreauthorization: RefundPreauthorization;
  returnRecord: Return;
  message: string;
}

export async function lookupOrderStep(orderId: string): Promise<Order> {
  "use step";
  const order = await getOrder(orderId);
  if (!order) {
    throw new Error(`Order #${orderId} was not found.`);
  }
  return order;
}

export async function notifyCustomerStep(orderId: string): Promise<void> {
  "use step";
  await notifyReturnInProcess(orderId);
}

export async function preauthorizeRefundStep(
  orderId: string,
): Promise<RefundPreauthorization> {
  "use step";
  return preauthorizeRefund(orderId);
}

export async function submitReturnStep(input: {
  orderId: string;
  reason: string;
  items: { productId: string; quantity: number }[];
}): Promise<Return> {
  "use step";
  return createReturn(input);
}

/**
 * Durable return workflow.
 * Executes steps sequentially:
 * 1. Look up order
 * 2. Notify customer (idempotent / only once)
 * 3. Pre-authorize refund
 * 4. Submit return filing
 */
export async function processReturnWorkflow(
  input: ReturnWorkflowInput,
): Promise<ReturnWorkflowOutput> {
  "use workflow";

  const order = await lookupOrderStep(input.orderId);

  const returnItems =
    input.items && input.items.length > 0
      ? input.items
      : order.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        }));

  await notifyCustomerStep(input.orderId);
  const refundPreauth = await preauthorizeRefundStep(input.orderId);
  const returnRecord = await submitReturnStep({
    orderId: input.orderId,
    reason: input.reason,
    items: returnItems,
  });

  return {
    success: true,
    orderId: input.orderId,
    order,
    refundPreauthorization: refundPreauth,
    returnRecord,
    message: `Return filed successfully for order #${input.orderId}`,
  };
}
