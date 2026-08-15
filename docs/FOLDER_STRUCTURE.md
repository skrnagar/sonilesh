# Proposed folder structure

```
ehs360/
├── ARCHITECTURE.md … DEVELOPMENT_ROADMAP.md   # root copies
├── docs/                                      # canonical architecture docs
├── supabase/migrations/                       # PostgreSQL + RLS + seeds
├── src/
│   ├── app/
│   │   ├── page.tsx                           # Landing
│   │   ├── login|signup|forgot-password|…     # Auth
│   │   ├── onboarding/                        # Org bootstrap flow
│   │   ├── admin/                             # SaaS Administration
│   │   ├── app/                               # Customer EHS workspace
│   │   ├── actions/                           # Server actions
│   │   └── auth/callback/                     # Supabase auth callback
│   ├── components/                            # UI, layout, events, modules
│   ├── lib/
│   │   ├── supabase/                          # browser/server/admin clients
│   │   ├── auth/                              # session + org context
│   │   ├── services/                          # RBAC, entitlements, admin, events
│   │   ├── events/                            # event queries
│   │   └── navigation/                        # module catalog for sidebar
│   └── types/
└── README.md
```
