"use client";

import { useState } from "react";
import { createApiKeyAction } from "@/app/actions/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateApiKeyForm() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setToken(null);
    const result = await createApiKeyAction(new FormData(e.currentTarget));
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setToken(result.id ?? null);
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required placeholder="Reporting integration" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="scopes">Scopes (comma-separated)</Label>
        <Input id="scopes" name="scopes" defaultValue="incidents.read,capa.read,sites.read" />
      </div>
      <Button type="submit" disabled={pending}>
        Create key
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {token ? (
        <p className="break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">
          Copy now — this value is not stored: {token}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">The plaintext token is shown once.</p>
      )}
    </form>
  );
}
