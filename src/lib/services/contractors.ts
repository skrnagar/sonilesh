import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { createAssignment, listTemplates } from "@/lib/services/checklists";
import { requireFeature, checkLimit } from "@/lib/services/entitlements";
import { PlanLimitError } from "@/lib/services/hierarchy";
import { notifyUsers } from "@/lib/services/notifications";
import { requirePermission } from "@/lib/services/rbac";
import { hashInviteToken, generateInviteToken } from "@/lib/services/invitations";
import { validateAttachmentFile } from "@/lib/services/attachments";
import { createAdminClient } from "@/lib/supabase/admin";

export const TRAINING_READINESS_TODO =
  "Phase 9 training/competency is a thin register (courses + assignments). Worker readiness uses documents, induction, and site assignment; training_assignments are consulted when the worker has a profile_id.";

export type PrequalOutcome = "unconfigured" | "passed" | "conditional" | "failed";

export type ContractorSettings = {
  prequal_pass_percent: number | null;
  prequal_conditional_percent: number | null;
  enforce_mandatory_docs: boolean;
  ptw_enforce_readiness: boolean;
  induction_required: boolean;
  mandatory_doc_types: string[];
};

export type ReadinessGap = {
  code: string;
  message: string;
};

export type ReadinessResult = {
  ready: boolean;
  gaps: ReadinessGap[];
  trainingConsulted: boolean;
  trainingTodo: string | null;
};

const COMPANY_TRANSITIONS: Record<string, string[]> = {
  pending: ["approved", "active", "suspended", "blacklisted", "deactivated"],
  approved: ["active", "suspended", "blacklisted", "deactivated", "pending"],
  active: ["suspended", "blacklisted", "deactivated"],
  suspended: ["active", "blacklisted", "deactivated"],
  blacklisted: ["deactivated"],
  deactivated: ["pending"],
};

