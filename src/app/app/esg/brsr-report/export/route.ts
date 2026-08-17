import { NextResponse } from "next/server";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { formatBrsrDocument } from "@/lib/services/esg";

export async function GET(request: Request) {
  const access = await requireModuleAccess({
    featureCode: "esg_reporting",
    permission: "esg.view",
  });
  if (!access.entitled || !access.permitted) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const fy = new URL(request.url).searchParams.get("fy");
  if (!fy) return NextResponse.json({ error: "fy required" }, { status: 400 });

  const { data, error } = await access.supabase
    .from("brsr_reports")
    .select("financial_year, section_a, section_b, section_c")
    .eq("organization_id", access.organization.id)
    .eq("financial_year", fy)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const body = formatBrsrDocument({
    organizationName: access.organization.name,
    financialYear: data.financial_year,
    sectionA: (data.section_a ?? {}) as Record<string, unknown>,
    sectionB: (data.section_b ?? {}) as Record<string, unknown>,
    sectionC: (data.section_c ?? {}) as Record<string, unknown>,
  });

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="BRSR-${fy}-sections-ABC.txt"`,
    },
  });
}
