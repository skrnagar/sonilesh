import Link from "next/link";
import {
  Building2,
  CreditCard,
  Database,
  Palette,
  Shield,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { requireOrgAdminAccess } from "@/lib/auth/org-admin";
import { ORG_ADMIN_NAV } from "@/lib/navigation/org-admin";

const ICONS = {
  Building2,
  Palette,
  Users,
  Shield,
  CreditCard,
  Database,
} as const;

const DESCRIPTIONS: Record<string, string> = {
  General: "Company profile, slug, legal details, and custom domain.",
  Branding: "Logo, colors, and terminology for your tenant chrome.",
  Team: "Invite members, assign roles, and manage access status.",
  Access: "System roles and permission matrix (read-only reference).",
  Plan: "Current plan, entitlements, and usage against limits.",
  Data: "Export requests and file upload policy for your organization.",
};

export default async function OrgAdminOverviewPage() {
  const access = await requireOrgAdminAccess();
  const orgName = access.organization.name;

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-8">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Organization admin
        </p>
        <h1 className="font-display text-[length:var(--text-app-title)] font-semibold tracking-tight text-foreground">
          {orgName}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Manage tenant branding, team, plan, and data. Field users work in the field home and My Zone;
          this portal governs the organization that hosts them.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ORG_ADMIN_NAV.map((item) => {
          const Icon = ICONS[item.icon as keyof typeof ICONS];
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex min-h-[8.5rem] flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                </span>
                <ArrowUpRight
                  className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                  aria-hidden
                />
              </div>
              <h2 className="mt-4 font-display text-base font-semibold tracking-tight text-foreground">
                {item.label}
              </h2>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                {DESCRIPTIONS[item.label] ?? "Open this section."}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-5 py-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Related surfaces</p>
        <p className="mt-1">
          Field app:{" "}
          <Link href="/field" className="font-medium text-accent underline-offset-4 hover:underline">
            /field
          </Link>
          {" · "}
          My Zone:{" "}
          <Link href="/field/my-zone" className="font-medium text-accent underline-offset-4 hover:underline">
            /field/my-zone
          </Link>
          {" · "}
          EHS workspace:{" "}
          <Link href="/app/home" className="font-medium text-accent underline-offset-4 hover:underline">
            /app/home
          </Link>
        </p>
      </div>
    </div>
  );
}
