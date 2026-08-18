import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { requireFeature } from "@/lib/services/entitlements";
import { requirePermission } from "@/lib/services/rbac";
import { notifyUsers } from "@/lib/services/notifications";
import {
  evaluateObligationRules,
  generateTaskWindows,
  type ApplicabilityRules,
  type Frequency,
  type OrgComplianceProfileInput,
} from "@/lib/compliance/applicability";
import { nextExpiryReminder } from "@/lib/compliance/calendar";

export type ComplianceProfileRow = OrgComplianceProfileInput & {
  organization_id: string;
};

async function loadProfile(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from("org_compliance_profile")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as ComplianceProfileRow | null;
}

export async function evaluateApplicability(
  supabase: SupabaseClient,
  organizationId: string,
  actorUserId?: string,
) {
  if (actorUserId) {
    await requirePermission(supabase, organizationId, actorUserId, "compliance.manage");
  }
  const profile = await loadProfile(supabase, organizationId);
  if (!profile) {
    return { applied: 0, skipped: 0 };
  }

  const { data: obligations, error } = await supabase
    .from("compliance_obligations")
    .select("id, code, applicability_rules, frequency")
    .eq("is_active", true);
  if (error) throw new Error(error.message);

  const { data: existing, error: existingError } = await supabase
    .from("org_applicable_compliances")
      .select("id, obligation_id, applicability_status, status")
    .eq("organization_id", organizationId);
  if (existingError) throw new Error(existingError.message);

  const byObligation = new Map((existing ?? []).map((row) => [row.obligation_id, row]));
  let applied = 0;
  let skipped = 0;

  for (const obligation of obligations ?? []) {
    const result = evaluateObligationRules(
      (obligation.applicability_rules ?? {}) as ApplicabilityRules,
      profile,
    );
    const current = byObligation.get(obligation.id);

    if (current?.applicability_status === "manually_excluded") {
      skipped += 1;
      continue;
    }
    if (current?.applicability_status === "manually_added") {
      skipped += 1;
      continue;
    }

    if (!result.applies) {
      if (current?.applicability_status === "auto_applied") {
        await supabase
          .from("org_applicable_compliances")
          .update({
            status: "not_applicable",
            matched_rules: [],
            updated_at: new Date().toISOString(),
          })
          .eq("id", current.id);
      }
      continue;
    }

    if (!current) {
      const { data: inserted, error: insertError } = await supabase
        .from("org_applicable_compliances")
        .insert({
          organization_id: organizationId,
          obligation_id: obligation.id,
          applicability_status: "auto_applied",
          matched_rules: result.matches,
          status: "not_started",
        })
        .select("id")
        .single();
      if (insertError) throw new Error(insertError.message);
      applied += 1;
      await generateTasksForApplicable(supabase, organizationId, inserted.id, obligation.frequency);
    } else {
      const patch: Record<string, unknown> = {
        matched_rules: result.matches,
        updated_at: new Date().toISOString(),
      };
      if (current.status === "not_applicable") patch.status = "not_started";
      await supabase.from("org_applicable_compliances").update(patch).eq("id", current.id);
      await generateTasksForApplicable(supabase, organizationId, current.id, obligation.frequency);
    }
  }

  await supabase.from("applicability_snapshots").insert({
    organization_id: organizationId,
    profile_snapshot: profile,
    results: (obligations ?? []).map((obligation) => ({
      obligation_id: obligation.id,
      code: obligation.code,
      applies: evaluateObligationRules(
        (obligation.applicability_rules ?? {}) as ApplicabilityRules,
        profile,
      ).applies,
    })),
    created_by: actorUserId ?? null,
  });

  await writeAuditLog(supabase, {
    organizationId,
    actorUserId: actorUserId ?? null,
    action: "compliance.applicability_evaluated",
    entityType: "org_compliance_profile",
    entityId: organizationId,
    newValues: { applied, skipped },
  });

  return { applied, skipped };
}

