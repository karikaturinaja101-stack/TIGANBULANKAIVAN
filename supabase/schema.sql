-- SUPABASE SETUP - Undangan 3 Bulanan / Telung Oton Kaivan
-- Mode ini menyimpan seluruh pengaturan undangan dalam 1 record JSON
-- agar admin panel tetap sederhana dan mudah dipindahkan.
--
-- Cara pakai:
-- 1. Buka Supabase > SQL Editor.
-- 2. Paste seluruh isi file ini, lalu RUN.
-- 3. Buka Storage dan pastikan bucket "kaivan-media" sudah public.
-- 4. Isi supabase/config.js dengan Project URL dan anon key, lalu enabled: true.
--
-- Catatan keamanan:
-- Policy di bawah dibuat sederhana agar undangan statis bisa langsung berjalan.
-- Untuk acara kecil/pribadi ini praktis, tetapi untuk produksi besar sebaiknya
-- login admin diganti ke Supabase Auth dan policy diperketat.

create extension if not exists pgcrypto;

create table if not exists public.app_data (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_data enable row level security;

drop policy if exists "public read app data" on public.app_data;
drop policy if exists "public insert app data" on public.app_data;
drop policy if exists "public update app data" on public.app_data;

create policy "public read app data"
on public.app_data
for select
to anon
using (true);

create policy "public insert app data"
on public.app_data
for insert
to anon
with check (true);

create policy "public update app data"
on public.app_data
for update
to anon
using (true)
with check (true);

insert into public.app_data (id, data)
values (
  'main',
  '{
    "settings": {
      "invitationTitle": "3 Bulanan / Telung Oton Kaivan",
      "eventTitle": "Upacara 3 Bulanan / Telung Oton",
      "childName": "Kaivan",
      "subheader": "Putra dari Pasangan Jodie & Citra",
      "fatherName": "Jodie",
      "motherName": "Citra",
      "eventDate": "2026-07-20",
      "eventTime": "10:00",
      "timezoneLabel": "WITA",
      "locationName": "Kediaman Keluarga Besar",
      "address": "Silakan ubah alamat acara pada halaman admin.",
      "mapsUrl": "https://maps.google.com",
      "mapsEmbedUrl": "",
      "whatsappNumber": "",
      "openingText": "Atas asung kertha wara nugraha Ida Sang Hyang Widhi Wasa, dengan penuh rasa syukur kami mengundang Bapak/Ibu/Saudara/i untuk hadir dalam acara 3 Bulanan / Telung Oton putra kami.",
      "closingText": "Merupakan kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
      "mainPhoto": "",
      "musicUrl": "",
      "musicTitle": "Gamelan Bali Lembut",
      "musicEnabled": true,
      "musicVolume": 0.35,
      "countdownEnabled": true,
      "showOrnaments": true,
      "showFrame": true,
      "goldColor": "#d8b45a",
      "blackColor": "#080603",
      "adminUsername": "admin",
      "adminPassword": "admin123"
    },
    "guests": [
      { "id": "default-guest", "name": "Bapak/Ibu/Saudara/i", "slug": "tamu-undangan", "phone": "", "createdAt": "2026-01-01T00:00:00.000Z" },
      { "id": "default-family", "name": "Keluarga Besar", "slug": "keluarga-besar", "phone": "", "createdAt": "2026-01-01T00:00:00.000Z" }
    ],
    "gallery": [
      { "id": "gallery-1", "image": "", "caption": "Kenangan 1", "sortOrder": 1 },
      { "id": "gallery-2", "image": "", "caption": "Kenangan 2", "sortOrder": 2 },
      { "id": "gallery-3", "image": "", "caption": "Kenangan 3", "sortOrder": 3 },
      { "id": "gallery-4", "image": "", "caption": "Kenangan 4", "sortOrder": 4 },
      { "id": "gallery-5", "image": "", "caption": "Kenangan 5", "sortOrder": 5 },
      { "id": "gallery-6", "image": "", "caption": "Kenangan 6", "sortOrder": 6 },
      { "id": "gallery-7", "image": "", "caption": "Kenangan 7", "sortOrder": 7 },
      { "id": "gallery-8", "image": "", "caption": "Kenangan 8", "sortOrder": 8 }
    ],
    "rsvps": []
  }'::jsonb
)
on conflict (id) do nothing;

-- Bucket public untuk foto utama, galeri, dan musik.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kaivan-media',
  'kaivan-media',
  true,
  26214400,
  array['image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/mp3','audio/ogg','audio/wav']
)
on conflict (id) do update
set public = true,
    file_size_limit = 26214400,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read kaivan media" on storage.objects;
drop policy if exists "public insert kaivan media" on storage.objects;
drop policy if exists "public update kaivan media" on storage.objects;
drop policy if exists "public delete kaivan media" on storage.objects;

create policy "public read kaivan media"
on storage.objects
for select
to anon
using (bucket_id = 'kaivan-media');

create policy "public insert kaivan media"
on storage.objects
for insert
to anon
with check (bucket_id = 'kaivan-media');

create policy "public update kaivan media"
on storage.objects
for update
to anon
using (bucket_id = 'kaivan-media')
with check (bucket_id = 'kaivan-media');

create policy "public delete kaivan media"
on storage.objects
for delete
to anon
using (bucket_id = 'kaivan-media');
