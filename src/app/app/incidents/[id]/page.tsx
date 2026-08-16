import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createCapaAction,
  transitionEventAction,
} from "@/app/actions/events";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { getEventBundle } from "@/lib/events/queries";
import { formatDate } from "@/lib/utils";

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireModuleAccess({
    featureCode: "incident_management",
    permission: "incidents.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Incidents" />;
  if (!access.permitted) return <ForbiddenState />;

  const bundle = await getEventBundle(
    access.supabase,
    access.organization.id,
    id,
  );
  if (!bundle) notFound();

  const { event, activity, capas, investigation } = bundle;
  const duplicates = (event.metadata as { possible_duplicates?: string[] } | null)
    ?.possible_duplicates;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Incident</p>
          <h1 className="text-xl font-semibold text-primary">{event.event_number}</h1>
          <p className="text-sm text-muted-foreground">{event.title || "Untitled incident"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {event.status}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/incidents/${event.id}/investigation`}>Investigation</Link>
          </Button>
        </div>
      </div>

      {duplicates?.length ? (
        <div className="border border-warning/40 bg-[var(--warning-soft)] px-4 py-3 text-sm text-[var(--warning-ink)]">
          Possible duplicate warning: {duplicates.length} similar event(s) found near this
          time/location/type. Review before continuing.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-4 border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Details</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Occurred</dt>
              <dd>{formatDate(event.occurred_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Site</dt>
              <dd>{(event.sites as { name?: string } | null)?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Severity</dt>
              <dd>{(event.severity_levels as { name?: string } | null)?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Investigation required</dt>
              <dd>{event.investigation_required ? "Yes" : "No"}</dd>
            </div>
          </dl>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{event.description}</p>
          </div>
          {event.immediate_action ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Immediate action
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{event.immediate_action}</p>
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          <div className="border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Workflow</h2>
            <form action={transitionEventAction} className="mt-3 space-y-3">
              <input type="hidden" name="organizationId" value={access.organization.id} />
              <input type="hidden" name="eventId" value={event.id} />
              <div className="space-y-2">
                <Label htmlFor="toStatus">Transition to</Label>
                <select
                  id="toStatus"
                  name="toStatus"
                  className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
                  defaultValue="triage"
                >
                  {[
                    "submitted",
                    "triage",
                    "investigation",
                    "capa",
                    "verification",
                    "approval",
                    "closed",
                    "reopened",
                  ].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note / justification</Label>
                <Textarea id="note" name="note" />
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" name="acceptNoActionRequired" value="true" />
                Accept No Action Required for unresolved required CAPA (EHS Manager)
              </label>
              <Button type="submit" className="w-full">
                Apply transition
              </Button>
            </form>
          </div>

          <div className="border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Add CAPA</h2>
            <form action={createCapaAction} className="mt-3 space-y-3">
              <input type="hidden" name="organizationId" value={access.organization.id} />
              <input type="hidden" name="eventId" value={event.id} />
              <Input name="title" placeholder="CAPA title" required />
              <Textarea name="description" placeholder="Description" />
              <Input name="dueDate" type="date" />
              <Button type="submit" variant="outline" className="w-full">
                Create CAPA
              </Button>
            </form>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">CAPA items</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {capas.map((capa) => (
              <li key={capa.id} className="flex items-center justify-between border-b border-border py-2">
                <span>{capa.title}</span>
                <Badge variant="outline" className="capitalize">
                  {capa.status}
                </Badge>
              </li>
            ))}
            {!capas.length ? (
              <li className="text-muted-foreground">No CAPA linked yet.</li>
            ) : null}
          </ul>
        </section>
        <section className="border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Activity history</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {activity.map((item) => (
              <li key={item.id} className="border-b border-border py-2">
                <p>{item.message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(item.created_at)} · {item.activity_type}
                </p>
              </li>
            ))}
          </ul>
          {investigation ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Investigation on file ({investigation.status}
              {investigation.method ? ` · ${investigation.method}` : ""}).
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
