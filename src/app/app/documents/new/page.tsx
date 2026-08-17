import Link from "next/link";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { createDocumentAction } from "@/app/actions/documents";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listDocumentClassifications, listDocumentTypes } from "@/lib/services/documents";

export default async function NewDocumentPage() {
  const access = await requireModuleAccess({
    featureCode: "document_control",
    permission: "documents.manage",
  });
  if (!access.entitled) return <UpgradeState featureName="Document control" />;
  if (!access.permitted) return <ForbiddenState />;

  const [types, classes] = await Promise.all([
    listDocumentTypes(access.supabase, access.organization.id),
    listDocumentClassifications(access.supabase, access.organization.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">New controlled document</h1>
          <p className="text-sm text-muted-foreground">Draft first. Upload a version, then approve and publish.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/documents">Cancel</Link>
        </Button>
      </div>
      <ActionForm action={createDocumentAction} className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="space-y-1">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="docNumber">Number (optional)</Label>
            <Input id="docNumber" name="docNumber" placeholder="Auto DOC-" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tags">Tags</Label>
            <Input id="tags" name="tags" placeholder="comma separated" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="documentTypeId">Type</Label>
            <Select id="documentTypeId" name="documentTypeId">
              <option value="">—</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="classificationId">Classification</Label>
            <Select id="classificationId" name="classificationId">
              <option value="">—</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="expiresOn">Expires</Label>
            <Input id="expiresOn" name="expiresOn" type="date" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="reviewDueOn">Review due</Label>
            <Input id="reviewDueOn" name="reviewDueOn" type="date" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="acknowledgementRequired" />
          Acknowledgement required
        </label>
        <div className="space-y-1">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" />
        </div>
        <Button type="submit">Create draft</Button>
      </ActionForm>
    </div>
  );
}
