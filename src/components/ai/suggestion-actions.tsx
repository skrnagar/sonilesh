"use client";

import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { decideAiSuggestionAction } from "@/app/actions/ai";

export function SuggestionDecisionForm({
  suggestionId,
}: {
  suggestionId: string;
}) {
  return (
    <ActionForm action={decideAiSuggestionAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="suggestionId" value={suggestionId} />
      <label className="text-xs text-muted-foreground">
        Note
        <input name="note" className="mt-1 block h-8 rounded-md border border-border bg-card px-2 text-sm" />
      </label>
      <Button name="decision" value="approved" size="sm" type="submit">
        Approve
      </Button>
      <Button name="decision" value="edited" size="sm" variant="secondary" type="submit">
        Edit & apply
      </Button>
      <Button name="decision" value="rejected" size="sm" variant="outline" type="submit">
        Reject
      </Button>
    </ActionForm>
  );
}
