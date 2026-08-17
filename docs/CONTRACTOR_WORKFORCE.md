# Contractor workforce

Workers live on `contractor_workers` and optionally link to `organization_members` / `profiles` (`member_id`, `profile_id`).

Site/project access is `contractor_worker_assignments` plus company-level `contractor_site_assignments` / `contractor_project_assignments`. Approval is explicit per scope.

Training/certs are **not** a second LMS. When `profile_id` is set, readiness consults existing `training_assignments`. Phase 9 training UI remains a thin course/assignment register.
