"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireOrgContext } from "@/lib/auth/org-context";
import { createEhsEvent } from "@/lib/services/events";
import { createLmraFromFieldEvent } from "@/lib/services/lmra";
import { transitionCapa, type CapaStatus } from "@/lib/services/capa";
import { recordResponse } from "@/lib/services/checklists";
import { transitionPermit, requestPermitRenewal, createPermit } from "@/lib/services/permits";
import { notifySiteSupervisors } from "@/lib/services/notifications";
import { requireFeature } from "@/lib/services/entitlements";
import { createToolboxTalk } from "@/lib/services/supporting";
import { createSiteVisit, transitionSiteVisit } from "@/lib/services/site-visits";
import { formatSupabaseUserError } from "@/lib/supabase/errors";
import { assertOrgScopedStoragePath, sanitizeAttachmentName } from "@/lib/services/attachments";

type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function persistMedia(
  supabase: SupabaseClient,
  organizationId: string,
  folder: string,
  formData: FormData,
) {
  const existingPath = String(formData.get("storage_path") || "").trim();
  if (existingPath) {
    const storagePath = assertOrgScopedStoragePath(organizationId, existingPath);
    const fileName = sanitizeAttachmentName(String(formData.get("file_name") || "capture.jpg"));
    return {
      storagePath,
      fileName,
      mimeType: String(formData.get("mime_type") || "application/octet-stream"),
      fileSize: Number(formData.get("file_size") || 0) || null,
      uploaded: true,
    };
  }

  const fileEntry =
    formData.getAll("media").find((v) => v instanceof File && v.size > 0) ??
    formData.getAll("media_camera").find((v) => v instanceof File && v.size > 0) ??
    formData.getAll("media_gallery").find((v) => v instanceof File && v.size > 0) ??
    formData.get("file");
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
  if (!file) return null;
  const safeName = sanitizeAttachmentName(file.name);
  const storagePath = `${organizationId}/${folder}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from("ehs-attachments").upload(storagePath, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  return {
    storagePath: error ? `unuploaded/${storagePath}` : storagePath,
    fileName: safeName,
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
    uploaded: !error,
  };
}

function revalidateField() {
  revalidatePath("/field");
  revalidatePath("/field/ualist");
  revalidatePath("/field/ua-uc");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/incidents");
  revalidatePath("/app/observations");
}

function revalidateFieldSiteVisits(visitId?: string) {
  revalidatePath("/field/site-visits");
  revalidatePath("/app/site-visits");
  if (visitId) {
    revalidatePath(`/field/site-visits/${visitId}`);
    revalidatePath(`/app/site-visits/${visitId}`);
  }
}

async function resolveFieldSiteId(
  supabase: SupabaseClient,
  organizationId: string,
  preferred?: string | null,
) {
  const fromForm = preferred?.trim() || "";
  if (fromForm) {
    const { data } = await supabase
      .from("sites")
      .select("id")
      .eq("id", fromForm)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .maybeSingle();
    if (data?.id) return data.id;
  }
  const { data: fallback } = await supabase
    .from("sites")
    .select("id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("name")
    .limit(1)
    .maybeSingle();
  return fallback?.id ?? undefined;
}

export async function submitFieldReportAction(formData: FormData): Promise<ActionResult> {
  try {
    const {
      supabase,
      user,
      organization,
      siteId,
      projectId,
      businessUnitId: workspaceBusinessUnitId,
    } = await requireOrgContext();
    const mode = String(formData.get("mode") || "incident");
    const intent = String(formData.get("intent") || "submit");
    const description = String(formData.get("description") || "").trim();
    if (!description) return { ok: false, error: "Description required" };
    if (description.length < 8) {
      return { ok: false, error: "Description must be at least 8 characters" };
    }

    const typeParam = String(formData.get("type") || formData.get("category") || "");
    const reportKind = String(formData.get("report_kind") || "");
    let eventTypeCode =
      mode === "uauc"
        ? ["unsafe_act", "unsafe_condition", "safety_observation"].includes(typeParam)
          ? typeParam
          : "unsafe_act"
        : mode === "near-miss" || mode === "near_miss"
        ? "near_miss"
        : mode === "hazard" || mode === "lmra" || mode === "observation"
          ? ["unsafe_act", "unsafe_condition", "hazard", "safety_observation"].includes(typeParam)
            ? typeParam
            : "hazard"
          : ["unsafe_act", "unsafe_condition", "hazard", "safety_observation"].includes(mode)
            ? mode
            : "incident";

    // Incident form classification can create UA / UC via shared engine.
    if (
      eventTypeCode === "incident" &&
      (reportKind === "unsafe_act" || reportKind === "unsafe_condition")
    ) {
      eventTypeCode = reportKind;
    }

    if (
      ![
        "incident",
        "near_miss",
        "unsafe_act",
        "unsafe_condition",
        "hazard",
        "safety_observation",
      ].includes(eventTypeCode)
    ) {
      return { ok: false, error: `Unsupported report type: ${eventTypeCode}` };
    }

    const gps = String(formData.get("gps") || formData.get("location_text") || "");
    const locationText = String(formData.get("location_text") || "").trim();
    const subcategory = String(formData.get("subcategory") || "").trim();
    const businessUnitId =
      String(formData.get("businessUnitId") || "") || workspaceBusinessUnitId || undefined;
    const formProjectId = String(formData.get("projectId") || "") || projectId || undefined;
    const latRaw = String(formData.get("latitude") || "");
    const lngRaw = String(formData.get("longitude") || "");
    const immediate = String(formData.get("immediate_action") || "");
    const people = String(formData.get("people") || "");
    const severityId = String(formData.get("severityId") || "") || undefined;
    const potentialSeverityId = String(formData.get("potentialSeverityId") || "") || undefined;
    const categoryId = String(formData.get("categoryId") || "") || undefined;
    const resolvedSiteId = await resolveFieldSiteId(
      supabase,
      organization.id,
      String(formData.get("siteId") || "") || siteId,
    );

    if (
      (intent === "submit" || intent === "true") &&
      (eventTypeCode === "incident" || eventTypeCode === "near_miss") &&
      !resolvedSiteId
    ) {
      return { ok: false, error: "Site is required — select a site or set workspace site" };
    }
    if (
      (intent === "submit" || intent === "true") &&
      eventTypeCode === "incident" &&
      !severityId &&
      reportKind !== "unsafe_act" &&
      reportKind !== "unsafe_condition"
    ) {
      return { ok: false, error: "Severity is required (includes LTI and Fatal)" };
    }

    const created = await createEhsEvent(supabase, {
      organizationId: organization.id,
      userId: user.id,
      eventTypeCode,
      description:
        mode === "uauc"
          ? description
          : [
              description,
              gps ? `GPS/Location: ${gps}` : null,
              people ? `People involved: ${people}` : null,
              formData.get("risk_level") ? `Risk level: ${formData.get("risk_level")}` : null,
            ]
              .filter(Boolean)
              .join("\n"),
      title: description.slice(0, 80),
      immediateAction: immediate || undefined,
      occurredAt: String(formData.get("occurred_at") || new Date().toISOString()),
      submit: intent === "submit" || intent === "true",
      siteId: resolvedSiteId,
      projectId: formProjectId,
      businessUnitId,
      severityId,
      potentialSeverityId,
      categoryId:
        eventTypeCode === "incident" ||
        eventTypeCode === "near_miss" ||
        eventTypeCode === "hazard" ||
        eventTypeCode === "unsafe_act" ||
        eventTypeCode === "unsafe_condition" ||
        eventTypeCode === "safety_observation"
          ? categoryId
          : undefined,
      source: "field",
      latitude: latRaw ? Number(latRaw) : null,
      longitude: lngRaw ? Number(lngRaw) : null,
      observationPolarity:
        eventTypeCode === "safety_observation"
          ? String(formData.get("observation_polarity") || "positive") === "negative"
            ? "negative"
            : "positive"
          : null,
      peopleInvolved: people || undefined,
    });

    const event = "event" in created ? created.event : created;
    const noAttachments = String(formData.get("no_attachments") || "") === "true";
    const media = noAttachments
      ? null
      : await persistMedia(supabase, organization.id, `events/${event.id}`, formData);

    const metadataPatch: Record<string, unknown> = {
      ...(typeof event.metadata === "object" && event.metadata ? event.metadata : {}),
      field_capture: true,
    };
    if (locationText) metadataPatch.location_text = locationText;
    if (subcategory) metadataPatch.subcategory = subcategory;
    if (gps) metadataPatch.gps = gps;

    if (media) {
      await supabase.from("ehs_event_attachments").insert({
        organization_id: organization.id,
        event_id: event.id,
        storage_path: media.storagePath,
        file_name: media.fileName,
        mime_type: media.mimeType,
        file_size: media.fileSize,
        kind: media.mimeType.startsWith("video/") ? "video" : "photo",
        created_by: user.id,
      });
      await supabase
        .from("ehs_events")
        .update({
          metadata: {
            ...metadataPatch,
            photo: media.fileName,
            photo_uploaded: media.uploaded,
          },
        })
        .eq("id", event.id)
        .eq("organization_id", organization.id);
    } else if (mode === "uauc" || locationText || subcategory || gps) {
      await supabase
        .from("ehs_events")
        .update({ metadata: metadataPatch })
        .eq("id", event.id)
        .eq("organization_id", organization.id);
    }

    if (mode === "lmra") {
      try {
        await createLmraFromFieldEvent(supabase, {
          organizationId: organization.id,
          userId: user.id,
          activityDescription: description,
          siteId: resolvedSiteId,
          projectId: projectId || undefined,
          risks: [{ text: String(formData.get("risks") || description) }],
          controls: [{ text: String(formData.get("controls") || immediate || "") }],
          immediateAction: immediate || undefined,
        });
        revalidatePath("/app/lmra");
      } catch (lmraErr) {
        console.error("[field/lmra] assessment record failed", lmraErr);
      }
    }

    revalidateField();
    return { ok: true, id: event.id };
  } catch (e) {
    return { ok: false, error: formatSupabaseUserError(e) };
  }
}

export async function completeFieldCapaAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const capaId = String(formData.get("capaId") || "");
    const evidenceNote = String(formData.get("evidence") || "");
    const comment = String(formData.get("comment") || "");
    if (!capaId) return { ok: false, error: "Missing CAPA" };

    const media = await persistMedia(supabase, organization.id, `capa/${capaId}`, formData);
    const evidence = [evidenceNote, comment, media ? `Photo: ${media.fileName}` : null]
      .filter(Boolean)
      .join("\n");

    const { data: current } = await supabase
      .from("capa_items")
      .select("status")
      .eq("id", capaId)
      .eq("organization_id", organization.id)
      .maybeSingle();
    if (!current) return { ok: false, error: "CAPA not found" };

    if (current.status === "open") {
      await transitionCapa(supabase, {
        organizationId: organization.id,
        userId: user.id,
        capaId,
        toStatus: "in_progress",
        notes: "Started from field",
      });
    }

    const afterOpen = current.status === "open" ? "in_progress" : (current.status as CapaStatus);
    if (afterOpen === "in_progress") {
      await transitionCapa(supabase, {
        organizationId: organization.id,
        userId: user.id,
        capaId,
        toStatus: "pending_verification",
        evidence: evidence || undefined,
        notes: comment,
      });
    } else {
      return { ok: false, error: `CAPA cannot be completed from ${current.status}` };
    }

    revalidateField();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatSupabaseUserError(e) };
  }
}

export async function completeFieldActionItemAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const actionId = String(formData.get("actionId") || "");
    if (!actionId) return { ok: false, error: "Missing action" };
    const evidence = String(formData.get("evidence") || "");
    const { error } = await supabase
      .from("action_items")
      .update({
        status: "completed",
        evidence: evidence || null,
      })
      .eq("id", actionId)
      .eq("organization_id", organization.id)
      .eq("owner_id", user.id);
    if (error) throw new Error(error.message);
    revalidateField();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatSupabaseUserError(e) };
  }
}

export async function submitFieldInspectionAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const assignmentId = String(formData.get("assignmentId") || "");
    if (!assignmentId) return { ok: false, error: "Missing assignment" };
    const signature = String(formData.get("signature") || user.email || "");
    const answers = JSON.parse(String(formData.get("answers") || "{}")) as Record<string, string>;
    const media = await persistMedia(supabase, organization.id, `inspections/${assignmentId}`, formData);

    const { data: assignment } = await supabase
      .from("checklist_assignments")
      .select("id, template_id, status")
      .eq("id", assignmentId)
      .eq("organization_id", organization.id)
      .maybeSingle();
    if (!assignment) return { ok: false, error: "Inspection not found" };

    const { data: template } = await supabase
      .from("checklist_templates")
      .select("auto_capa_on_fail")
      .eq("id", assignment.template_id)
      .maybeSingle();

    const questionIds = Object.keys(answers);
    for (const questionId of questionIds) {
      const value = answers[questionId];
      const comment = String(formData.get(`comment_${questionId}`) || "");
      const isNa = value === "na";
      const isFailing = value === "fail";
      await recordResponse(supabase, {
        organizationId: organization.id,
        userId: user.id,
        assignmentId,
        questionId,
        valueText: value,
        isNa,
        comment: comment || undefined,
        photoUrl: media?.storagePath,
        storagePath: media?.storagePath,
        signatureName: signature || undefined,
        score: isNa ? 0 : isFailing ? 0 : 1,
        isFailing,
        autoCapa: Boolean(template?.auto_capa_on_fail) && isFailing,
        findingTitle: isFailing ? "Field inspection fail" : undefined,
        checklistType: "inspection",
      });
    }

    const { completeAssignment } = await import("@/lib/services/checklists");
    await completeAssignment(supabase, {
      organizationId: organization.id,
      userId: user.id,
      assignmentId,
    });

    revalidateField();
    return { ok: true, id: assignmentId };
  } catch (e) {
    return { ok: false, error: formatSupabaseUserError(e) };
  }
}

export async function approveFieldPermitAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const permitId = String(formData.get("permitId") || "");
    if (!permitId) return { ok: false, error: "Missing permit" };
    await transitionPermit(supabase, {
      organizationId: organization.id,
      userId: user.id,
      permitId,
      toStatus: "active",
      signatureName: String(formData.get("signature") || user.email),
    });
    revalidateField();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatSupabaseUserError(e) };
  }
}

export async function acknowledgeFieldPermitAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const permitId = String(formData.get("permitId") || "");
    if (!permitId) return { ok: false, error: "Missing permit" };
    const signature = String(formData.get("signature") || user.email || "");
    const { error } = await supabase.from("permit_approvals").insert({
      organization_id: organization.id,
      permit_id: permitId,
      approver_role: "field_ack",
      approver_id: user.id,
      status: "approved",
      signature_name: signature,
      signed_at: new Date().toISOString(),
      comments: "Field acknowledgement",
    });
    if (error) throw new Error(error.message);
    revalidateField();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatSupabaseUserError(e) };
  }
}

export async function completeFieldTrainingAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    await requireFeature(supabase, organization.id, "training");
    const assignmentId = String(formData.get("assignmentId") || "");
    if (!assignmentId) return { ok: false, error: "Missing assignment" };
    const intent = String(formData.get("intent") || "complete");
    const completedAt = new Date().toISOString();
    const { error } = await supabase
      .from("training_assignments")
      .update(
        intent === "start"
          ? { status: "in_progress" }
          : {
              status: "completed",
              completed_at: completedAt,
            },
      )
      .eq("id", assignmentId)
      .eq("organization_id", organization.id)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
    revalidateField();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatSupabaseUserError(e) };
  }
}

export async function requestFieldPermitRenewalAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const permitId = String(formData.get("permitId") || "");
    if (!permitId) return { ok: false, error: "Missing permit" };
    const renewal = await requestPermitRenewal(supabase, {
      organizationId: organization.id,
      userId: user.id,
      permitId,
    });
    try {
      await notifySiteSupervisors(supabase, {
        organizationId: organization.id,
        siteId: renewal.site_id,
        actorUserId: user.id,
        eventKey: "permit.renewal_requested",
        title: "Permit renewal requested",
        body: renewal.permit_number,
        link: `/app/permits/${renewal.id}`,
      });
    } catch {
      /* non-blocking */
    }
    revalidateField();
    return { ok: true, id: renewal.id };
  } catch (e) {
    return { ok: false, error: formatSupabaseUserError(e) };
  }
}

export async function createFieldPermitAction(formData: FormData): Promise<ActionResult & { href?: string }> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const row = await createPermit(supabase, {
      organizationId: organization.id,
      userId: user.id,
      permitTypeCode: String(formData.get("permitTypeCode") || "general_work"),
      title: String(formData.get("title") || "").trim(),
      workDescription: String(formData.get("workDescription") || ""),
      siteId: String(formData.get("siteId") || "") || undefined,
      asDraft: false,
    });
    revalidatePath("/field/permits");
    revalidatePath("/app/permits");
    return { ok: true, id: row.id, href: `/field/permits/${encodeURIComponent(row.permit_number)}` };
  } catch (e) {
    return { ok: false, error: formatSupabaseUserError(e) };
  }
}

export async function createFieldSiteVisitAction(
  formData: FormData,
): Promise<ActionResult & { href?: string }> {
  try {
    const { supabase, user, organization, siteId, projectId } = await requireOrgContext();
    const visitType = String(formData.get("visitType") || "tsv") as "hsv" | "rsv" | "tsv";
    const summary = String(formData.get("summary") || "").trim();
    if (summary.length < 8) {
      return { ok: false, error: "Summary must be at least 8 characters" };
    }
    const row = await createSiteVisit(supabase, {
      organizationId: organization.id,
      userId: user.id,
      visitType,
      summary,
      siteId: String(formData.get("siteId") || "") || siteId || null,
      projectId: projectId || null,
      submit: formData.get("submit") === "true",
    });
    revalidateFieldSiteVisits(row.id);
    return { ok: true, id: row.id, href: `/field/site-visits/${row.id}` };
  } catch (e) {
    return { ok: false, error: formatSupabaseUserError(e) };
  }
}

export async function transitionFieldSiteVisitAction(
  formData: FormData,
): Promise<ActionResult & { href?: string }> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const visitId = String(formData.get("visitId") || "");
    const toStatus = String(formData.get("toStatus") || "") as
      | "submitted"
      | "allocated"
      | "closed"
      | "final_closed"
      | "cancelled";
    if (!visitId) return { ok: false, error: "Missing visit" };
    await transitionSiteVisit(supabase, {
      organizationId: organization.id,
      userId: user.id,
      visitId,
      toStatus,
      assignedTo: String(formData.get("assignedTo") || "") || null,
      note: String(formData.get("note") || "") || undefined,
    });
    revalidateFieldSiteVisits(visitId);
    return { ok: true, href: `/field/site-visits/${visitId}` };
  } catch (e) {
    return { ok: false, error: formatSupabaseUserError(e) };
  }
}

export async function createFieldToolboxAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const topic = String(formData.get("topic") || "").trim();
    if (!topic) return { ok: false, error: "Topic required" };
    const talk = await createToolboxTalk(supabase, {
      organizationId: organization.id,
      userId: user.id,
      topic,
      notes: String(formData.get("notes") || "") || undefined,
    });
    revalidateField();
    return { ok: true, id: talk.id };
  } catch (e) {
    return { ok: false, error: formatSupabaseUserError(e) };
  }
}
