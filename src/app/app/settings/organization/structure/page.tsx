import Link from "next/link";
import { StructureTree } from "@/components/organization/structure-tree";
import { ForbiddenState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import {
  buildStructureTree,
  getOrganizationStructure,
} from "@/lib/services/hierarchy";

export default async function OrganizationStructurePage() {
  const access = await requireModuleAccess({ permission: "settings.manage" });
  if (!access.permitted) return <ForbiddenState />;

  const structure = await getOrganizationStructure(
    access.supabase,
    access.organization.id,
  );
  const tree = buildStructureTree(access.organization.name, structure);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Organization structure</h1>
        <p className="text-sm text-muted-foreground">
          Expand nodes to explore business units, sites, projects, departments, and locations.
        </p>
        <p className="mt-2 text-sm">
        <Link className="underline" href="/org-admin/general">
          ← Organization admin
        </Link>
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 md:p-6">
        {tree.children.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hierarchy yet. Create a business unit or site to get started.
          </p>
        ) : (
          <StructureTree root={tree} />
        )}
      </div>
    </div>
  );
}
