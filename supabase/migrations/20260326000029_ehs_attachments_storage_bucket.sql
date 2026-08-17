-- Private tenant-scoped attachments bucket used by the app (ehs-attachments)
-- Path convention: {organization_id}/...

insert into storage.buckets (id, name, public, file_size_limit)
values ('ehs-attachments', 'ehs-attachments', false, 15728640)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit;

drop policy if exists ehs_attachments_select on storage.objects;
drop policy if exists ehs_attachments_insert on storage.objects;
drop policy if exists ehs_attachments_update on storage.objects;
drop policy if exists ehs_attachments_delete on storage.objects;

create policy ehs_attachments_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'ehs-attachments'
    and (
      public.is_platform_admin()
      or (
        split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and public.is_org_member((split_part(name, '/', 1))::uuid)
      )
    )
  );

create policy ehs_attachments_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'ehs-attachments'
    and (
      public.is_platform_admin()
      or (
        split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and public.is_org_member((split_part(name, '/', 1))::uuid)
      )
    )
  );

create policy ehs_attachments_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'ehs-attachments'
    and (
      public.is_platform_admin()
      or (
        split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and public.is_org_member((split_part(name, '/', 1))::uuid)
      )
    )
  );

create policy ehs_attachments_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'ehs-attachments'
    and (
      public.is_platform_admin()
      or (
        split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and public.is_org_member((split_part(name, '/', 1))::uuid)
      )
    )
  );
