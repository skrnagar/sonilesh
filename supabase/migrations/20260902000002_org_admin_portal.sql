-- Organization admin portal: custom domain + file policy settings

alter table public.organizations
  add column if not exists custom_domain text;

create unique index if not exists organizations_custom_domain_uidx
  on public.organizations (lower(custom_domain))
  where custom_domain is not null and deleted_at is null;

comment on column public.organizations.custom_domain is
  'Optional custom hostname for this tenant. Requires DNS CNAME to the EHS360 app host.';
