insert into storage.buckets (id,name,public)
values ('votranse-media','votranse-media',false)
on conflict (id) do nothing;

create policy "media read own" on storage.objects for select to authenticated
using (bucket_id='votranse-media' and (owner_id=auth.uid() or (storage.foldername(name))[1]=auth.uid()::text));

create policy "media upload own" on storage.objects for insert to authenticated
with check (bucket_id='votranse-media' and (storage.foldername(name))[1]=auth.uid()::text);

create policy "media update own" on storage.objects for update to authenticated
using (bucket_id='votranse-media' and owner_id=auth.uid())
with check (bucket_id='votranse-media' and owner_id=auth.uid());

create policy "media delete own" on storage.objects for delete to authenticated
using (bucket_id='votranse-media' and owner_id=auth.uid());
