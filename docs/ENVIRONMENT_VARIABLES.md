# Environment variables

Never commit real values. Client-visible names start with `NEXT_PUBLIC_`.

## Required for production (`VERCEL_ENV=production`)

| Name | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + local | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel + local | Browser/server user client |
| `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` | Vercel **server only** | Admin, ready probe, webhooks |

Aliases: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`.

## Optional

| Name | Purpose |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Absolute links (default localhost) |
| `NEXT_PUBLIC_APP_NAME` | Product label |
| `DEPLOYMENT_MODE` | `cloud` or `self_hosted` |
| `SELF_HOST_FEATURE_CODES` | Comma-separated allow list when self-hosted |
| `BILLING_GRACE_DAYS` | Past-due entitlement window (default 3) |
| `RAZORPAY_WEBHOOK_SECRET` | Billing webhook HMAC; if unset, webhook returns 503 |
| `CRON_SECRET` | Bearer for `/api/internal/compliance-tick` |
| `SUPABASE_JWKS_URL` | Defaults from project URL |
| AI provider keys | Optional; must not block boot |

## Do not

- Put service role, webhook, or cron secrets in `NEXT_PUBLIC_*`
- Commit `.env.local`
- Log env values
