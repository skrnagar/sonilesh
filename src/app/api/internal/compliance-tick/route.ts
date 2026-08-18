import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateApplicability, processComplianceReminders } from "@/lib/services/compliance";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: profiles, error } = await supabase
    .from("org_compliance_profile")
    .select("organization_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let evaluated = 0;
  for (const row of profiles ?? []) {
    await evaluateApplicability(supabase, row.organization_id);
    evaluated += 1;
  }
  const reminders = await processComplianceReminders(supabase);
  return NextResponse.json({ evaluated, reminders });
}
