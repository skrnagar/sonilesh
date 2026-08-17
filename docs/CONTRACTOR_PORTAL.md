# Contractor portal

External shell at `/contractor` — not `/app`. No internal admin chrome.

Flow: EHS invites a contact → `/contractor/invite/accept?token=` → member with `contractor_contact` role and `organization_members.contractor_company_id`.

Home: assigned projects + recent documents. `/contractor/documents`: upload only. Verification is host-side (`contractor_document.verify`); self-verify is blocked in service and trigger.

Login: `/contractor/login` (rewrite to `/contractor-login`).
