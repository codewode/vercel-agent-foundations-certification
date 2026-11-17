import { WorkflowAgent, type ModelCallStreamPart } from "@ai-sdk/workflow";
import { convertToModelMessages, type UIMessage } from "ai";
import { getWritable } from "workflow";
import { shoppingTools } from "@/lib/tools";

export const SHOPPING_AGENT_INSTRUCTIONS = `You are the Vercel Ship Shop shopping assistant, helping customers discover products, check item details and stock, and process order returns.

Guidelines:
- Help shoppers find products by searching the catalog and browsing categories.
- Always use the provided tools (searchProducts, getAllCategories, getProductDetails, returnOrder) to answer questions about products, availability, and returns accurately. Never guess or hallucinate product or order data.
- When customers ask about products, use searchProducts or getProductDetails so rich product information and generative UI cards are returned.
- When customers want to return an item, ask for their order ID and return reason if not already provided, and use the returnOrder tool to file the return.
- If a customer asks questions unrelated to the store, products, or returns, politely redirect them back to shopping at the Vercel Ship Shop.
- Keep answers helpful, concise, and friendly.`;

export async function shoppingChatWorkflow(messages: UIMessage[]) {
  "use workflow";

  const modelMessages = await convertToModelMessages(messages);

  const agent = new WorkflowAgent({
    model: "openai/gpt-4o",
    instructions: SHOPPING_AGENT_INSTRUCTIONS,
    tools: shoppingTools as any,
  });

  const result = await agent.stream({
    messages: modelMessages,
    writable: getWritable<ModelCallStreamPart>(),
  });

  return { messages: result.messages };
}