export async function generateTasksForApplicable(
  supabase: SupabaseClient,
  organizationId: string,
  applicableId: string,
  frequency: string,
) {
  if (frequency === "event_based") return;
  const windows = generateTaskWindows(frequency as Frequency);
  for (const window of windows) {
    const { error } = await supabase.from("compliance_task_instances").upsert(
      {
        organization_id: organizationId,
        org_applicable_compliance_id: applicableId,
        period_label: window.period_label,
        due_date: window.due_date,
        status: "open",
      },
      { onConflict: "org_applicable_compliance_id,period_label", ignoreDuplicates: true },
    );
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      throw new Error(error.message);
    }
  }
}

export async function upsertComplianceProfile(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
  input: OrgComplianceProfileInput,
) {
  await requireFeature(supabase, organizationId, "regulatory_compliance");
  await requirePermission(supabase, organizationId, userId, "compliance.manage");

  const payload = {
    organization_id: organizationId,
    industry_sector: input.industry_sector ?? null,
    sub_sectors: input.sub_sectors ?? [],
    is_listed: input.is_listed,
    market_cap_rank: input.is_listed ? input.market_cap_rank ?? null : null,
    turnover_band: input.turnover_band ?? null,
    net_worth_band: input.net_worth_band ?? null,
    net_profit_band: input.net_profit_band ?? null,
    employee_count_band: input.employee_count_band ?? null,
    states_of_operation: input.states_of_operation ?? [],
    exports_to_eu: input.exports_to_eu,
    waste_streams_generated: input.waste_streams_generated ?? [],
    ccts_sector: input.ccts_sector,
    country_code: input.country_code ?? null,
    jurisdiction_codes: input.jurisdiction_codes ?? [],
    site_types: input.site_types ?? [],
    auto_noncompliant_on_expired_evidence: input.auto_noncompliant_on_expired_evidence === true,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  };

  const { error } = await supabase.from("org_compliance_profile").upsert(payload, {
    onConflict: "organization_id",
  });
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId,
    actorUserId: userId,
    action: "compliance.profile_updated",
    entityType: "org_compliance_profile",
    entityId: organizationId,
    newValues: payload,
  });

  return evaluateApplicability(supabase, organizationId, userId);
}

export async function overrideApplicability(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    applicableId?: string;
    obligationId?: string;
    status: "manually_added" | "manually_excluded";
    justification: string;
  },
) {
  await requireFeature(supabase, input.organizationId, "regulatory_compliance");
  await requirePermission(supabase, input.organizationId, input.userId, "compliance.manage");

  const note = input.justification.trim();
  if (note.length < 8) {
    throw new Error("A justification note is required (at least 8 characters).");
  }

  if (input.status === "manually_added") {
    if (!input.obligationId) throw new Error("obligationId is required");
    const { data, error } = await supabase
      .from("org_applicable_compliances")
      .upsert(
        {
          organization_id: input.organizationId,
          obligation_id: input.obligationId,
          applicability_status: "manually_added",
          justification_note: note,
          status: "not_started",
          matched_rules: [{ key: "manual", reason: "Manually added by an organization admin." }],
        },
        { onConflict: "organization_id,obligation_id" },
      )
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await writeAuditLog(supabase, {
      organizationId: input.organizationId,
      actorUserId: input.userId,
      action: "compliance.manually_added",
      entityType: "org_applicable_compliance",
      entityId: data.id,
      reason: note,
      newValues: { obligationId: input.obligationId },
    });
    return data;
  }

  if (!input.applicableId) throw new Error("applicableId is required");
  const { data: previous } = await supabase
    .from("org_applicable_compliances")
    .select("*")
    .eq("id", input.applicableId)
    .eq("organization_id", input.organizationId)
    .single();

  const { error } = await supabase
    .from("org_applicable_compliances")
    .update({
      applicability_status: "manually_excluded",
      justification_note: note,
      status: "not_applicable",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.applicableId)
    .eq("organization_id", input.organizationId);
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "compliance.manually_excluded",
    entityType: "org_applicable_compliance",
    entityId: input.applicableId,
    reason: note,
    previousValues: previous,
    newValues: { applicability_status: "manually_excluded" },
  });

  return { id: input.applicableId };
}

