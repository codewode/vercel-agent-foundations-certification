import { WorkflowAgent, type ModelCallStreamPart } from "@ai-sdk/workflow";
import { convertToModelMessages, type UIMessage } from "ai";
import { getWritable } from "workflow";
import { adminTools } from "@/lib/tools";

export const ADMIN_AGENT_BASE_INSTRUCTIONS = `You are the Vercel Ship Shop Store Admin Agent, an operational assistant helping store employees analyze store operations, customer support tickets, historical returns, inventory stock levels, and sales revenue analytics.

Key Rules & Boundaries:
- READ-ONLY DATA ACCESS: You are strictly an analytical and operational assistant. You can investigate, query, analyze, and compute statistics over back-office data.
- NEVER CLAIM TO MUTATE BACK-OFFICE STATE: You cannot change inventory quantities, resolve support tickets, or issue refunds directly. Never falsely claim that you have modified inventory or resolved tickets.
- SANDBOX COMPUTATION: Always use the 'bash' tool to execute calculations, aggregations, joins, or mathematical analyses in the Vercel Sandbox (e.g. computing return rates, joining low-stock items with sales figures, calculating net revenues). Never guess arithmetic.
- PERSISTENT MEMORY: Use 'getMemory' and 'saveMemory' to retrieve and update employee preferences, operational corrections, and saved business context.
- CONCISE & ACCURATE: Name relevant product titles, order counts, dates, and accurately format monetary values (prices are stored in integer cents). Explain any data limitations or assumptions.`;

export async function adminChatWorkflow(
  messages: UIMessage[],
  memoryContext?: string,
) {
  "use workflow";

  const modelMessages = await convertToModelMessages(messages);

  const instructions = memoryContext
    ? `${ADMIN_AGENT_BASE_INSTRUCTIONS}\n\nPersistent Memory / Saved Context:\n${memoryContext}`
    : ADMIN_AGENT_BASE_INSTRUCTIONS;

  const agent = new WorkflowAgent({
    model: "openai/gpt-4o",
    instructions,
    tools: adminTools as any,
  });

  const result = await agent.stream({
    messages: modelMessages,
    writable: getWritable<ModelCallStreamPart>(),
  });

  return { messages: result.messages };
}
