-- Corrective: LTI / Fatal severities + incident classifications for Unsafe Act / Condition.
-- Idempotent; does not rewrite prior migration history.

-- System severity levels used on incident / near-miss forms
insert into public.severity_levels (organization_id, code, name, rank, color, requires_investigation)
select null, v.code, v.name, v.rank, v.color, v.requires_investigation
from (
  values
    ('lti', 'LTI', 5, '#C45C26', true),
    ('fatal', 'Fatal', 6, '#8B1E1E', true)
) as v(code, name, rank, color, requires_investigation)
where not exists (
  select 1
  from public.severity_levels s
  where s.organization_id is null
    and s.code = v.code
);

-- Prefer short field labels for existing injury classifications
update public.report_category_templates
set name = 'LTI'
where event_type_code = 'incident'
  and code = 'lost_time'
  and name is distinct from 'LTI';

update public.report_category_templates
set name = 'Fatal'
where event_type_code = 'incident'
  and code = 'fatality'
  and name is distinct from 'Fatal';

update public.event_categories ec
set name = 'LTI'
from public.event_types et
where et.id = ec.event_type_id
  and et.organization_id is null
  and et.code = 'incident'
  and ec.code = 'lost_time'
  and ec.name is distinct from 'LTI';

update public.event_categories ec
set name = 'Fatal'
from public.event_types et
where et.id = ec.event_type_id
  and et.organization_id is null
  and et.code = 'incident'
  and ec.code = 'fatality'
  and ec.name is distinct from 'Fatal';

-- Incident form classification: Unsafe Act / Unsafe Condition
insert into public.report_category_templates (event_type_code, code, name, sort_order)
select v.event_type_code, v.code, v.name, v.sort_order
from (
  values
    ('incident', 'unsafe_act', 'Unsafe Act', 15),
    ('incident', 'unsafe_condition', 'Unsafe Condition', 16)
) as v(event_type_code, code, name, sort_order)
where not exists (
  select 1
  from public.report_category_templates t
  where t.event_type_code = v.event_type_code
    and t.code = v.code
);

-- Seed into existing orgs that already have incident categories
insert into public.event_categories (organization_id, event_type_id, code, name, is_active)
select distinct ec.organization_id, et.id, t.code, t.name, true
from public.event_categories ec
join public.event_types et_src on et_src.id = ec.event_type_id
join public.event_types et on et.organization_id is null and et.code = 'incident'
join public.report_category_templates t
  on t.event_type_code = 'incident'
 and t.code in ('unsafe_act', 'unsafe_condition')
where et_src.code = 'incident'
on conflict (organization_id, event_type_id, code) do nothing;
