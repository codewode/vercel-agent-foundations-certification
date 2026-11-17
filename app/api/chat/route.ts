import { createAgentUIStreamResponse, type UIMessage } from "ai";
import { shoppingAgent } from "@/lib/agent";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    return createAgentUIStreamResponse({
      agent: shoppingAgent,
      uiMessages: messages,
    });
  } catch (error) {
    console.error("[api/chat] Error generating chat response:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal Server Error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
