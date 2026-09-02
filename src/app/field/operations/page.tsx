import { requireOrgContext } from "@/lib/auth/org-context";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { filterEhsOperationsForField } from "@/lib/navigation/ehs-operations-launchpad";
import { EhsOperationsLaunchpad } from "@/components/field/myzone-launchpad";

export default async function FieldOperationsPage() {
  const { supabase, membershipId } = await requireOrgContext();
  const role = await resolveFieldRole(supabase, membershipId);
  const tiles = filterEhsOperationsForField(role);

  return <EhsOperationsLaunchpad tiles={tiles} />;
}
