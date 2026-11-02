# Project rules

- Staff workspace (/admin) access comes only from a real sign-in plus an admin/staff row in `user_roles`; never reintroduce shared passwords or browser-stored staff flags — they can be forged.
- Plan and access rules used by server functions live as pure functions in `supabase/functions/_shared/access.ts` and are unit-tested from `src/lib/access.test.ts` — keeps paid gating and redirect rules testable.
- Billing return URLs must go through the origin allowlist in `_shared/access.ts` — prevents sending paying customers to outside sites.
- Game tracking tables (`rbx_*`) are read and written only by the `rbx` server function; the browser never queries them directly — keeps raw history private and paid ranges enforceable.
- The rbx `poll` action only runs with the `x-job-key` header matching `internal_job_keys` (service-role only table read by the cron job) — stops outsiders from flooding tracking history.
