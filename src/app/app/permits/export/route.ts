import { NextResponse } from "next/server";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listPermits } from "@/lib/services/permits";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export async function GET() {
  const access = await requireModuleAccess({
    featureCode: "permit_to_work",
    permission: "permits.export",
  });
  if (!access.entitled || !access.permitted) {
    const view = await requireModuleAccess({
      featureCode: "permit_to_work",
      permission: "permits.view",
    });
    if (!view.entitled || !view.permitted) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
  }

  const rows = await listPermits(access.supabase, access.organization.id, { limit: 2000 });
  const header = [
    "permit_number",
    "title",
    "type",
    "status",
    "site",
    "project",
    "location",
    "risk",
    "valid_from",
    "valid_to",
  ];
  const lines = [
    header.join(","),
    ...rows.map((p) =>
      [
        p.permit_number,
        p.title,
        (p.permit_types as { name?: string } | null)?.name,
        p.status,
        (p.sites as { name?: string } | null)?.name,
        (p.projects as { name?: string } | null)?.name,
        (p.locations as { name?: string } | null)?.name,
        p.residual_risk_band,
        p.valid_from,
        p.valid_to,
      ]
        .map(csvCell)
        .join(","),
    ),
  ];

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="permit-register-${stamp}.csv"`,
    },
  });
}
