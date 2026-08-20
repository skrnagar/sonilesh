import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { INVITE_ROLE_CODES } from "@/lib/constants/organization";
import { writeAuditLog } from "@/lib/services/audit";
import { checkLimit } from "@/lib/services/entitlements";
import { PlanLimitError } from "@/lib/services/hierarchy";
import { requirePermission } from "@/lib/services/rbac";
import { createAdminClient } from "@/lib/supabase/admin";

const ASSIGNABLE_ROLE_CODES = new Set<string>(INVITE_ROLE_CODES);

function assertAssignableRole(roleCode: string) {
  const code = roleCode.trim().toLowerCase();
  if (!ASSIGNABLE_ROLE_CODES.has(code)) {
    throw new Error("That role cannot be assigned through invite or role change");
  }
  return code;
}

const DEFAULT_INVITE_DAYS = Number(process.env.INVITE_EXPIRY_DAYS ?? "7");

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateInviteToken() {
  return randomBytes(32).toString("hex");
}

export async function createOrganizationInvitation(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    email: string;
    fullName?: string;
    roleCode: string;
    scope?: string;
    businessUnitId?: string | null;
    siteId?: string | null;
    departmentId?: string | null;
    projectId?: string | null;
    expiresInDays?: number;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "users.manage");
  const roleCode = assertAssignableRole(input.roleCode);
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("Valid email required");

  const limit = await checkLimit(supabase, input.organizationId, "max_users", 1);
  if (!limit.allowed) {
    throw new PlanLimitError(
      "max_users",
      limit.limit,
      `Your current plan allows ${limit.limit ?? 0} users. Upgrade your plan or contact sales.`,
    );
  }

  for (const [label, id, table] of [
    ["Business unit", input.businessUnitId, "business_units"],
    ["Site", input.siteId, "sites"],
    ["Department", input.departmentId, "departments"],
    ["Project", input.projectId, "projects"],
  ] as const) {
    if (!id) continue;
    const { data } = await supabase
      .from(table)
      .select("id")
      .eq("id", id)
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (!data) throw new Error(`${label} must belong to this organization`);
  }

  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const days = input.expiresInDays ?? DEFAULT_INVITE_DAYS;
  const expiresAt = new Date(Date.now() + days * 86400000).toISOString();

  const { data, error } = await supabase
    .from("organization_invitations")
    .upsert(
      {
        organization_id: input.organizationId,
        email,
        full_name: input.fullName ?? null,
        role_code: roleCode,
        scope: input.scope ?? "organization",
        business_unit_id: input.businessUnitId ?? null,
        site_id: input.siteId ?? null,
        department_id: input.departmentId ?? null,
        project_id: input.projectId ?? null,
        token_hash: tokenHash,
        expires_at: expiresAt,
        accepted_at: null,
        revoked_at: null,
        created_by: input.userId,
      },
      { onConflict: "organization_id,email" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (profile) {
    await supabase.from("organization_members").upsert(
      {
        organization_id: input.organizationId,
        user_id: profile.id,
        status: "invited",
        invited_email: email,
        invited_at: new Date().toISOString(),
        created_by: input.userId,
      },
      { onConflict: "organization_id,user_id" },
    );
  }

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "user.invited",
    entityType: "organization_invitation",
    entityId: data.id,
    newValues: {
      email,
      role_code: roleCode,
      scope: input.scope ?? "organization",
      expires_at: expiresAt,
    },
  });

  return { invitation: data, token };
}

