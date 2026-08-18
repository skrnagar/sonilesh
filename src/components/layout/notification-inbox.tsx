"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  listRecentNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifications";
import type { NotificationRow } from "@/lib/services/notifications";
import { cn } from "@/lib/utils";

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function NotificationDropdown({
  items,
  unreadCount: initialUnreadCount,
  onUpdate,
}: {
  items: NotificationRow[];
  unreadCount: number;
  onUpdate?: (rows: NotificationRow[]) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(items);
  const [loading, setLoading] = useState(items.length === 0);

  // Derive unread count from local state so it stays accurate after client-side updates.
  const unreadCount = loaded.filter((n) => !n.read_at).length;
  // Suppress unused-variable warning while keeping the prop for future server-driven badge sync.
  void initialUnreadCount;

  function updateLoaded(rows: NotificationRow[]) {
    setLoaded(rows);
    onUpdate?.(rows);
  }

  useEffect(() => {
    if (items.length) {
      setLoaded(items);
      setLoading(false);
      return;
    }
    let cancelled = false;
    listRecentNotificationsAction()
      .then((rows) => {
        if (!cancelled) {
          setLoaded(rows);
          onUpdate?.(rows);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      const now = new Date().toISOString();
      const updated = loaded.map((row) => ({ ...row, read_at: row.read_at ?? now }));
      updateLoaded(updated);
    });
  }

  function openItem(item: NotificationRow) {
    startTransition(async () => {
      if (!item.read_at) {
        const fd = new FormData();
        fd.set("notificationId", item.id);
        await markNotificationReadAction(fd);
        const now = new Date().toISOString();
        const updated = loaded.map((row) =>
          row.id === item.id ? { ...row, read_at: now } : row,
        );
        updateLoaded(updated);
      }
      if (item.link) {
        router.push(item.link);
      }
    });
  }

  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-lg)]">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <p className="font-display text-sm font-semibold">Notifications</p>
          <p className="text-xs text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "You're caught up"}
          </p>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            disabled={pending}
            onClick={markAll}
            className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
          >
            Mark all read
          </button>
        ) : null}
      </div>
      <ul className="max-h-80 overflow-y-auto">
        {loading ? (
          <li className="px-4 py-6 text-sm text-muted-foreground">Loading alerts…</li>
        ) : loaded.length === 0 ? (
          <li className="px-4 py-6 text-sm text-muted-foreground">
            No EHS alerts for this workspace yet.
          </li>
        ) : (
          loaded.map((item) => (
            <li key={item.id} className="border-b border-border last:border-0">
              <button
                type="button"
                disabled={pending}
                onClick={() => openItem(item)}
                className={cn(
                  "flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-muted/60 disabled:opacity-60",
                  !item.read_at && "bg-muted/30",
                )}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                  {!item.read_at ? (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-destructive" />
                  ) : null}
                </span>
                {item.body ? (
                  <span className="line-clamp-2 text-xs text-muted-foreground">{item.body}</span>
                ) : null}
                <span className="text-[11px] text-muted-foreground">
                  {formatWhen(item.created_at)}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
      <div className="border-t border-border px-4 py-2.5">
        <Link
          href="/app/notifications"
          className="text-xs font-medium text-primary hover:underline"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}

export function NotificationList({ items }: { items: NotificationRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function openItem(item: NotificationRow) {
    startTransition(async () => {
      if (!item.read_at) {
        const fd = new FormData();
        fd.set("notificationId", item.id);
        await markNotificationReadAction(fd);
      }
      if (item.link) router.push(item.link);
      else router.refresh();
    });
  }

  if (!items.length) {
    return (
      <p className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        No notifications yet. Alerts from incidents, permits, CAPA, and inspections appear here.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            disabled={pending}
            onClick={() => openItem(item)}
            className={cn(
              "flex w-full flex-col gap-1 px-4 py-3.5 text-left hover:bg-muted/50 disabled:opacity-60",
              !item.read_at && "bg-muted/25",
            )}
          >
            <span className="flex items-start justify-between gap-3">
              <span className="font-medium text-foreground">{item.title}</span>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {formatWhen(item.created_at)}
              </span>
            </span>
            {item.body ? (
              <span className="text-sm text-muted-foreground">{item.body}</span>
            ) : null}
            {item.link ? (
              <span className="text-xs text-primary">Open related record →</span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}
