import { handleResourceGet } from "@/lib/api/handlers";

type Ctx = { params: Promise<{ resource: string; id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const { resource, id } = await ctx.params;
  return handleResourceGet(request, resource, id);
}
