# Regulatory change workflow

This is a **data model and review workflow**. It is not live monitoring of gazettes, MCA, SEBI, CPCB, or any regulator feed.

## Tables

- `regulatory_updates` — a recorded circular/note (org or platform catalog)
- `regulatory_update_impacts` — pending / applicable / not applicable / actioned against a legal-register entry

UI: `/app/compliance/reviews`.

Owners may be notified when an impact is marked applicable. Nothing in this module watches the internet or claims that the register is current.

Not legal advice. Recording an update does not mean the organization is in or out of compliance.
