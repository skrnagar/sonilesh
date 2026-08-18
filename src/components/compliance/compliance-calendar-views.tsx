"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  bucketCalendarEvent,
  eventsInRange,
  monthGrid,
  startOfWeekUtc,
  type CalendarBucket,
  type CalendarEvent,
} from "@/lib/compliance/calendar";

const VIEWS = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "list", label: "List" },
] as const;

const BUCKET_LABEL: Record<CalendarBucket, string> = {
  overdue: "Overdue",
  due_today: "Due today",
  due_soon: "Due soon",
  upcoming: "Upcoming",
  completed: "Completed",
};

export function ComplianceCalendarViews({
  events,
  today,
  view,
}: {
  events: CalendarEvent[];
  today: string;
  view: "month" | "week" | "list";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setView(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  const tone = {
    overdue: "border-red-300 bg-red-50",
    due_today: "border-amber-300 bg-amber-50",
    due_soon: "border-amber-200 bg-amber-50",
    upcoming: "border-emerald-200 bg-emerald-50",
    completed: "border-border bg-muted/40",
  };

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl border border-border bg-card p-1">
        {VIEWS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              view === option.value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
            onClick={() => setView(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {view === "list" ? <ListView events={events} today={today} tone={tone} /> : null}
      {view === "week" ? <WeekView events={events} today={today} tone={tone} /> : null}
      {view === "month" ? <MonthView events={events} today={today} tone={tone} /> : null}
    </div>
  );
}

function EventLink({
  event,
  today,
  tone,
}: {
  event: CalendarEvent;
  today: string;
  tone: Record<CalendarBucket, string>;
}) {
  const bucket = bucketCalendarEvent(event, today);
  return (
    <Link href={event.href} className={`block rounded-lg border px-3 py-2 text-sm ${tone[bucket]}`}>
      <div className="flex justify-between gap-2">
        <span className="font-medium">{event.title}</span>
        <span className="text-xs">{event.date}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {event.kind} · {event.status} · {BUCKET_LABEL[bucket]}
      </p>
    </Link>
  );
}

function ListView({
  events,
  today,
  tone,
}: {
  events: CalendarEvent[];
  today: string;
  tone: Record<CalendarBucket, string>;
}) {
  const order: CalendarBucket[] = ["overdue", "due_today", "due_soon", "upcoming", "completed"];
  return (
    <div className="space-y-4">
      {order.map((bucket) => {
        const rows = events.filter((event) => bucketCalendarEvent(event, today) === bucket);
        if (!rows.length) return null;
        return (
          <section key={bucket} className="space-y-2">
            <h2 className="text-sm font-semibold">{BUCKET_LABEL[bucket]}</h2>
            {rows.map((event) => (
              <EventLink key={`${event.kind}-${event.id}`} event={event} today={today} tone={tone} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

function WeekView({
  events,
  today,
  tone,
}: {
  events: CalendarEvent[];
  today: string;
  tone: Record<CalendarBucket, string>;
}) {
  const start = startOfWeekUtc(today);
  const endDate = new Date(`${start}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 6);
  const end = endDate.toISOString().slice(0, 10);
  const days: string[] = [];
  const cursor = new Date(`${start}T00:00:00.000Z`);
  for (let i = 0; i < 7; i++) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return (
    <div className="grid gap-2 md:grid-cols-7">
      {days.map((day) => (
        <div key={day} className="space-y-2 rounded-xl border border-border p-2">
          <p className="text-xs font-semibold">{day}</p>
          {eventsInRange(events, day, day).map((event) => (
            <EventLink key={`${event.kind}-${event.id}`} event={event} today={today} tone={tone} />
          ))}
        </div>
      ))}
      <p className="sr-only">
        Week {start} to {end}
      </p>
    </div>
  );
}

function MonthView({
  events,
  today,
  tone,
}: {
  events: CalendarEvent[];
  today: string;
  tone: Record<CalendarBucket, string>;
}) {
  const d = new Date(`${today}T00:00:00.000Z`);
  const days = monthGrid(d.getUTCFullYear(), d.getUTCMonth());
  return (
    <div className="grid grid-cols-7 gap-1">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
        <p key={label} className="px-1 text-[11px] font-semibold uppercase text-muted-foreground">
          {label}
        </p>
      ))}
      {days.map((day) => {
        const inMonth = day.slice(0, 7) === today.slice(0, 7);
        return (
          <div
            key={day}
            className={`min-h-24 space-y-1 rounded-lg border p-1 ${inMonth ? "border-border" : "border-transparent bg-muted/30"}`}
          >
            <p className="text-[11px] text-muted-foreground">{day.slice(8)}</p>
            {eventsInRange(events, day, day).map((event) => (
              <EventLink key={`${event.kind}-${event.id}`} event={event} today={today} tone={tone} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
