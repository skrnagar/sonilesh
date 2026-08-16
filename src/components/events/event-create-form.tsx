"use client";

import { createEventAction } from "@/app/actions/events";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function EventCreateForm({
  organizationId,
  eventTypeCode,
  sites,
  severities,
}: {
  organizationId: string;
  eventTypeCode: "incident" | "near_miss" | "unsafe_act" | "unsafe_condition" | "hazard";
  sites: Array<{ id: string; name: string }>;
  severities: Array<{ id: string; name: string }>;
}) {
  const occurredDefault = (() => {
    const now = new Date();
    const tz = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    return tz.toISOString().slice(0, 16);
  })();

  return (
    <ActionForm action={createEventAction} className="space-y-4 rounded-lg border border-border bg-card p-5">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="eventTypeCode" value={eventTypeCode} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="Short summary" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="siteId">Site</Label>
          <Select id="siteId" name="siteId" defaultValue="">
            <option value="">Select site</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="severityId">Severity</Label>
          <Select id="severityId" name="severityId" defaultValue="">
            <option value="">Select severity</option>
            {severities.map((severity) => (
              <option key={severity.id} value={severity.id}>
                {severity.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="occurredAt">Date / time</Label>
          <Input
            id="occurredAt"
            name="occurredAt"
            type="datetime-local"
            defaultValue={occurredDefault}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="equipmentAssets">Equipment / assets</Label>
          <Input id="equipmentAssets" name="equipmentAssets" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            required
            minLength={8}
            placeholder="Describe what happened (minimum 8 characters)"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="immediateAction">Immediate action</Label>
          <Textarea id="immediateAction" name="immediateAction" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="intent" value="draft" variant="outline">
          Save draft
        </Button>
        <Button type="submit" name="intent" value="submit">
          Submit
        </Button>
      </div>
    </ActionForm>
  );
}