export function canTransitionCompanyStatus(from: string, to: string) {
  return COMPANY_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertSameOrg(recordOrgId: string | null | undefined, organizationId: string) {
  if (!recordOrgId || recordOrgId !== organizationId) {
    throw new Error("Record does not belong to this organization");
  }
}

export function assertNotSelfApprove(actorUserId: string, requesterUserId: string | null | undefined) {
  if (requesterUserId && requesterUserId === actorUserId) {
    throw new Error("Cannot self-approve contractor access");
  }
}

/** Site access is explicit: an approval on another site does not grant this site. */
export function isApprovedForSite(
  assignments: Array<{ site_id: string; status: string; valid_until?: string | null }>,
  siteId: string,
  onDate = new Date(),
) {
  const day = onDate.toISOString().slice(0, 10);
  return assignments.some(
    (row) =>
      row.site_id === siteId &&
      row.status === "approved" &&
      (!row.valid_until || row.valid_until >= day),
  );
}

export function evaluatePrequalOutcome(
  scorePercent: number | null,
  thresholds: { passPercent: number | null; conditionalPercent: number | null },
): PrequalOutcome {
  if (thresholds.passPercent == null || thresholds.conditionalPercent == null) {
    return "unconfigured";
  }
  if (scorePercent == null) return "unconfigured";
  if (scorePercent >= thresholds.passPercent) return "passed";
  if (scorePercent >= thresholds.conditionalPercent) return "conditional";
  return "failed";
}

export function documentIsExpired(
  doc: { expires_on: string | null; status?: string | null },
  onDate = new Date(),
) {
  if (doc.status === "expired") return true;
  if (!doc.expires_on) return false;
  return doc.expires_on < onDate.toISOString().slice(0, 10);
}

export function evaluateReadiness(input: {
  companyStatus: string;
  siteId?: string | null;
  siteAssignments: Array<{ site_id: string; status: string; valid_until?: string | null }>;
  documents: Array<{
    doc_type: string;
    is_mandatory: boolean;
    verification_status: string;
    expires_on: string | null;
    status?: string | null;
  }>;
  settings: Pick<ContractorSettings, "enforce_mandatory_docs" | "induction_required" | "mandatory_doc_types">;
  inductionComplete: boolean;
  workerAssignmentStatus?: string | null;
  training?: { consulted: boolean; expiredOrMissingRequired: boolean };
}): ReadinessResult {
  const gaps: ReadinessGap[] = [];

  if (["blacklisted", "suspended", "deactivated"].includes(input.companyStatus)) {
    gaps.push({ code: "company_status", message: `Company is ${input.companyStatus}` });
  }

  if (input.siteId) {
    if (!isApprovedForSite(input.siteAssignments, input.siteId)) {
      gaps.push({
        code: "site_assignment",
        message: "No approved assignment for this site (site access is not global)",
      });
    }
  }

  if (input.workerAssignmentStatus && input.workerAssignmentStatus !== "approved") {
    gaps.push({
      code: "worker_assignment",
      message: `Worker assignment is ${input.workerAssignmentStatus}`,
    });
  }

  if (input.settings.induction_required && !input.inductionComplete) {
    gaps.push({ code: "induction", message: "Required induction is not complete" });
  }

  if (input.settings.enforce_mandatory_docs) {
    const requiredTypes = new Set(
      (input.settings.mandatory_doc_types ?? []).map((t) => t.trim()).filter(Boolean),
    );
    const relevant = input.documents.filter(
      (d) => d.is_mandatory || requiredTypes.has(d.doc_type),
    );
    if (requiredTypes.size) {
      for (const type of requiredTypes) {
        const match = relevant.filter((d) => d.doc_type === type);
        if (!match.length) {
          gaps.push({ code: "mandatory_doc", message: `Missing mandatory document: ${type}` });
          continue;
        }
        const ok = match.some(
          (d) =>
            d.verification_status === "verified" &&
            !documentIsExpired(d) &&
            d.status !== "rejected",
        );
        if (!ok) {
          const expired = match.some((d) => documentIsExpired(d));
          gaps.push({
            code: expired ? "expired_doc" : "unverified_doc",
            message: expired
              ? `Expired mandatory document: ${type}`
              : `Mandatory document not verified: ${type}`,
          });
        }
      }
    } else {
      for (const doc of relevant) {
        if (documentIsExpired(doc)) {
          gaps.push({
            code: "expired_doc",
            message: `Expired mandatory document: ${doc.doc_type}`,
          });
        } else if (doc.verification_status !== "verified") {
          gaps.push({
            code: "unverified_doc",
            message: `Mandatory document not verified: ${doc.doc_type}`,
          });
        }
      }
    }
  }

  const trainingConsulted = Boolean(input.training?.consulted);
  if (input.training?.expiredOrMissingRequired) {
    gaps.push({ code: "training", message: "Required training assignment is missing or expired" });
  }

  return {
    ready: gaps.length === 0,
    gaps,
    trainingConsulted,
    trainingTodo: trainingConsulted ? null : TRAINING_READINESS_TODO,
  };
}

export function toRegisterCsv(
  rows: Array<Record<string, string | number | null | undefined>>,
  columns: string[],
) {
  const header = columns.map(csvEscape).join(",");
  const body = rows.map((row) => columns.map((col) => csvEscape(row[col])).join(","));
  return [header, ...body].join("\n");
}

export function csvEscape(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value);
  if (/[",\n]/.test(raw)) return `"${raw.replaceAll('"', '""')}"`;
  return raw;
}

async function requireContractorFeature(
  supabase: SupabaseClient,
  organizationId: string,
) {
  await requireFeature(supabase, organizationId, "contractor_management");
}

async function loadSettings(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<ContractorSettings> {
  const { data } = await supabase
    .from("contractor_settings")
    .select(
      "prequal_pass_percent, prequal_conditional_percent, enforce_mandatory_docs, ptw_enforce_readiness, induction_required, mandatory_doc_types",
    )
    .eq("organization_id", organizationId)
    .maybeSingle();
  return {
    prequal_pass_percent: data?.prequal_pass_percent == null ? null : Number(data.prequal_pass_percent),
    prequal_conditional_percent:
      data?.prequal_conditional_percent == null ? null : Number(data.prequal_conditional_percent),
    enforce_mandatory_docs: Boolean(data?.enforce_mandatory_docs),
    ptw_enforce_readiness: Boolean(data?.ptw_enforce_readiness),
    induction_required: data?.induction_required !== false,
    mandatory_doc_types: (data?.mandatory_doc_types as string[] | null) ?? [],
  };
}

async function getCompanyOrThrow(
  supabase: SupabaseClient,
  organizationId: string,
  companyId: string,
) {
  const { data, error } = await supabase
    .from("contractor_companies")
    .select("*")
    .eq("id", companyId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Contractor company not found in this organization");
  return data;
}

async function notifyContractorManagers(
  supabase: SupabaseClient,
  organizationId: string,
  title: string,
  body: string,
  link: string,
  actorUserId: string,
) {
  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id, member_roles(roles:role_id(code))")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .is("deleted_at", null);
  const userIds = (members ?? [])
    .filter((m) => {
      const roles = (m.member_roles as Array<{ roles?: { code?: string } | null }> | null) ?? [];
      return roles.some((r) =>
        ["tenant_admin", "ehs_manager", "ehs_officer"].includes(r.roles?.code ?? ""),
      );
    })
    .map((m) => m.user_id as string)
    .filter((id) => id !== actorUserId);
  await notifyUsers(supabase, {
    organizationId,
    userIds,
    title,
    body,
    link,
    actorUserId,
    eventKey: "contractor.update",
  });
}

export async function listContractorCategories(
  supabase: SupabaseClient,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("contractor_categories")
    .select("id, organization_id, code, name, description, is_active, sort_order")
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertContractorCategory(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    id?: string;
    code: string;
    name: string;
    description?: string;
  },
) {
  await requireContractorFeature(supabase, input.organizationId);
  await requirePermission(supabase, input.organizationId, input.userId, "contractor.manage");
  const code = input.code.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, 40);
  if (!code || !input.name.trim()) throw new Error("Category code and name are required");

  if (input.id) {
    const { data, error } = await supabase
      .from("contractor_categories")
      .update({
        code,
        name: input.name.trim(),
        description: input.description ?? null,
      })
      .eq("id", input.id)
      .eq("organization_id", input.organizationId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase
    .from("contractor_categories")
    .insert({
      organization_id: input.organizationId,
      code,
      name: input.name.trim(),
      description: input.description ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getContractorSettings(
  supabase: SupabaseClient,
  organizationId: string,
) {
  return loadSettings(supabase, organizationId);
}

export async function upsertContractorSettings(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    prequalPassPercent?: number | null;
    prequalConditionalPercent?: number | null;
    enforceMandatoryDocs?: boolean;
    ptwEnforceReadiness?: boolean;
    inductionRequired?: boolean;
    mandatoryDocTypes?: string[];
  },
) {
  await requireContractorFeature(supabase, input.organizationId);
  await requirePermission(supabase, input.organizationId, input.userId, "contractor.manage");

  const pass = input.prequalPassPercent ?? null;
  const cond = input.prequalConditionalPercent ?? null;
  if (pass != null && (pass < 0 || pass > 100)) throw new Error("Pass threshold must be 0–100");
  if (cond != null && (cond < 0 || cond > 100)) throw new Error("Conditional threshold must be 0–100");
  if (pass != null && cond != null && cond > pass) {
    throw new Error("Conditional threshold cannot exceed pass threshold");
  }

  const { data, error } = await supabase
    .from("contractor_settings")
    .upsert(
      {
        organization_id: input.organizationId,
        prequal_pass_percent: pass,
        prequal_conditional_percent: cond,
        enforce_mandatory_docs: input.enforceMandatoryDocs ?? false,
        ptw_enforce_readiness: input.ptwEnforceReadiness ?? false,
        induction_required: input.inductionRequired ?? true,
        mandatory_doc_types: input.mandatoryDocTypes ?? [],
      },
      { onConflict: "organization_id" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listContractorCompanies(
  supabase: SupabaseClient,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("contractor_companies")
    .select(
      "id, name, legal_name, status, safety_score, insurance_expires_on, category_id, email, city, created_at",
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createContractorCompany(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    name: string;
    legalName?: string;
    gstin?: string;
    pan?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    categoryId?: string;
    notes?: string;
  },
) {
  await requireContractorFeature(supabase, input.organizationId);
  await requirePermission(supabase, input.organizationId, input.userId, "contractor.create");

  const limit = await checkLimit(supabase, input.organizationId, "max_contractors", 1);
  if (!limit.allowed) {
    throw new PlanLimitError(
      "max_contractors",
      limit.limit,
      "Contractor limit reached. Upgrade your plan or increase this allowance.",
    );
  }

  if (input.categoryId) {
    const { data: cat } = await supabase
      .from("contractor_categories")
      .select("id, organization_id")
      .eq("id", input.categoryId)
      .maybeSingle();
    if (!cat || (cat.organization_id && cat.organization_id !== input.organizationId)) {
      throw new Error("Category must belong to this organization or be a shared template");
    }
  }

  const { data, error } = await supabase
    .from("contractor_companies")
    .insert({
      organization_id: input.organizationId,
      name: input.name.trim(),
      legal_name: input.legalName?.trim() || null,
      gstin: input.gstin?.trim() || null,
      pan: input.pan?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      category_id: input.categoryId || null,
      notes: input.notes?.trim() || null,
      status: "pending",
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("contractor_status_history").insert({
    organization_id: input.organizationId,
    company_id: data.id,
    from_status: null,
    to_status: "pending",
    reason: "Registered",
    actor_user_id: input.userId,
  });

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "contractor.created",
    entityType: "contractor_company",
    entityId: data.id,
    newValues: { name: data.name, status: data.status },
  });

  return data;
}

export async function getContractorBundle(
  supabase: SupabaseClient,
  organizationId: string,
  companyId: string,
) {
  const company = await getCompanyOrThrow(supabase, organizationId, companyId);
  const [
    contacts,
    workers,
    documents,
    prequal,
    contracts,
    siteAssignments,
    projectAssignments,
    performance,
    history,
    blacklist,
    assessments,
  ] = await Promise.all([
    supabase
      .from("contractor_contacts")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("company_id", companyId)
      .is("deleted_at", null),
    supabase
      .from("contractor_workers")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("company_id", companyId)
      .is("deleted_at", null),
    supabase
      .from("contractor_documents")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("contractor_prequalification")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("contractor_contracts")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("company_id", companyId)
      .is("deleted_at", null),
    supabase
      .from("contractor_site_assignments")
      .select("*, sites:site_id(id, name)")
      .eq("organization_id", organizationId)
      .eq("company_id", companyId),
    supabase
      .from("contractor_project_assignments")
      .select("*, projects:project_id(id, name, site_id)")
      .eq("organization_id", organizationId)
      .eq("company_id", companyId),
    supabase
      .from("contractor_performance")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("contractor_status_history")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("contractor_blacklist_records")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("company_id", companyId)
      .is("lifted_on", null),
    supabase
      .from("contractor_assessments")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    company,
    contacts: contacts.data ?? [],
    workers: workers.data ?? [],
    documents: documents.data ?? [],
    prequalification: prequal.data ?? [],
    contracts: contracts.data ?? [],
    siteAssignments: siteAssignments.data ?? [],
    projectAssignments: projectAssignments.data ?? [],
    performance: performance.data ?? [],
    history: history.data ?? [],
    blacklist: blacklist.data ?? [],
    assessments: assessments.data ?? [],
  };
}

export async function transitionContractorStatus(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    companyId: string;
    toStatus: string;
    reason?: string;
  },
) {
  await requireContractorFeature(supabase, input.organizationId);
  await requirePermission(supabase, input.organizationId, input.userId, "contractor.approve");
  const company = await getCompanyOrThrow(supabase, input.organizationId, input.companyId);
  if (!canTransitionCompanyStatus(company.status, input.toStatus)) {
    throw new Error(`Cannot change status from ${company.status} to ${input.toStatus}`);
  }
  if (["approved", "active"].includes(input.toStatus) && company.created_by === input.userId) {
    assertNotSelfApprove(input.userId, company.created_by);
  }

  const patch: Record<string, unknown> = { status: input.toStatus };
  if (input.toStatus === "approved" || input.toStatus === "active") {
    patch.approved_at = new Date().toISOString();
    patch.approved_by = input.userId;
  }
  if (input.toStatus === "blacklisted") {
    patch.blacklist_reason = input.reason ?? "Blacklisted";
  }

  const { data, error } = await supabase
    .from("contractor_companies")
    .update(patch)
    .eq("id", company.id)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("contractor_status_history").insert({
    organization_id: input.organizationId,
    company_id: company.id,
    from_status: company.status,
    to_status: input.toStatus,
    reason: input.reason ?? null,
    actor_user_id: input.userId,
  });

  if (input.toStatus === "blacklisted") {
    await supabase.from("contractor_blacklist_records").insert({
      organization_id: input.organizationId,
      company_id: company.id,
      reason: input.reason || "Blacklisted",
      created_by: input.userId,
    });
  }

  await notifyContractorManagers(
    supabase,
    input.organizationId,
    `Contractor ${data.name} is now ${input.toStatus}`,
    input.reason || `Status changed from ${company.status}`,
    `/app/contractors/${company.id}`,
    input.userId,
  );

  return data;
}

export async function addContractorContact(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    companyId: string;
    fullName: string;
    email?: string;
    phone?: string;
    roleTitle?: string;
    isPrimary?: boolean;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "contractor.update");
  await getCompanyOrThrow(supabase, input.organizationId, input.companyId);
  const { data, error } = await supabase
    .from("contractor_contacts")
    .insert({
      organization_id: input.organizationId,
      company_id: input.companyId,
      full_name: input.fullName.trim(),
      email: input.email?.trim().toLowerCase() || null,
      phone: input.phone?.trim() || null,
      role_title: input.roleTitle?.trim() || null,
      is_primary: Boolean(input.isPrimary),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function inviteContractorContact(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    companyId: string;
    email: string;
    fullName?: string;
    contactId?: string;
  },
) {
  await requireContractorFeature(supabase, input.organizationId);
  await requirePermission(supabase, input.organizationId, input.userId, "contractor.update");
  await getCompanyOrThrow(supabase, input.organizationId, input.companyId);
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("Valid email required");

  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();

  const { data, error } = await supabase
    .from("contractor_invites")
    .insert({
      organization_id: input.organizationId,
      company_id: input.companyId,
      contact_id: input.contactId ?? null,
      email,
      full_name: input.fullName ?? null,
      token_hash: tokenHash,
      expires_at: expiresAt,
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await notifyContractorManagers(
    supabase,
    input.organizationId,
    "Contractor portal invite sent",
    `Invite sent to ${email}`,
    `/app/contractors/${input.companyId}`,
    input.userId,
  );

  return { invite: data, token };
}

export async function acceptContractorInvite(
  _userClient: SupabaseClient,
  input: { token: string; userId: string; email: string },
) {
  const admin = createAdminClient();
  const tokenHash = hashInviteToken(input.token);
  const { data: invite, error } = await admin
    .from("contractor_invites")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!invite) throw new Error("Invitation not found");
  if (invite.revoked_at) throw new Error("Invitation was revoked");
  if (invite.accepted_at) throw new Error("Invitation already accepted");
  if (new Date(invite.expires_at).getTime() < Date.now()) throw new Error("Invitation expired");
  if (invite.email.toLowerCase() !== input.email.trim().toLowerCase()) {
    throw new Error("Signed-in email does not match the invitation");
  }

  const { data: company } = await admin
    .from("contractor_companies")
    .select("id")
    .eq("id", invite.company_id)
    .eq("organization_id", invite.organization_id)
    .maybeSingle();
  if (!company) throw new Error("Contractor company not found in this organization");

  const { data: member, error: memberErr } = await admin
    .from("organization_members")
    .upsert(
      {
        organization_id: invite.organization_id,
        user_id: input.userId,
        status: "active",
        invited_email: invite.email,
        joined_at: new Date().toISOString(),
        contractor_company_id: company.id,
      },
      { onConflict: "organization_id,user_id" },
    )
    .select("id")
    .single();
  if (memberErr) throw new Error(memberErr.message);

  const { data: role } = await admin
    .from("roles")
    .select("id")
    .is("organization_id", null)
    .eq("code", "contractor_contact")
    .maybeSingle();
  if (role) {
    const { data: existingRole } = await admin
      .from("member_roles")
      .select("id")
      .eq("member_id", member.id)
      .eq("role_id", role.id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!existingRole) {
      await admin.from("member_roles").insert({
        member_id: member.id,
        role_id: role.id,
        scope: "organization",
      });
    }
  }

  if (invite.contact_id) {
    await admin
      .from("contractor_contacts")
      .update({ user_id: input.userId })
      .eq("id", invite.contact_id)
      .eq("organization_id", invite.organization_id);
  }

  await admin
    .from("contractor_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  return { organizationId: invite.organization_id as string, companyId: company.id as string };
}

export async function startPrequalification(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    companyId: string;
    templateId?: string;
    passPercent?: number | null;
    conditionalPercent?: number | null;
  },
) {
  await requireContractorFeature(supabase, input.organizationId);
  await requirePermission(supabase, input.organizationId, input.userId, "contractor.update");
  const company = await getCompanyOrThrow(supabase, input.organizationId, input.companyId);
  const settings = await loadSettings(supabase, input.organizationId);

  let templateId = input.templateId;
  if (!templateId) {
    const templates = await listTemplates(supabase, input.organizationId, "contractor");
    templateId = templates[0]?.id;
  }
  if (!templateId) {
    throw new Error("Create a contractor checklist template before starting prequalification");
  }

  const { data: template } = await supabase
    .from("checklist_templates")
    .select("id, organization_id, name, checklist_type")
    .eq("id", templateId)
    .eq("organization_id", input.organizationId)
    .eq("checklist_type", "contractor")
    .maybeSingle();
  if (!template) throw new Error("Prequalification template must be checklist_type contractor");

  const assignment = await createAssignment(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    templateId,
    title: `Prequalification · ${company.name}`,
    checklistType: "contractor",
  });

  const { data, error } = await supabase
    .from("contractor_prequalification")
    .insert({
      organization_id: input.organizationId,
      company_id: company.id,
      checklist_template_id: templateId,
      current_assignment_id: assignment.id,
      status: "in_progress",
      pass_percent: input.passPercent ?? settings.prequal_pass_percent,
      conditional_percent: input.conditionalPercent ?? settings.prequal_conditional_percent,
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return { prequalification: data, assignment };
}

export async function scorePrequalification(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    prequalificationId: string;
    scorePercent: number;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "contractor.approve");
  const { data: row, error } = await supabase
    .from("contractor_prequalification")
    .select("*")
    .eq("id", input.prequalificationId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Prequalification not found in this organization");
  assertSameOrg(row.organization_id, input.organizationId);

  const settings = await loadSettings(supabase, input.organizationId);
  const outcome = evaluatePrequalOutcome(input.scorePercent, {
    passPercent: row.pass_percent ?? settings.prequal_pass_percent,
    conditionalPercent: row.conditional_percent ?? settings.prequal_conditional_percent,
  });
  if (outcome === "unconfigured") {
    throw new Error(
      "Configure pass and conditional thresholds in contractor settings before scoring. Thresholds are not hard-coded.",
    );
  }

  const status = outcome === "passed" ? "passed" : outcome === "conditional" ? "conditional" : "failed";
  const { data: versions } = await supabase
    .from("contractor_prequalification_versions")
    .select("version")
    .eq("prequalification_id", row.id)
    .order("version", { ascending: false })
    .limit(1);
  const nextVersion = Number(versions?.[0]?.version ?? 0) + 1;

  await supabase.from("contractor_prequalification_versions").insert({
    organization_id: input.organizationId,
    prequalification_id: row.id,
    version: nextVersion,
    checklist_assignment_id: row.current_assignment_id,
    score_percent: input.scorePercent,
    outcome,
    pass_percent: row.pass_percent ?? settings.prequal_pass_percent,
    conditional_percent: row.conditional_percent ?? settings.prequal_conditional_percent,
    created_by: input.userId,
  });

  const { data, error: updErr } = await supabase
    .from("contractor_prequalification")
    .update({
      score_percent: input.scorePercent,
      outcome,
      status,
      reviewed_by: input.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (updErr) throw new Error(updErr.message);

  await notifyContractorManagers(
    supabase,
    input.organizationId,
    `Prequalification ${outcome}`,
    `Score ${input.scorePercent}% → ${outcome}`,
    `/app/contractors/${row.company_id}?tab=prequalification`,
    input.userId,
  );
  return data;
}

export async function createContractorContract(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    companyId: string;
    title: string;
    contractNumber?: string;
    startsOn?: string;
    endsOn?: string;
    notes?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "contractor.update");
  await getCompanyOrThrow(supabase, input.organizationId, input.companyId);
  const { data, error } = await supabase
    .from("contractor_contracts")
    .insert({
      organization_id: input.organizationId,
      company_id: input.companyId,
      title: input.title.trim(),
      contract_number: input.contractNumber?.trim() || null,
      starts_on: input.startsOn || null,
      ends_on: input.endsOn || null,
      notes: input.notes || null,
      status: "draft",
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function requestSiteAssignment(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    companyId: string;
    siteId: string;
    validFrom?: string;
    validUntil?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "contractor_access.manage");
  await getCompanyOrThrow(supabase, input.organizationId, input.companyId);
  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", input.siteId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!site) throw new Error("Site must belong to this organization");

  const { data, error } = await supabase
    .from("contractor_site_assignments")
    .upsert(
      {
        organization_id: input.organizationId,
        company_id: input.companyId,
        site_id: input.siteId,
        status: "requested",
        valid_from: input.validFrom || null,
        valid_until: input.validUntil || null,
        requested_by: input.userId,
        approved_by: null,
        approved_at: null,
      },
      { onConflict: "company_id,site_id" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function approveSiteAssignment(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    assignmentId: string;
    decision: "approved" | "rejected";
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "contractor_access.approve");
  const { data: row, error } = await supabase
    .from("contractor_site_assignments")
    .select("*")
    .eq("id", input.assignmentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Site assignment not found in this organization");
  assertSameOrg(row.organization_id, input.organizationId);
  assertNotSelfApprove(input.userId, row.requested_by);

  const { data, error: updErr } = await supabase
    .from("contractor_site_assignments")
    .update({
      status: input.decision,
      approved_by: input.userId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (updErr) throw new Error(updErr.message);
  return data;
}

export async function requestProjectAssignment(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    companyId: string;
    projectId: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "contractor_access.manage");
  await getCompanyOrThrow(supabase, input.organizationId, input.companyId);
  const { data: project } = await supabase
    .from("projects")
    .select("id, site_id, organization_id")
    .eq("id", input.projectId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!project) throw new Error("Project must belong to this organization");

  const { data, error } = await supabase
    .from("contractor_project_assignments")
    .upsert(
      {
        organization_id: input.organizationId,
        company_id: input.companyId,
        project_id: input.projectId,
        status: "requested",
        requested_by: input.userId,
        approved_by: null,
        approved_at: null,
      },
      { onConflict: "company_id,project_id" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function approveProjectAssignment(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    assignmentId: string;
    decision: "approved" | "rejected";
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "contractor_access.approve");
  const { data: row, error } = await supabase
    .from("contractor_project_assignments")
    .select("*")
    .eq("id", input.assignmentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Project assignment not found in this organization");
  assertNotSelfApprove(input.userId, row.requested_by);

  const { data, error: updErr } = await supabase
    .from("contractor_project_assignments")
    .update({
      status: input.decision,
      approved_by: input.userId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (updErr) throw new Error(updErr.message);
  return data;
}

export async function createContractorWorker(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    companyId: string;
    fullName: string;
    employeeNumber?: string;
    trade?: string;
    profileId?: string;
    memberId?: string;
    email?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "contractor_worker.manage");
  await getCompanyOrThrow(supabase, input.organizationId, input.companyId);

  if (input.profileId) {
    const { data: member } = await supabase
      .from("organization_members")
      .select("id, user_id")
      .eq("organization_id", input.organizationId)
      .eq("user_id", input.profileId)
      .maybeSingle();
    if (!member) throw new Error("Profile must be an organization member");
  }
  if (input.memberId) {
    const { data: member } = await supabase
      .from("organization_members")
      .select("id")
      .eq("id", input.memberId)
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (!member) throw new Error("Member must belong to this organization");
  }

  const { data, error } = await supabase
    .from("contractor_workers")
    .insert({
      organization_id: input.organizationId,
      company_id: input.companyId,
      full_name: input.fullName.trim(),
      employee_number: input.employeeNumber?.trim() || null,
      trade: input.trade?.trim() || null,
      profile_id: input.profileId || null,
      member_id: input.memberId || null,
      email: input.email?.trim() || null,
      status: "active",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function assignContractorWorker(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    workerId: string;
    siteId?: string;
    projectId?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "contractor_access.manage");
  const { data: worker } = await supabase
    .from("contractor_workers")
    .select("id, company_id, organization_id")
    .eq("id", input.workerId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!worker) throw new Error("Worker not found in this organization");
  if (!input.siteId && !input.projectId) throw new Error("Site or project is required");

  const { data, error } = await supabase
    .from("contractor_worker_assignments")
    .insert({
      organization_id: input.organizationId,
      worker_id: worker.id,
      company_id: worker.company_id,
      site_id: input.siteId || null,
      project_id: input.projectId || null,
      status: "requested",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function approveWorkerAssignment(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    assignmentId: string;
    decision: "approved" | "rejected";
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "contractor_access.approve");
  const { data: row } = await supabase
    .from("contractor_worker_assignments")
    .select("*")
    .eq("id", input.assignmentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!row) throw new Error("Worker assignment not found in this organization");

  const { data, error } = await supabase
    .from("contractor_worker_assignments")
    .update({
      status: input.decision,
      approved_by: input.userId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createInduction(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    title: string;
    siteId?: string;
    projectId?: string;
    validityDays?: number;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "contractor.update");
  const { data, error } = await supabase
    .from("contractor_inductions")
    .insert({
      organization_id: input.organizationId,
      title: input.title.trim(),
      site_id: input.siteId || null,
      project_id: input.projectId || null,
      validity_days: input.validityDays ?? null,
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function recordInduction(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    inductionId: string;
    workerId: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "contractor_worker.manage");
  const [{ data: induction }, { data: worker }] = await Promise.all([
    supabase
      .from("contractor_inductions")
      .select("*")
      .eq("id", input.inductionId)
      .eq("organization_id", input.organizationId)
      .maybeSingle(),
    supabase
      .from("contractor_workers")
      .select("id, company_id")
      .eq("id", input.workerId)
      .eq("organization_id", input.organizationId)
      .maybeSingle(),
  ]);
  if (!induction || !worker) throw new Error("Induction or worker not found in this organization");

  const completedAt = new Date();
  const expiresOn = induction.validity_days
    ? new Date(completedAt.getTime() + induction.validity_days * 86400000).toISOString().slice(0, 10)
    : null;

  const { data, error } = await supabase
    .from("contractor_induction_records")
    .upsert(
      {
        organization_id: input.organizationId,
        induction_id: induction.id,
        worker_id: worker.id,
        company_id: worker.company_id,
        completed_at: completedAt.toISOString(),
        expires_on: expiresOn,
        recorded_by: input.userId,
      },
      { onConflict: "induction_id,worker_id" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await supabase
    .from("contractor_workers")
    .update({ induction_completed_at: completedAt.toISOString() })
    .eq("id", worker.id)
    .eq("organization_id", input.organizationId);

  return data;
}

export async function createContractorAssessment(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    companyId: string;
    templateId: string;
    title: string;
    workerId?: string;
    siteId?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "contractor.update");
  await getCompanyOrThrow(supabase, input.organizationId, input.companyId);
  const assignment = await createAssignment(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    templateId: input.templateId,
    title: input.title,
    checklistType: "contractor",
    siteId: input.siteId,
  });
  const { data, error } = await supabase
    .from("contractor_assessments")
    .insert({
      organization_id: input.organizationId,
      company_id: input.companyId,
      worker_id: input.workerId || null,
      site_id: input.siteId || null,
      checklist_assignment_id: assignment.id,
      title: input.title,
      status: assignment.status,
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return { assessment: data, assignment };
}

export async function recordContractorPerformance(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    companyId: string;
    siteId?: string;
    safetyScore?: number;
    incidentsCount?: number;
    findingsCount?: number;
    capaOpenCount?: number;
    notes?: string;
    periodStart?: string;
    periodEnd?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "contractor.update");
  const company = await getCompanyOrThrow(supabase, input.organizationId, input.companyId);
  const { data, error } = await supabase
    .from("contractor_performance")
    .insert({
      organization_id: input.organizationId,
      company_id: company.id,
      site_id: input.siteId || null,
      safety_score: input.safetyScore ?? null,
      incidents_count: input.incidentsCount ?? 0,
      findings_count: input.findingsCount ?? 0,
      capa_open_count: input.capaOpenCount ?? 0,
      notes: input.notes || null,
      period_start: input.periodStart || null,
      period_end: input.periodEnd || null,
      recorded_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  if (input.safetyScore != null) {
    await supabase
      .from("contractor_companies")
      .update({ safety_score: input.safetyScore })
      .eq("id", company.id)
      .eq("organization_id", input.organizationId);
  }
  return data;
}

export async function uploadContractorDocument(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    companyId: string;
    workerId?: string;
    docType: string;
    title: string;
    expiresOn?: string;
    isMandatory?: boolean;
    file?: File;
  },
) {
  await requireContractorFeature(supabase, input.organizationId);
  await requirePermission(supabase, input.organizationId, input.userId, "contractor_document.manage");
  const company = await getCompanyOrThrow(supabase, input.organizationId, input.companyId);

  let storagePath: string | null = null;
  let fileName: string | null = null;
  let mimeType: string | null = null;
  let fileSize: number | null = null;
  if (input.file) {
    const mime = validateAttachmentFile(input.file);
    const safeName = input.file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "upload.bin";
    storagePath = `${input.organizationId}/contractors/${company.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("ehs-attachments")
      .upload(storagePath, input.file, { contentType: mime, upsert: false });
    if (uploadError) throw new Error(uploadError.message);
    fileName = safeName;
    mimeType = mime;
    fileSize = input.file.size;
  }

  const { data, error } = await supabase
    .from("contractor_documents")
    .insert({
      organization_id: input.organizationId,
      company_id: company.id,
      worker_id: input.workerId || null,
      doc_type: input.docType.trim(),
      title: input.title.trim(),
      expires_on: input.expiresOn || null,
      is_mandatory: Boolean(input.isMandatory),
      status: "pending",
      verification_status: "pending",
      storage_path: storagePath,
      file_name: fileName,
      mime_type: mimeType,
      file_size: fileSize,
      uploaded_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function verifyContractorDocument(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    documentId: string;
    decision: "verified" | "rejected";
    notes?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "contractor_document.verify");
  const { data: doc } = await supabase
    .from("contractor_documents")
    .select("*")
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!doc) throw new Error("Document not found in this organization");
  if (doc.uploaded_by === input.userId) {
    throw new Error("Cannot self-verify contractor documents");
  }

  const { data, error } = await supabase
    .from("contractor_documents")
    .update({
      verification_status: input.decision,
      verified_by: input.userId,
      verified_at: new Date().toISOString(),
      verification_notes: input.notes ?? null,
      status: input.decision === "verified" ? "valid" : "rejected",
    })
    .eq("id", doc.id)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function consultTraining(
  supabase: SupabaseClient,
  organizationId: string,
  profileId: string | null,
) {
  if (!profileId) {
    return { consulted: false, expiredOrMissingRequired: false };
  }
  const { data, error } = await supabase
    .from("training_assignments")
    .select("id, status, expires_at")
    .eq("organization_id", organizationId)
    .eq("user_id", profileId)
    .is("deleted_at", null);
  if (error) {
    return { consulted: false, expiredOrMissingRequired: false };
  }
  const today = new Date().toISOString().slice(0, 10);
  const expiredOrMissingRequired = (data ?? []).some(
    (row) => row.status === "expired" || (row.expires_at && row.expires_at < today),
  );
  return { consulted: true, expiredOrMissingRequired };
}

export async function getCompanyReadiness(
  supabase: SupabaseClient,
  input: { organizationId: string; companyId: string; siteId?: string },
): Promise<ReadinessResult> {
  const company = await getCompanyOrThrow(supabase, input.organizationId, input.companyId);
  const settings = await loadSettings(supabase, input.organizationId);
  const [{ data: assignments }, { data: documents }] = await Promise.all([
    supabase
      .from("contractor_site_assignments")
      .select("site_id, status, valid_until")
      .eq("organization_id", input.organizationId)
      .eq("company_id", company.id),
    supabase
      .from("contractor_documents")
      .select("doc_type, is_mandatory, verification_status, expires_on, status")
      .eq("organization_id", input.organizationId)
      .eq("company_id", company.id)
      .is("worker_id", null),
  ]);
  return evaluateReadiness({
    companyStatus: company.status,
    siteId: input.siteId,
    siteAssignments: assignments ?? [],
    documents: documents ?? [],
    settings,
    inductionComplete: true,
    training: { consulted: false, expiredOrMissingRequired: false },
  });
}

export async function getWorkerReadiness(
  supabase: SupabaseClient,
  input: { organizationId: string; workerId: string; siteId?: string },
): Promise<ReadinessResult> {
  const { data: worker } = await supabase
    .from("contractor_workers")
    .select("*")
    .eq("id", input.workerId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!worker) throw new Error("Worker not found in this organization");
  const company = await getCompanyOrThrow(supabase, input.organizationId, worker.company_id);
  const settings = await loadSettings(supabase, input.organizationId);

  const [{ data: siteAssignments }, { data: documents }, { data: workerAssignments }, training] =
    await Promise.all([
      supabase
        .from("contractor_site_assignments")
        .select("site_id, status, valid_until")
        .eq("organization_id", input.organizationId)
        .eq("company_id", company.id),
      supabase
        .from("contractor_documents")
        .select("doc_type, is_mandatory, verification_status, expires_on, status")
        .eq("organization_id", input.organizationId)
        .eq("company_id", company.id)
        .or(`worker_id.eq.${worker.id},worker_id.is.null`),
      input.siteId
        ? supabase
            .from("contractor_worker_assignments")
            .select("status")
            .eq("organization_id", input.organizationId)
            .eq("worker_id", worker.id)
            .eq("site_id", input.siteId)
            .order("created_at", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [] as Array<{ status: string }> }),
      consultTraining(supabase, input.organizationId, worker.profile_id),
    ]);

  return evaluateReadiness({
    companyStatus: company.status,
    siteId: input.siteId,
    siteAssignments: siteAssignments ?? [],
    documents: documents ?? [],
    settings,
    inductionComplete: Boolean(worker.induction_completed_at),
    workerAssignmentStatus: workerAssignments?.[0]?.status ?? null,
    training,
  });
}

export async function getPtwEligibility(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    companyId?: string;
    workerId?: string;
    siteId?: string;
  },
) {
  const settings = await loadSettings(supabase, input.organizationId);
  let readiness: ReadinessResult | null = null;
  if (input.workerId) {
    readiness = await getWorkerReadiness(supabase, {
      organizationId: input.organizationId,
      workerId: input.workerId,
      siteId: input.siteId,
    });
  } else if (input.companyId) {
    readiness = await getCompanyReadiness(supabase, {
      organizationId: input.organizationId,
      companyId: input.companyId,
      siteId: input.siteId,
    });
  }
  return {
    readiness,
    enforce: settings.ptw_enforce_readiness,
    blocksPermit: Boolean(settings.ptw_enforce_readiness && readiness && !readiness.ready),
  };
}

export async function getContractorDashboard(
  supabase: SupabaseClient,
  organizationId: string,
) {
  const settings = await loadSettings(supabase, organizationId);
  const [{ data: companies }, { data: docs }, { data: sites }] = await Promise.all([
    supabase
      .from("contractor_companies")
      .select("id, name, status, safety_score, insurance_expires_on")
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
    supabase
      .from("contractor_documents")
      .select("id, company_id, doc_type, expires_on, verification_status, is_mandatory, status")
      .eq("organization_id", organizationId),
    supabase
      .from("contractor_site_assignments")
      .select("id, status")
      .eq("organization_id", organizationId),
  ]);
  const list = companies ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const expiring = (docs ?? []).filter(
    (d) => d.expires_on && d.expires_on <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  );
  return {
    settings,
    total: list.length,
    byStatus: {
      pending: list.filter((c) => c.status === "pending").length,
      active: list.filter((c) => c.status === "active" || c.status === "approved").length,
      suspended: list.filter((c) => c.status === "suspended").length,
      blacklisted: list.filter((c) => c.status === "blacklisted").length,
    },
    expiringDocuments: expiring.length,
    expiredDocuments: (docs ?? []).filter((d) => d.expires_on && d.expires_on < today).length,
    pendingAccess: (sites ?? []).filter((s) => s.status === "requested").length,
    companies: list,
  };
}

export async function exportContractorRegisterCsv(
  supabase: SupabaseClient,
  organizationId: string,
) {
  const rows = await listContractorCompanies(supabase, organizationId);
  return toRegisterCsv(
    rows.map((r) => ({
      name: r.name,
      status: r.status,
      safety_score: r.safety_score,
      insurance_expires_on: r.insurance_expires_on,
      city: r.city,
      email: r.email,
    })),
    ["name", "status", "safety_score", "insurance_expires_on", "city", "email"],
  );
}

export async function exportDocumentExpiryCsv(
  supabase: SupabaseClient,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("contractor_documents")
    .select("title, doc_type, expires_on, verification_status, status, company_id, contractor_companies:company_id(name)")
    .eq("organization_id", organizationId)
    .order("expires_on", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return toRegisterCsv(
    (data ?? []).map((d) => ({
      company: (d.contractor_companies as { name?: string } | null)?.name ?? "",
      title: d.title,
      doc_type: d.doc_type,
      expires_on: d.expires_on,
      verification_status: d.verification_status,
      status: d.status,
    })),
    ["company", "title", "doc_type", "expires_on", "verification_status", "status"],
  );
}
