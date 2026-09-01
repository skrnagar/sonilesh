import Link from "next/link";
import { Bell, ClipboardList } from "lucide-react";
import { FieldScaffoldPage } from "@/components/field/field-scaffold-page";
import { FieldActionLink } from "@/components/field/field-ui";

export default function FieldUtilitiesPage() {
  return (
    <div className="space-y-4">
      <FieldScaffoldPage
        title="Utilities"
        subtitle="Org tools and reference data."
        action="utilities"
        body="Bulk utilities, reference data, and admin tools are managed on desktop. Field users can continue reporting and inspections from the launchpad."
        webHref="/app/settings"
        webLabel="Open settings"
      />
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          My zone shortcuts
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <FieldActionLink
            href="/field/actions"
            label="Allocated Action List"
            hint="View and update your assigned actions"
            icon={ClipboardList}
            tone="navy"
            prefetch={false}
          />
          <FieldActionLink
            href="/field/notifications"
            label="Notifications"
            hint="Alerts and inbox messages"
            icon={Bell}
            tone="green"
            prefetch={false}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Or open{" "}
          <Link href="/field/actions" className="font-medium text-primary underline-offset-2 hover:underline">
            Allocated Action List
          </Link>{ " "}
          from the notification bell on the header.
        </p>
      </section>
    </div>
  );
}
