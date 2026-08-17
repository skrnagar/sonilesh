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

type FieldErrors = {
  name?: string;
  email?: string;
  company?: string;
  industry?: string;
};

function FieldMessage({ message }: { message?: string }) {
  return (
    <p className="mkt-field-msg" data-show={message ? "true" : "false"} role={message ? "alert" : undefined}>
      {message || "\u00a0"}
    </p>
  );
}

const selectClass =
  "flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-200 focus-visible:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none";

export function DemoForm({ variant = "demo" }: DemoFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next: FieldErrors = {};
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const company = String(data.get("company") || "").trim();
    const industry = String(data.get("industry") || "").trim();

    if (!name) next.name = "Enter your name.";
    if (!email.includes("@")) next.email = "Enter a work email.";
    if (!company) next.company = "Enter your company.";
    if (!industry) next.industry = "Select an industry.";

    setErrors(next);
    if (Object.keys(next).length) return;
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
        <p className="mkt-body mt-2 text-sm text-muted-foreground">
          Thanks — this form is a front-end placeholder. Connect your CRM or inbox
          handler when ready. For now, reply paths can use the contact channel your
          team configures.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] sm:p-8" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            required
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            onChange={() => setErrors((current) => ({ ...current, name: undefined }))}
          />
          <FieldMessage message={errors.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            onChange={() => setErrors((current) => ({ ...current, email: undefined }))}
          />
          <FieldMessage message={errors.email} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            name="company"
            required
            autoComplete="organization"
            aria-invalid={Boolean(errors.company)}
            onChange={() => setErrors((current) => ({ ...current, company: undefined }))}
          />
          <FieldMessage message={errors.company} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <select
            id="industry"
            name="industry"
            className={selectClass}
            defaultValue=""
            required
            aria-invalid={Boolean(errors.industry)}
            onChange={() => setErrors((current) => ({ ...current, industry: undefined }))}
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
          <FieldMessage message={errors.industry} />
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
