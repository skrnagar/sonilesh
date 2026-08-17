import { NextRequest, NextResponse } from "next/server";
import { requireModuleAccess } from "@/lib/auth/org-context";
import {
  exportContractorRegisterCsv,
  exportDocumentExpiryCsv,
} from "@/lib/services/contractors";

export async function GET(request: NextRequest) {
  const access = await requireModuleAccess({
    featureCode: "contractor_management",
    permission: "contractor.view",
  });
  if (!access.entitled || !access.permitted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const kind = request.nextUrl.searchParams.get("kind") === "expiry" ? "expiry" : "register";
  const csv =
    kind === "expiry"
      ? await exportDocumentExpiryCsv(access.supabase, access.organization.id)
      : await exportContractorRegisterCsv(access.supabase, access.organization.id);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contractors-${kind}.csv"`,
    },
  });
}
