"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { adminUpdateOrgStatusAction } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

export type AdminOrgRow = {
  id: string;
  name: string;
  industry: string | null;
  status: string;
  created_at: string;
  last_activity_at: string | null;
  users: number;
  sites: number;
  planName: string;
  subscriptionStatus: string;
  mrrCents: number;
};

const COLUMNS = [
  { id: "company", label: "Organization" },
  { id: "industry", label: "Industry" },
  { id: "plan", label: "Plan" },
  { id: "subscription", label: "Subscription" },
  { id: "users", label: "Users" },
  { id: "sites", label: "Sites" },
  { id: "mrr", label: "MRR" },
  { id: "created", label: "Created" },
  { id: "activity", label: "Last activity" },
  { id: "status", label: "Status" },
] as const;

export function OrganizationsTable({
  orgs,
  canManage,
}: {
  orgs: AdminOrgRow[];
  canManage: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<"created" | "name" | "mrr">("created");
  const [page, setPage] = useState(0);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const pageSize = 20;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = orgs.filter((org) => {
      if (status !== "all" && org.status !== status) return false;
      if (!q) return true;
      return (
        org.name.toLowerCase().includes(q) ||
        (org.industry ?? "").toLowerCase().includes(q) ||
        org.planName.toLowerCase().includes(q)
      );
    });
    rows.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "mrr") return b.mrrCents - a.mrrCents;
      return b.created_at.localeCompare(a.created_at);
    });
    return rows;
  }, [orgs, query, status, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const slice = filtered.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Search organization, industry, plan"
          className="max-w-sm"
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
        >
          <option value="all">All statuses</option>
          {["trial", "active", "suspended", "cancelled", "archived"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="created">Sort: created</option>
          <option value="name">Sort: name</option>
          <option value="mrr">Sort: MRR</option>
        </Select>
        <div className="ml-auto flex flex-wrap gap-1 text-[11px] text-muted-foreground">
          {COLUMNS.map((col) => (
            <label key={col.id} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={!hidden[col.id]}
                onChange={() =>
                  setHidden((prev) => ({ ...prev, [col.id]: !prev[col.id] }))
                }
              />
              {col.label}
            </label>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {COLUMNS.filter((col) => !hidden[col.id]).map((col) => (
                <th key={col.id} className="px-3 py-2.5 font-medium">
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((org) => (
              <tr key={org.id} className="border-t border-border">
                {!hidden.company ? (
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/organizations/${org.id}`} className="font-medium text-accent">
                      {org.name}
                    </Link>
                  </td>
                ) : null}
                {!hidden.industry ? <td className="px-3 py-2.5">{org.industry ?? "—"}</td> : null}
                {!hidden.plan ? <td className="px-3 py-2.5">{org.planName}</td> : null}
                {!hidden.subscription ? (
                  <td className="px-3 py-2.5 capitalize">{org.subscriptionStatus}</td>
                ) : null}
                {!hidden.users ? <td className="px-3 py-2.5 tabular-nums">{org.users}</td> : null}
                {!hidden.sites ? <td className="px-3 py-2.5 tabular-nums">{org.sites}</td> : null}
                {!hidden.mrr ? (
                  <td className="px-3 py-2.5 tabular-nums">
                    ${(org.mrrCents / 100).toFixed(0)}
                  </td>
                ) : null}
                {!hidden.created ? (
                  <td className="px-3 py-2.5 tabular-nums">{formatDate(org.created_at)}</td>
                ) : null}
                {!hidden.activity ? (
                  <td className="px-3 py-2.5 tabular-nums">{formatDate(org.last_activity_at)}</td>
                ) : null}
                {!hidden.status ? (
                  <td className="px-3 py-2.5">
                    <Badge variant="secondary" className="capitalize">
                      {org.status}
                    </Badge>
                  </td>
                ) : null}
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/organizations/${org.id}`}>View</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/organizations/${org.id}?tab=subscription`}>Change plan</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/organizations/${org.id}?tab=features`}>Features</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/organizations/${org.id}?tab=usage`}>Usage</Link>
                    </Button>
                    {canManage ? (
                      <form action={adminUpdateOrgStatusAction}>
                        <input type="hidden" name="organizationId" value={org.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={org.status === "suspended" ? "active" : "suspended"}
                        />
                        <input
                          type="hidden"
                          name="reason"
                          value={org.status === "suspended" ? "Reactivated from list" : "Suspended from list"}
                        />
                        <Button type="submit" size="sm" variant="outline">
                          {org.status === "suspended" ? "Reactivate" : "Suspend"}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!slice.length ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No organizations match filters.</p>
        ) : null}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {filtered.length} organizations · page {page + 1} / {pages}
        </span>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page + 1 >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