export async function markTaskFiled(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string; taskId: string; notes?: string },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "compliance.manage");
  const { error } = await supabase
    .from("compliance_task_instances")
    .update({
      status: "filed",
      filed_date: new Date().toISOString().slice(0, 10),
      filed_by: input.userId,
      notes: input.notes ?? null,
    })
    .eq("id", input.taskId)
    .eq("organization_id", input.organizationId);
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "compliance.task_filed",
    entityType: "compliance_task_instance",
    entityId: input.taskId,
  });
}

export async function verifyTaskFiling(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string; taskId: string },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "compliance.verify");
  const { data: task, error } = await supabase
    .from("compliance_task_instances")
    .select("id, filed_by, status")
    .eq("id", input.taskId)
    .eq("organization_id", input.organizationId)
    .single();
  if (error) throw new Error(error.message);
  if (task.status !== "filed") throw new Error("Only filed tasks can be verified.");
  if (task.filed_by === input.userId) {
    throw new Error("The person who marked this filed cannot verify it.");
  }

  const { error: updateError } = await supabase
    .from("compliance_task_instances")
    .update({
      status: "verified",
      verified_by: input.userId,
      verified_at: new Date().toISOString(),
    })
    .eq("id", input.taskId);
  if (updateError) throw new Error(updateError.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "compliance.task_verified",
    entityType: "compliance_task_instance",
    entityId: input.taskId,
  });
}

export async function addTaskEvidence(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    taskId: string;
    storagePath: string;
    fileName: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "compliance.manage");
  const { error } = await supabase.from("compliance_evidence").insert({
    organization_id: input.organizationId,
    task_instance_id: input.taskId,
    storage_path: input.storagePath,
    file_name: input.fileName,
    uploaded_by: input.userId,
  });
  if (error) throw new Error(error.message);
}

type TaskNotifyRow = {
  id: string;
  organization_id: string;
  due_date: string;
  status: string;
  reminder_stage: string;
  org_applicable_compliances: {
    owner_id: string | null;
    compliance_obligations: { title: string } | null;
  } | null;
};

