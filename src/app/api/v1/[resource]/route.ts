import { handleResourceList } from "@/lib/api/handlers";

type Ctx = { params: Promise<{ resource: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const { resource } = await ctx.params;
  return handleResourceList(request, resource);
}
