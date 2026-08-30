-- Receipt photos. Private bucket; objects are keyed
-- `{record_id}/{expense_id}/photo.jpg`, so the first path segment
-- identifies the owning TES and drives every policy below.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts', 'receipts', false,
  10485760,  -- 10 MB, matching the old storage.rules cap
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- Readable by the owning employee, and by reviewers once the TES has left
-- draft (same visibility rule as the record itself).
create policy receipts_select on storage.objects for select to authenticated
using (
  bucket_id = 'receipts'
  and exists (
    select 1 from public.records r
    where r.id::text = (storage.foldername(name))[1]
      and (r.employee_uid = auth.uid() or (public.auth_is_reviewer() and r.stage <> 'draft'))
  )
);

-- Only the owning employee, and only while the TES is still a draft, may
-- attach, replace or remove a receipt.
create policy receipts_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'receipts'
  and exists (
    select 1 from public.records r
    where r.id::text = (storage.foldername(name))[1]
      and r.employee_uid = auth.uid() and r.stage = 'draft'
  )
);

create policy receipts_update on storage.objects for update to authenticated
using (
  bucket_id = 'receipts'
  and exists (
    select 1 from public.records r
    where r.id::text = (storage.foldername(name))[1]
      and r.employee_uid = auth.uid() and r.stage = 'draft'
  )
)
with check (
  bucket_id = 'receipts'
  and exists (
    select 1 from public.records r
    where r.id::text = (storage.foldername(name))[1]
      and r.employee_uid = auth.uid() and r.stage = 'draft'
  )
);

create policy receipts_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'receipts'
  and exists (
    select 1 from public.records r
    where r.id::text = (storage.foldername(name))[1]
      and r.employee_uid = auth.uid() and r.stage = 'draft'
  )
);
