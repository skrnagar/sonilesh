# Billing architecture

## Current

- Domain tables: `plans`, `plan_features`, `subscriptions`, `subscription_items`, `billing_accounts`, `invoices` (empty), `subscription_events`, `usage_metrics`, `usage_events`.
- Application adapter: `BillingProvider` in `src/lib/billing/provider.ts`.
- Live adapter: `ManualBillingProvider` via `getBillingProvider()`. It does not charge a card and does not persist PSP invoices.
- Customer UI: `/app/settings/subscription`, `/app/settings/billing` (plan selection, no checkout).
- Admin: `/admin/billing`, `/admin/subscriptions`.
- Webhook: `POST /api/billing/razorpay` — HMAC with `RAZORPAY_WEBHOOK_SECRET`. Idempotency intended via `billing_webhook_events` (`supabase/migrations/20260326000060_production_hardening.sql`). Apply that migration before relying on it in production.

Core EHS records **must not** carry `subscription_status`. Entitlements read `subscriptions` + overrides only.

## Target (do not implement a second engine)

1. Keep the Phase 2 plan/entitlement schema.
2. Add a real adapter (`StripeBillingProvider` or `RazorpayBillingProvider`) behind `getBillingProvider()`, selected by env (`BILLING_PROVIDER=manual|razorpay|stripe`).
3. Webhooks verify signatures, upsert `billing_webhook_events` uniquely, then update `subscriptions` / `billing_accounts`.
4. Hosted customer portal and invoices come from the provider; do not generate fake invoices.
5. Never put PSP SDKs in entitlement or incident services.

Plan names (Starter, Professional, …) are catalog examples only.
