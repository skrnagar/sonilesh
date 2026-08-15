import type { SupabaseClient } from "@supabase/supabase-js";
import { requireFeature } from "@/lib/services/entitlements";
import { requirePermission } from "@/lib/services/rbac";
import { createCapa } from "@/lib/services/capa";

export async function createTrainingCourse(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    code: string;
    title: string;
    validityDays?: number;
  },
) {
  await requireFeature(supabase, input.organizationId, "training");
  await requirePermission(supabase, input.organizationId, input.userId, "training.manage");
  const { data, error } = await supabase
    .from("training_courses")
    .insert({
      organization_id: input.organizationId,
      code: input.code,
      title: input.title,
      validity_days: input.validityDays ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function assignTraining(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    courseId: string;
    assigneeId: string;
    dueDate?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "training.manage");
  const { data, error } = await supabase
    .from("training_assignments")
    .insert({
      organization_id: input.organizationId,
      course_id: input.courseId,
      user_id: input.assigneeId,
      due_date: input.dueDate ?? null,
      status: "assigned",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createContractor(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string; name: string },
) {
  await requireFeature(supabase, input.organizationId, "contractor_management");
  await requirePermission(supabase, input.organizationId, input.userId, "contractors.manage");
  const { data, error } = await supabase
    .from("contractor_companies")
    .insert({
      organization_id: input.organizationId,
      name: input.name,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createActionItem(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    title: string;
    description?: string;
    ownerId?: string;
    dueDate?: string;
    priority?: "low" | "medium" | "high" | "critical";
    linkCapa?: boolean;
    sourceModule?: string;
    sourceRecordId?: string;
  },
) {
  await requirePermission(supabase, input.organizationId, input.userId, "actions.manage");

  let capaId: string | null = null;
  if (input.linkCapa) {
    const capa = await createCapa(supabase, {
      organizationId: input.organizationId,
      userId: input.userId,
      sourceModule: "action_item",
      sourceRecordId: input.sourceRecordId ?? crypto.randomUUID(),
      title: input.title,
      description: input.description,
      ownerId: input.ownerId,
      dueDate: input.dueDate,
      priority: input.priority,
    });
    capaId = capa.id;
  }

  const { data, error } = await supabase
    .from("action_items")
    .insert({
      organization_id: input.organizationId,
      title: input.title,
      description: input.description ?? null,
      owner_id: input.ownerId ?? input.userId,
      due_date: input.dueDate ?? null,
      priority: input.priority ?? "medium",
      capa_id: capaId,
      source_module: input.sourceModule ?? null,
      source_record_id: input.sourceRecordId ?? null,
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createToolboxTalk(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    topic: string;
    siteId?: string;
    notes?: string;
  },
) {
  await requireFeature(supabase, input.organizationId, "toolbox_talks");
  await requirePermission(supabase, input.organizationId, input.userId, "toolbox.manage");
  const { data: number, error: numErr } = await supabase.rpc("next_event_number", {
    p_organization_id: input.organizationId,
    p_sequence_key: "toolbox",
    p_prefix: "TBT-",
  });
  if (numErr) throw new Error(numErr.message);

  const { data, error } = await supabase
    .from("toolbox_talks")
    .insert({
      organization_id: input.organizationId,
      talk_number: number as string,
      topic: input.topic,
      site_id: input.siteId ?? null,
      presenter_id: input.userId,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createMoc(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    title: string;
    description?: string;
    siteId?: string;
  },
) {
  await requireFeature(supabase, input.organizationId, "moc");
  await requirePermission(supabase, input.organizationId, input.userId, "moc.manage");
  const { data: number, error: numErr } = await supabase.rpc("next_event_number", {
    p_organization_id: input.organizationId,
    p_sequence_key: "moc",
    p_prefix: "MOC-",
  });
  if (numErr) throw new Error(numErr.message);
  const { data, error } = await supabase
    .from("moc_requests")
    .insert({
      organization_id: input.organizationId,
      moc_number: number as string,
      title: input.title,
      description: input.description ?? null,
      site_id: input.siteId ?? null,
      requester_id: input.userId,
      status: "requested",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}
