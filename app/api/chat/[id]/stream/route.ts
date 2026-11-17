import { type NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return new Response(
    JSON.stringify({
      status: "active",
      id,
      message: "Stream connection active",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return new Response(
    JSON.stringify({
      status: "active",
      id,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
