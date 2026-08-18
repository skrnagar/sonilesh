import { handleInboundWebhook } from "@/lib/api/handlers";

type Ctx = { params: Promise<{ connector: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const { connector } = await ctx.params;
  return handleInboundWebhook(request, connector);
}
