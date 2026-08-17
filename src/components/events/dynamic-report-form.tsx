"use client";

import { useEffect, useMemo, useState } from "react";
import { createEventAction } from "@/app/actions/events";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ReportTypeCode } from "@/lib/reporting/types";
import { REPORT_TYPE_META } from "@/lib/reporting/types";

type Option = { id: string; name: string };
type CustomField = {
  id: string;
  code: string;
  label: string;
  field_type: string;
  is_required: boolean;
  options?: unknown;
};

const DRAFT_KEY = (type: string) => `ehs360-report-draft:${type}`;

export function DynamicReportForm({
  organizationId,
  eventTypeCode,
  sites,
  projects,
  departments,
  locations,
  severities,
  categories,
  customFields = [],
}: {
  organizationId: string;
  eventTypeCode: ReportTypeCode;
  sites: Option[];
  projects?: Option[];
  departments?: Option[];
  locations?: Option[];
  severities: Option[];
  categories?: Option[];
  customFields?: CustomField[];
}) {
  const meta = REPORT_TYPE_META[eventTypeCode];
  const [draftRestored, setDraftRestored] = useState(false);
  const occurredDefault = useMemo(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY(eventTypeCode));
      if (!raw) return;
      const data = JSON.parse(raw) as Record<string, string>;
      for (const [key, value] of Object.entries(data)) {
        const el = document.querySelector(`[name="${key}"]`) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | HTMLSelectElement
          | null;
        if (el && value) el.value = value;
      }
      setDraftRestored(true);
    } catch {
      /* ignore */
    }
  }, [eventTypeCode]);

  function persistDraft(form: HTMLFormElement) {
    const fd = new FormData(form);
    const obj: Record<string, string> = {};
    fd.forEach((v, k) => {
      if (typeof v === "string" && k !== "organizationId" && k !== "eventTypeCode") {
        obj[k] = v;
      }
    });
    localStorage.setItem(DRAFT_KEY(eventTypeCode), JSON.stringify(obj));
  }

  return (
    <ActionForm
      action={async (fd) => {
        const result = await createEventAction(fd);
        if (result.ok) localStorage.removeItem(DRAFT_KEY(eventTypeCode));
        return result;
      }}
      className="space-y-8"
    >
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="eventTypeCode" value={eventTypeCode} />

      {draftRestored ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Restored unsaved draft for this report type.
        </p>
      ) : null}

      <Section title="1. Event information">
        <Field label="Title" htmlFor="title">
          <Input id="title" name="title" placeholder={`${meta.label} summary`} />
        </Field>
        {(categories?.length ?? 0) > 0 ? (
          <Field label="Category" htmlFor="categoryId">
            <Select id="categoryId" name="categoryId" defaultValue="">
              <option value="">Select category</option>
              {categories!.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field label="Date / time" htmlFor="occurredAt">
          <Input
            id="occurredAt"
            name="occurredAt"
            type="datetime-local"
            defaultValue={occurredDefault}
          />
        </Field>
        {eventTypeCode === "safety_observation" ? (
          <Field label="Observation type" htmlFor="observationPolarity">
            <Select id="observationPolarity" name="observationPolarity" defaultValue="positive">
              <option value="positive">Positive observation</option>
              <option value="negative">Negative / improvement</option>
              <option value="neutral">Neutral</option>
            </Select>
          </Field>
        ) : null}
      </Section>

      <Section title="2. Location">
        <Field label="Site" htmlFor="siteId">
          <Select id="siteId" name="siteId" defaultValue="">
            <option value="">Select site</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        {(projects?.length ?? 0) > 0 ? (
          <Field label="Project" htmlFor="projectId">
            <Select id="projectId" name="projectId" defaultValue="">
              <option value="">Optional</option>
              {projects!.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        {(departments?.length ?? 0) > 0 ? (
          <Field label="Department" htmlFor="departmentId">
            <Select id="departmentId" name="departmentId" defaultValue="">
              <option value="">Optional</option>
              {departments!.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        {(locations?.length ?? 0) > 0 ? (
          <Field label="Location" htmlFor="locationId">
            <Select id="locationId" name="locationId" defaultValue="">
              <option value="">Optional</option>
              {locations!.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
      </Section>

      <Section title="3. People">
        <Field label="People involved" htmlFor="peopleInvolved">
          <Input id="peopleInvolved" name="peopleInvolved" placeholder="Names / roles" />
        </Field>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="isAnonymous" />
          Submit anonymously (where permitted)
        </label>
      </Section>

      <Section title="4. Description">
        <Field label="Description" htmlFor="description" className="md:col-span-2">
          <Textarea
            id="description"
            name="description"
            required
            minLength={8}
            rows={5}
            placeholder="Describe what happened"
          />
        </Field>
      </Section>

      <Section title="5. Consequence / controls">
        {eventTypeCode === "incident" || eventTypeCode === "near_miss" ? (
          <Field label="Equipment / assets" htmlFor="equipmentAssets">
            <Input id="equipmentAssets" name="equipmentAssets" />
          </Field>
        ) : null}
        {eventTypeCode === "hazard" || eventTypeCode === "near_miss" ? (
          <>
            <Field label="Existing control" htmlFor="existingControl">
              <Input id="existingControl" name="existingControl" />
            </Field>
            <Field label="Recommended control" htmlFor="recommendedControl">
              <Input id="recommendedControl" name="recommendedControl" />
            </Field>
          </>
        ) : null}
      </Section>

      <Section title="6. Immediate action">
        <Field label="Immediate action" htmlFor="immediateAction" className="md:col-span-2">
          <Textarea id="immediateAction" name="immediateAction" rows={3} />
        </Field>
      </Section>

      <Section title="7. Severity">
        <Field label="Severity" htmlFor="severityId">
          <Select id="severityId" name="severityId" defaultValue="">
            <option value="">Select</option>
            {severities.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        {eventTypeCode === "near_miss" || eventTypeCode === "incident" ? (
          <Field label="Potential severity" htmlFor="potentialSeverityId">
            <Select id="potentialSeverityId" name="potentialSeverityId" defaultValue="">
              <option value="">Select</option>
              {severities.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="requiresCapa" />
          CAPA required
        </label>
      </Section>

      {customFields.length > 0 ? (
        <Section title="8. Custom fields">
          {customFields.map((field) => (
            <Field key={field.id} label={field.label} htmlFor={`cf_${field.code}`}>
              <input type="hidden" name={`cf_id_${field.code}`} value={field.id} />
              {field.field_type === "long_text" ? (
                <Textarea
                  id={`cf_${field.code}`}
                  name={`cf_${field.code}`}
                  required={field.is_required}
                />
              ) : field.field_type === "boolean" ? (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name={`cf_${field.code}`} />
                  Yes
                </label>
              ) : field.field_type === "number" ? (
                <Input
                  id={`cf_${field.code}`}
                  name={`cf_${field.code}`}
                  type="number"
                  required={field.is_required}
                />
              ) : field.field_type === "date" || field.field_type === "datetime" ? (
                <Input
                  id={`cf_${field.code}`}
                  name={`cf_${field.code}`}
                  type={field.field_type === "date" ? "date" : "datetime-local"}
                  required={field.is_required}
                />
              ) : (
                <Input
                  id={`cf_${field.code}`}
                  name={`cf_${field.code}`}
                  required={field.is_required}
                />
              )}
            </Field>
          ))}
        </Section>
      ) : null}

      <Section title="Investigation">
        <p className="text-sm text-muted-foreground md:col-span-2">
          Investigation workspace opens after submit when severity requires it. Advanced root-cause
          methods arrive in a later phase.
        </p>
      </Section>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            const form = (e.target as HTMLElement).closest("form");
            if (form) persistDraft(form);
          }}
        >
          Save draft locally
        </Button>
        <Button type="submit" name="intent" value="draft" variant="outline">
          Save draft
        </Button>
        <Button type="submit" name="intent" value="submit">
          Submit {meta.label}
        </Button>
      </div>
    </ActionForm>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
