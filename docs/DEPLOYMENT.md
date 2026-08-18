# Deployment

## Current

- Host: Vercel production https://sonilesh.vercel.app/
- GitHub: https://github.com/skrnagar/sonilesh.git
- `vercel.json`: Next.js framework, `npm install`, `next build`
- No GitHub Actions in this repo
- This pass **did not** push to origin (in-flight 13/14/marketing)

## Required production env (see ENVIRONMENT_VARIABLES.md)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.  
Optional: AI keys, `RAZORPAY_WEBHOOK_SECRET`, `CRON_SECRET`, `BILLING_GRACE_DAYS`.

`instrumentation.ts` fails the Node server boot on Vercel production if required keys are missing.

## Promote

1. Apply pending SQL (`00060`, and 13/14 only when those agents finish) to `sqybbygfksnjvmatiafm` **before** expecting new tables.
2. Set env on Production (and Preview if it shares the same project — prefer **not** sharing production DB with previews).
3. Deploy from the reviewed branch. Do not deploy half-written Phase 13/14/marketing together unless that is intentional.

## Rollback

Vercel instant rollback of the previous deployment. Database migrations are **forward-only**; do not drop production tables to roll back.
