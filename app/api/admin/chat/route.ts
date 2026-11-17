import { createAgentUIStreamResponse, type UIMessage } from "ai";
import { createAdminAgentWithMemory } from "@/lib/agent";
import { readSandboxMemory } from "@/lib/sandbox";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Read persistent context from sandbox memory
    const memory = await readSandboxMemory();

    const adminAgentWithMemory = createAdminAgentWithMemory(memory);

    return createAgentUIStreamResponse({
      agent: adminAgentWithMemory,
      uiMessages: messages,
    });
  } catch (error) {
    console.error("[api/admin/chat] Error generating admin chat response:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal Server Error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