export async function processComplianceReminders(supabase: SupabaseClient) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: openTasks, error } = await supabase
    .from("compliance_task_instances")
    .select(
      "id, organization_id, due_date, status, reminder_stage, org_applicable_compliances(owner_id, compliance_obligations(title))",
    )
    .in("status", ["open", "in_progress", "filed"]);
  if (error) throw new Error(error.message);

  let notified = 0;
  for (const raw of openTasks ?? []) {
    const task = raw as unknown as TaskNotifyRow;
    const due = task.due_date;
    const days = Math.floor((new Date(due).getTime() - new Date(today).getTime()) / 86400000);
    let stage = task.reminder_stage;
    let title = "";
    if (days < -2 && stage !== "escalate") {
      stage = "escalate";
      title = "Compliance filing still overdue (escalation)";
    } else if (days < 0 && stage !== "overdue" && stage !== "escalate") {
      stage = "overdue";
      title = "Compliance filing overdue";
      await supabase
        .from("compliance_task_instances")
        .update({ status: "overdue" })
        .eq("id", task.id)
        .eq("status", "open");
    } else if (days === 1 && stage === "none") {
      stage = "d1";
      title = "Compliance filing due tomorrow";
    } else if (days <= 7 && days > 1 && stage === "none") {
      stage = "d7";
      title = "Compliance filing due in 7 days";
    }
    if (!title || stage === task.reminder_stage) continue;

    const ownerId = task.org_applicable_compliances?.owner_id;
    const recipients = ownerId ? [ownerId] : [];
    const { data: admins } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", task.organization_id)
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(20);
    for (const admin of admins ?? []) {
      if (admin.user_id) recipients.push(admin.user_id);
    }

    await notifyUsers(supabase, {
      organizationId: task.organization_id,
      userIds: recipients,
      title,
      body: task.org_applicable_compliances?.compliance_obligations?.title ?? "Compliance task",
      link: `/app/compliance/tasks/${task.id}`,
      eventKey: stage === "overdue" || stage === "escalate" ? "compliance.overdue" : "compliance.review_due",
    });
    await supabase
      .from("compliance_task_instances")
      .update({ reminder_stage: stage })
      .eq("id", task.id);
    notified += 1;
  }

  const { data: licenses } = await supabase
    .from("regulatory_permits")
    .select("id, organization_id, name, expires_on, reminder_stage, created_by")
    .not("expires_on", "is", null)
    .in("status", ["active", "under_renewal"]);
  for (const license of licenses ?? []) {
    if (!license.expires_on) continue;
    const days = Math.floor(
      (new Date(license.expires_on).getTime() - new Date(today).getTime()) / 86400000,
    );
    const next = nextExpiryReminder(days, license.reminder_stage);
    if (!next) continue;
    const recipients = license.created_by ? [license.created_by] : [];
    await notifyUsers(supabase, {
      organizationId: license.organization_id,
      userIds: recipients,
      title: `License ${next.title.toLowerCase()}: ${license.name}`,
      body: "Regulatory license / consent — not EHS PTW.",
      link: "/app/compliance/licenses",
      eventKey: "compliance.license_expiring",
    });
    await supabase
      .from("regulatory_permits")
      .update({ reminder_stage: next.stage })
      .eq("id", license.id)
      .eq("organization_id", license.organization_id);
    notified += 1;
  }

  const { data: evidenceRows } = await supabase
    .from("compliance_evidence")
    .select("id, organization_id, file_name, expires_at, reminder_stage, uploaded_by")
    .not("expires_at", "is", null);
  for (const row of evidenceRows ?? []) {
    if (!row.expires_at) continue;
    const days = Math.floor(
      (new Date(row.expires_at).getTime() - new Date(today).getTime()) / 86400000,
    );
    const next = nextExpiryReminder(days, row.reminder_stage);
    if (!next) continue;
    const recipients = row.uploaded_by ? [row.uploaded_by] : [];
    await notifyUsers(supabase, {
      organizationId: row.organization_id,
      userIds: recipients,
      title: `Evidence ${next.title.toLowerCase()}: ${row.file_name}`,
      link: "/app/compliance/expiry",
      eventKey: "compliance.evidence_expiring",
    });
    await supabase
      .from("compliance_evidence")
      .update({ reminder_stage: next.stage })
      .eq("id", row.id)
      .eq("organization_id", row.organization_id);
    notified += 1;
  }

  const { data: periods } = await supabase
    .from("esg_reporting_periods")
    .select("id, organization_id, period_label, period_end, reminder_stage")
    .in("status", ["open", "data_collection", "review"])
    .not("period_end", "is", null);
  for (const period of periods ?? []) {
    if (!period.period_end) continue;
    const days = Math.floor(
      (new Date(period.period_end).getTime() - new Date(today).getTime()) / 86400000,
    );
    const next = nextExpiryReminder(days, period.reminder_stage);
    if (!next) continue;
    const { data: members } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", period.organization_id)
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(20);
    await notifyUsers(supabase, {
      organizationId: period.organization_id,
      userIds: (members ?? []).map((m) => m.user_id).filter(Boolean) as string[],
      title: `ESG period closing: ${period.period_label}`,
      body: next.title,
      link: "/app/esg/periods",
      eventKey: "esg.period_closing",
    });
    await supabase
      .from("esg_reporting_periods")
      .update({ reminder_stage: next.stage })
      .eq("id", period.id)
      .eq("organization_id", period.organization_id);
    notified += 1;
  }

  return { notified };
}

