-- Event numbering + submit RPCs must be executable by authenticated members.
-- next_event_number is SECURITY DEFINER; require org membership before incrementing.

create or replace function public.next_event_number(
  p_organization_id uuid,
  p_sequence_key text,
  p_prefix text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_value bigint;
  v_pad integer;
begin
  if p_organization_id is null then
    raise exception 'organization required';
  end if;

  if not (public.is_platform_admin() or public.is_org_member(p_organization_id)) then
    raise exception 'not authorized to allocate event numbers';
  end if;

  insert into public.number_sequences (organization_id, sequence_key, prefix, current_value)
  values (p_organization_id, p_sequence_key, p_prefix, 1)
  on conflict (organization_id, sequence_key)
  do update set
    current_value = public.number_sequences.current_value + 1,
    updated_at = timezone('utc', now())
  returning current_value, pad_length into v_value, v_pad;

  return p_prefix || lpad(v_value::text, coalesce(v_pad, 5), '0');
end;
$$;

grant execute on function public.next_event_number(uuid, text, text) to authenticated;
grant execute on function public.next_event_number(uuid, text, text) to service_role;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.has_org_permission(uuid, text, uuid) to authenticated;
