# 3 Bulanan / Telung Oton Kaivan

Web undangan online tema Bali hitam–emas untuk acara **3 Bulanan / Telung Oton Kaivan**.

## Fitur

- Halaman pembuka personal sesuai nama tamu
- Foto utama dengan border emas tipis
- Countdown acara
- Lokasi Google Maps
- RSVP kehadiran
- Ucapan dan doa tamu
- Galeri 8 foto dengan auto-slide
- Musik yang bisa diganti dari admin
- Admin panel sederhana
- Import/export tamu CSV
- Backup JSON
- Siap Supabase untuk database dan upload foto/musik online

## Cara coba lokal

1. Extract ZIP.
2. Buka `index.html` untuk melihat undangan.
3. Buka `admin.html` untuk mengatur data.
4. Login awal:
   - Username: `admin`
   - Password: `admin123`

## Cara aktifkan Supabase

1. Buka Supabase dan buat project.
2. Buka **SQL Editor**.
3. Jalankan file `supabase/schema.sql`.
4. Buka file `supabase/config.js`.
5. Isi:
   - `enabled: true`
   - `url`
   - `anonKey`
6. Upload folder web ke Vercel/Netlify/hosting biasa.

Panduan lengkap ada di:

`supabase/PANDUAN_SUPABASE.md`

## Catatan penting

Supabase digunakan untuk:
- database undangan
- RSVP
- daftar tamu
- ucapan/doa
- upload foto utama
- upload galeri
- upload musik

Halaman web tetap bisa dihosting di Vercel, Netlify, Cloudflare Pages, atau hosting biasa.


## Revisi Upload Galeri

Menu Galeri di admin sudah mendukung penggantian 8 foto. Bisa upload satu per satu atau memakai tombol **Upload 8 Foto Sekaligus**. Untuk hasil terbaik gunakan Supabase agar foto tersimpan di Storage dan sinkron di semua perangkat.
