import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { getDocumentMetrics } from "@/lib/services/documents";

export default async function FilesHubPage() {
  const access = await requireModuleAccess({
    featureCode: "document_control",
    permission: "documents.view",
  });

  let documentCount = 0;
  if (access.entitled && access.permitted) {
    const metrics = await getDocumentMetrics(access.supabase, access.organization.id);
    documentCount = metrics.total;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Files & Data</h1>
        <p className="text-sm text-muted-foreground">
          Controlled documents, bulk imports, and report exports — isolated from the EHS operations
          workspace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <HubCard
          title="Document control"
          description={`${documentCount} controlled documents`}
          href="/app/documents"
          cta="Open documents"
        />
        <HubCard
          title="Data import"
          description="Bulk load sites, users, and registers"
          href="/app/import"
          cta="Open import"
        />
        <HubCard
          title="Report exports"
          description="Registers, MIS, and compliance exports"
          href="/app/reports/hub"
          cta="Open report hub"
        />
      </div>
    </div>
  );
}

function HubCard({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">{description}</p>
      <Button asChild variant="outline" size="sm" className="mt-4 w-fit">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}
