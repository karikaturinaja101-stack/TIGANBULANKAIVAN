# Panduan Supabase - Undangan Telung Oton Kaivan

## 1. Buat project Supabase
Buka Supabase, buat project baru, lalu tunggu sampai project aktif.

## 2. Jalankan database
Buka **SQL Editor**, paste isi file:

`supabase/schema.sql`

Lalu klik **Run**.

File SQL akan membuat:
- tabel `app_data`
- bucket storage `kaivan-media`
- policy sederhana agar web statis bisa membaca/menyimpan data

## 3. Isi konfigurasi
Buka file:

`supabase/config.js`

Ubah bagian ini:

```js
enabled: true,
url: "https://PROJECT_ID.supabase.co",
anonKey: "ANON_KEY_DARI_SUPABASE",
```

Project URL dan anon key bisa dilihat di:
**Project Settings > API**

## 4. Upload/hosting web
Folder ini adalah web statis. Bisa dihosting di:
- Vercel
- Netlify
- Cloudflare Pages
- hosting biasa/cPanel

Supabase dipakai untuk database dan upload foto/musik, bukan sebagai hosting utama halaman web.

## 5. Cara cek
Buka `admin.html`, login:

- Username: `admin`
- Password: `admin123`

Setelah Supabase aktif:
- upload foto utama akan masuk ke Supabase Storage
- upload galeri akan masuk ke Supabase Storage
- upload musik akan masuk ke Supabase Storage
- RSVP dan ucapan akan tersimpan ke Supabase
- data akan sinkron antar perangkat

## Catatan
Mode ini dibuat mudah dan praktis. Untuk keamanan produksi yang lebih ketat, admin panel bisa dikembangkan lagi menggunakan Supabase Auth.


## Catatan Galeri 8 Foto

Versi revisi ini sudah memperbaiki upload galeri agar bisa mengganti semua 8 foto dari admin.

- Gunakan menu **Galeri** untuk mengganti foto satu per satu.
- Gunakan tombol **Upload 8 Foto Sekaligus** untuk memilih beberapa foto langsung.
- Jika Supabase aktif, file foto masuk ke **Storage bucket `kaivan-media`** dan database hanya menyimpan URL foto, sehingga tidak terbatas seperti localStorage.
- Jika Supabase belum aktif, foto akan otomatis dikompresi agar mode lokal tetap bisa menyimpan 8 foto.
