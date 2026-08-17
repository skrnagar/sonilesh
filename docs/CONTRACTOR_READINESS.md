# Contractor readiness

`evaluateReadiness` / `getCompanyReadiness` / `getWorkerReadiness` combine:

- Company status (blacklisted/suspended ≠ ready)
- Explicit site assignment when a site is in scope
- Worker assignment status
- Induction (if org requires it)
- Mandatory documents when `enforce_mandatory_docs` is on — **expired verified docs fail**
- Training assignments when a worker `profile_id` exists

If training tables are unused for that worker, a TODO is returned (`TRAINING_READINESS_TODO`) instead of inventing a competency engine.

PTW: `getPtwEligibility`. Advisory unless `ptw_enforce_readiness`.
