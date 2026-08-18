# Disaster recovery

This is an operations outline, **not** an RPO/RTO guarantee.

## What exists

- Production database is hosted Supabase project `sqybbygfksnjvmatiafm`.
- Application is Vercel (`sonilesh.vercel.app`) with `output: "standalone"`.
- Migrations live in `supabase/migrations/`. Live history timestamps differ (`20260817*`) from some repo filenames (`20260326*`); do not drop tables to rename.

## Backups

Supabase provides automated backups on paid plans. Confirm the current plan and PITR in the Supabase dashboard — this repo does not encode backup retention.

## Restore sketch (practice on a branch, not production)

1. Restore a backup to a **new** project or Supabase branch.
2. Point a preview deployment at that project.
3. Verify login, org isolation, and a sample incident/permit.
4. Only then consider promoting.

## Secrets

If a key leaks: rotate in Vercel + Supabase, invalidate sessions if Auth keys change, do **not** rewrite git history.

## What we will not claim

Numeric RPO/RTO, “four nines”, or geo-failover until you have measured a restore drill.