export async function listApplicableWithWhy(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from("org_applicable_compliances")
    .select(
      `
      id, applicability_status, status, justification_note, matched_rules, owner_id,
      compliance_obligations:obligation_id (
        id, code, title, description, issuing_authority, frequency,
        penalty_description, penalty_amount_note, source_reference,
        compliance_domains:domain_id ( code, name )
      )
    `,
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listAssessments(supabase: SupabaseClient, organizationId: string, siteId?: string | null) {
  let q = supabase
    .from("compliance_assessments")
    .select(
      `id, period_label, status, score_percent, findings_count, site_id, created_at, rules_snapshot, checklist_assignment_id,
       compliance_requirements:requirement_id(title),
       sites:site_id(name)`,
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (siteId) q = q.eq("site_id", siteId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createComplianceAssessment(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    requirementId: string;
    periodLabel: string;
    templateId?: string | null;
  },
) {
  await requireFeature(supabase, input.organizationId, "regulatory_compliance");
  await requirePermission(supabase, input.organizationId, input.userId, "compliance.assess");

  const { data: requirement } = await supabase
    .from("compliance_requirements")
    .select(
      `id, title, site_id, owner_id, checklist_template_id, legal_register_entry_id,
       legal_register_entries:legal_register_entry_id(applicability_rules_snapshot, site_id)`,
    )
    .eq("id", input.requirementId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!requirement) throw new Error("Requirement not found in this organization.");

  const profile = await loadProfile(supabase, input.organizationId);
  const entry = requirement.legal_register_entries as {
    applicability_rules_snapshot?: unknown;
    site_id?: string | null;
  } | null;
  const templateId = input.templateId || requirement.checklist_template_id;

  let assignmentId: string | null = null;
  if (templateId) {
    const { createAssignment } = await import("@/lib/services/checklists");
    const assignment = await createAssignment(supabase, {
      organizationId: input.organizationId,
      userId: input.userId,
      templateId,
      title: requirement.title,
      checklistType: "compliance",
      siteId: requirement.site_id ?? undefined,
      assigneeId: requirement.owner_id ?? input.userId,
    });
    assignmentId = assignment.id;
  }

  const { data, error } = await supabase
    .from("compliance_assessments")
    .insert({
      organization_id: input.organizationId,
      requirement_id: requirement.id,
      legal_register_entry_id: requirement.legal_register_entry_id,
      site_id: requirement.site_id,
      checklist_assignment_id: assignmentId,
      period_label: input.periodLabel,
      status: assignmentId ? "in_progress" : "draft",
      rules_snapshot: entry?.applicability_rules_snapshot ?? {},
      profile_snapshot: profile ?? {},
      created_by: input.userId,
    })
    .select("id, checklist_assignment_id")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "compliance.assessment_created",
    entityType: "compliance_assessment",
    entityId: data.id,
  });

  const recipients = [requirement.owner_id, input.userId].filter(Boolean) as string[];
  await notifyUsers(supabase, {
    organizationId: input.organizationId,
    userIds: recipients,
    title: "Compliance assessment opened",
    body: `${requirement.title} · ${input.periodLabel}`,
    link: assignmentId ? `/app/inspections/${assignmentId}` : `/app/compliance/assessments`,
    eventKey: "compliance.assessment_opened",
  });

  return data;
}

/** Completing an assessment copies live checklist totals into the frozen snapshot. Live rule changes do not rewrite this row. */
export async function snapshotAssessmentFromChecklist(
  supabase: SupabaseClient,
  input: { organizationId: string; assessmentId: string; userId: string },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "compliance.assess");
  const { data: assessment } = await supabase
    .from("compliance_assessments")
    .select("id, checklist_assignment_id, rules_snapshot, profile_snapshot")
    .eq("id", input.assessmentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!assessment?.checklist_assignment_id) return assessment;

  const { data: assignment } = await supabase
    .from("checklist_assignments")
    .select("score_percent, findings_count")
    .eq("id", assessment.checklist_assignment_id)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("compliance_assessments")
    .update({
      score_percent: assignment?.score_percent ?? null,
      findings_count: assignment?.findings_count ?? 0,
      conducted_at: new Date().toISOString(),
      status: "completed",
    })
    .eq("id", assessment.id)
    .eq("organization_id", input.organizationId)
    .select("id, rules_snapshot, profile_snapshot, score_percent")
    .single();
  if (error) throw new Error(error.message);
  return data;
}
