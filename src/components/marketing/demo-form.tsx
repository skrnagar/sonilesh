"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { industries } from "@/lib/marketing/content";

type DemoFormProps = {
  variant?: "demo" | "contact";
};

export function DemoForm({ variant = "demo" }: DemoFormProps) {
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") || "");
    if (!email.includes("@")) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] sm:p-8"
        role="status"
        aria-live="polite"
      >
        <p className="text-lg font-semibold text-primary">Request received</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Thanks — this form is a front-end placeholder. Connect your CRM or inbox
          handler when ready. For now, reply paths can use the contact channel your
          team configures.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" required autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" required autoComplete="organization" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <select
            id="industry"
            name="industry"
            className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue=""
            required
          >
            <option value="" disabled>
              Select industry
            </option>
            {industries.map((i) => (
              <option key={i.slug} value={i.name}>
                {i.name}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      {variant === "demo" ? (
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input id="role" name="role" placeholder="HSE Manager, COO, Project Director…" />
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="message">
          {variant === "demo" ? "What should we focus on?" : "Message"}
        </Label>
        <Textarea
          id="message"
          name="message"
          rows={4}
          placeholder={
            variant === "demo"
              ? "Sites in scope, modules of interest, timeline…"
              : "How can we help?"
          }
        />
      </div>
      <Button type="submit" size="lg" className="w-full sm:w-auto">
        {variant === "demo" ? "Request demo" : "Send message"}
      </Button>
    </form>
  );
}