export async function acceptOrganizationInvitation(
  _userClient: SupabaseClient,
  input: { token: string; userId: string; email: string },
) {
  // Invitee is not yet an org member — service role for atomic accept.
  const admin = createAdminClient();
  const tokenHash = hashInviteToken(input.token);
  const { data: invite, error } = await admin
    .from("organization_invitations")
    .select("*")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .is("accepted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!invite) throw new Error("Invitation not found");
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    throw new Error("Invitation has expired");
  }
  if (invite.email.toLowerCase() !== input.email.trim().toLowerCase()) {
    throw new Error("Invitation email does not match signed-in user");
  }
  const roleCode = assertAssignableRole(String(invite.role_code || ""));

  const limit = await checkLimit(admin, invite.organization_id, "max_users", 1);
  if (!limit.allowed) {
    throw new PlanLimitError(
      "max_users",
      limit.limit,
      `Your current plan allows ${limit.limit ?? 0} users. Upgrade your plan or contact sales.`,
    );
  }

  const { data: member, error: memberError } = await admin
    .from("organization_members")
    .upsert(
      {
        organization_id: invite.organization_id,
        user_id: input.userId,
        status: "active",
        invited_email: invite.email,
        invited_at: invite.created_at,
        joined_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,user_id" },
    )
    .select("*")
    .single();
  if (memberError) throw new Error(memberError.message);

  const { data: role } = await admin
    .from("roles")
    .select("id")
    .eq("code", roleCode)
    .is("organization_id", null)
    .maybeSingle();

  if (role?.id) {
    await admin.from("member_roles").insert({
      member_id: member.id,
      role_id: role.id,
      scope: invite.scope === "self" ? "own" : invite.scope,
      site_id: invite.site_id,
      department_id: invite.department_id,
      business_unit_id: invite.business_unit_id,
      project_id: invite.project_id,
    });
  }

  await admin
    .from("organization_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  await writeAuditLog(admin, {
    organizationId: invite.organization_id,
    actorUserId: input.userId,
    action: "user.invitation_accepted",
    entityType: "organization_invitation",
    entityId: invite.id,
    newValues: { member_id: member.id, role_code: roleCode },
  });

  return { organizationId: invite.organization_id as string, member };
}

export async function listOrganizationMembers(
  supabase: SupabaseClient,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("organization_members")
    .select(
      `
      id, status, is_owner, title, invited_email, joined_at, created_at,
      profiles:user_id (id, email, full_name),
      member_roles (
        id, scope, site_id, department_id, business_unit_id, project_id,
        roles:role_id (code, name)
      )
    `,
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateMemberStatus(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    actorUserId: string;
    memberId: string;
    status: "active" | "suspended" | "removed";
  },
) {
  await requirePermission(supabase, input.organizationId, input.actorUserId, "users.manage");
  const { data: previous } = await supabase
    .from("organization_members")
    .select("*")
    .eq("id", input.memberId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!previous) throw new Error("Member not found");
  if (previous.is_owner && input.status !== "active") {
    throw new Error("Cannot deactivate the organization owner");
  }

  const { data, error } = await supabase
    .from("organization_members")
    .update({
      status: input.status,
      updated_by: input.actorUserId,
      deleted_at: input.status === "removed" ? new Date().toISOString() : null,
    })
    .eq("id", input.memberId)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    action:
      input.status === "active"
        ? "user.reactivated"
        : input.status === "suspended"
          ? "user.deactivated"
          : "user.removed",
    entityType: "organization_member",
    entityId: input.memberId,
    previousValues: previous,
    newValues: data,
  });
  return data;
}

export async function assignMemberRoleScope(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    actorUserId: string;
    memberId: string;
    roleCode: string;
    scope: string;
    siteId?: string | null;
    businessUnitId?: string | null;
    projectId?: string | null;
    departmentId?: string | null;
  },
) {
  await requirePermission(supabase, input.organizationId, input.actorUserId, "users.manage");
  const roleCode = assertAssignableRole(input.roleCode);
  const { data: member } = await supabase
    .from("organization_members")
    .select("id")
    .eq("id", input.memberId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!member) throw new Error("Member not found in this organization");

  const { data: role } = await supabase
    .from("roles")
    .select("id")
    .eq("code", roleCode)
    .is("organization_id", null)
    .maybeSingle();
  if (!role) throw new Error("Unknown role");

  for (const [label, id, table] of [
    ["Business unit", input.businessUnitId, "business_units"],
    ["Site", input.siteId, "sites"],
    ["Department", input.departmentId, "departments"],
    ["Project", input.projectId, "projects"],
  ] as const) {
    if (!id) continue;
    const { data } = await supabase
      .from(table)
      .select("id")
      .eq("id", id)
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (!data) throw new Error(`${label} must belong to this organization`);
  }

  const scope = input.scope === "self" ? "own" : input.scope;
  const { error: clearError } = await supabase
    .from("member_roles")
    .delete()
    .eq("member_id", input.memberId);
  if (clearError) throw new Error(clearError.message);

  const { data, error } = await supabase
    .from("member_roles")
    .insert({
      member_id: input.memberId,
      role_id: role.id,
      scope,
      site_id: input.siteId ?? null,
      department_id: input.departmentId ?? null,
      business_unit_id: input.businessUnitId ?? null,
      project_id: input.projectId ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    action: "user.role_changed",
    entityType: "member_role",
    entityId: data.id,
    newValues: {
      member_id: input.memberId,
      role_code: roleCode,
      scope,
      site_id: input.siteId,
      business_unit_id: input.businessUnitId,
      project_id: input.projectId,
      department_id: input.departmentId,
    },
  });
  return data;
}
