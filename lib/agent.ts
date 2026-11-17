import { ToolLoopAgent } from "ai";
import { shoppingTools, adminTools } from "@/lib/tools";
import { SHOPPING_AGENT_INSTRUCTIONS } from "@/lib/workflows/chat-flow";
import { ADMIN_AGENT_BASE_INSTRUCTIONS } from "@/lib/workflows/admin-chat-flow";

export { SHOPPING_AGENT_INSTRUCTIONS, ADMIN_AGENT_BASE_INSTRUCTIONS };

export const shoppingAgent = new ToolLoopAgent({
  model: "openai/gpt-4o",
  instructions: SHOPPING_AGENT_INSTRUCTIONS,
  tools: shoppingTools,
});

export const adminAgent = new ToolLoopAgent({
  model: "openai/gpt-4o",
  instructions: ADMIN_AGENT_BASE_INSTRUCTIONS,
  tools: adminTools,
});

export function createAdminAgentWithMemory(memoryContext?: string) {
  const instructions = memoryContext
    ? `${ADMIN_AGENT_BASE_INSTRUCTIONS}\n\nPersistent Memory / Saved Context:\n${memoryContext}`
    : ADMIN_AGENT_BASE_INSTRUCTIONS;

  return new ToolLoopAgent({
    model: "openai/gpt-4o",
    instructions,
    tools: adminTools,
  });
}
