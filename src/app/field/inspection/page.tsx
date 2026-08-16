import { requireOrgContext } from "@/lib/auth/org-context";
import { canFieldAction } from "@/lib/auth/field-roles";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { submitFieldInspectionAction } from "@/app/actions/field";
import { InspectionRunner } from "@/components/field/inspection-runner";
import { FieldEmpty, FieldPageHeader } from "@/components/field/field-ui";
import { ForbiddenState } from "@/components/shared/state-panels";

export default async function FieldInspectionPage() {
  const { supabase, user, organization, membershipId } = await requireOrgContext();
  const role = await resolveFieldRole(supabase, membershipId);
  if (!canFieldAction(role, "inspection")) return <ForbiddenState />;

  const { data: assignments, error } = await supabase
    .from("checklist_assignments")
    .select("id, assignment_number, title, status, template_id, scheduled_for")
    .eq("organization_id", organization.id)
    .eq("checklist_type", "inspection")
    .eq("assignee_id", user.id)
    .in("status", ["scheduled", "assigned", "in_progress"])
    .is("deleted_at", null)
    .order("scheduled_for", { ascending: true })
    .limit(10);

  if (error) {
    return (
      <div className="space-y-4">
        <FieldPageHeader title="Inspection" subtitle="Assigned checklists for this site." />
        <FieldEmpty text={error.message} />
      </div>
    );
  }

  const current = assignments?.[0];
  if (!current) {
    return (
      <div className="space-y-4">
        <FieldPageHeader title="Inspection" subtitle="Assigned checklists for this site." />
        <FieldEmpty text="No open inspections assigned to you." />
      </div>
    );
  }

  const { data: sections } = await supabase
    .from("checklist_sections")
    .select("id, title, sort_order")
    .eq("template_id", current.template_id)
    .eq("organization_id", organization.id)
    .order("sort_order", { ascending: true });

  const sectionIds = (sections ?? []).map((s) => s.id);
  const { data: questions } = sectionIds.length
    ? await supabase
        .from("checklist_questions")
        .select("id, prompt, question_type, is_required, sort_order, section_id")
        .in("section_id", sectionIds)
        .eq("organization_id", organization.id)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const { data: template } = await supabase
    .from("checklist_templates")
    .select("auto_capa_on_fail")
    .eq("id", current.template_id)
    .maybeSingle();

  const mapped = (questions ?? []).map((q) => ({
    id: q.id,
    prompt: q.prompt,
    questionType: q.question_type,
    isRequired: q.is_required,
    autoCapa: Boolean(template?.auto_capa_on_fail),
  }));

  return (
    <div className="space-y-4">
      <FieldPageHeader
        title="Inspection"
        subtitle={`${current.assignment_number} · ${current.status.replaceAll("_", " ")}`}
      />
      {mapped.length ? (
        <InspectionRunner
          assignmentId={current.id}
          title={current.title}
          questions={mapped}
          action={submitFieldInspectionAction}
        />
      ) : (
        <FieldEmpty text="This checklist has no questions yet. Ask EHS to publish a template." />
      )}
    </div>
  );
}
