/**
 * Self-host / cloud worker: mark overdue CAPA in audit log so notification
 * sending does not depend on Supabase Edge Functions.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const intervalMs = Number(process.env.WORKER_INTERVAL_MS || 15 * 60 * 1000);

async function tick() {
  if (!url || !key) {
    console.error("[worker] missing Supabase URL or service role key");
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/capa_items?select=id,organization_id,title,due_date,status&due_date=lt.${today}&status=in.(open,in_progress,pending_verification)&deleted_at=is.null`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (!res.ok) {
    console.error("[worker] capa query failed", res.status, await res.text());
    return;
  }
  const rows = await res.json();
  console.log(`[worker] ${Array.isArray(rows) ? rows.length : 0} overdue CAPA item(s)`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const cron = process.env.CRON_SECRET || key;
  if (appUrl) {
    const tickRes = await fetch(`${appUrl.replace(/\/$/, "")}/api/internal/compliance-tick`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cron}` },
    });
    if (!tickRes.ok) {
      console.error("[worker] compliance tick failed", tickRes.status, await tickRes.text());
    } else {
      console.log("[worker] compliance tick", await tickRes.text());
    }
  }
}

tick();
setInterval(tick, intervalMs);
