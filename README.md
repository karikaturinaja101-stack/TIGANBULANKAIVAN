# Undangan Undangan Upacara 3 Bulanan / Tigang Sasih

Versi ini sudah disiapkan untuk mode lokal dan mode online Supabase.

## Fitur
- Halaman undangan tema Bali hitam-emas.
- Nama tamu personal dari database.
- Foto utama dengan border emas tipis.
- Countdown acara.
- RSVP dan ucapan/doa tamu.
- Galeri 8 foto dengan slider otomatis.
- Musik dapat diganti dari admin melalui upload file atau link lagu.
- Admin panel sederhana untuk mengubah acara, foto, galeri, musik, tamu, RSVP, tema, dan akun admin.
- Mode Supabase untuk menyimpan data, foto, galeri, dan musik secara online.

## Login Admin Awal
- Username: `admin`
- Password: `admin123`

Setelah masuk, ubah akun admin di menu **Backup & Akun**.

## Cara Edit Setelah Hosting
1. Buka link web yang sudah dihosting.
2. Tambahkan `/admin.html` di belakang domain.
   Contoh: `https://domain-anda.com/admin.html`
3. Login admin.
4. Pilih menu yang ingin diubah:
   - **Acara** untuk nama, tanggal, lokasi, maps, countdown.
   - **Foto Utama** untuk mengganti foto utama.
   - **Galeri** untuk mengganti 8 foto slider.
   - **Musik** untuk upload/ganti lagu atau menempel link lagu.
   - **Daftar Tamu** untuk membuat link undangan personal.
   - **RSVP & Ucapan** untuk melihat data kehadiran dan doa.
   - **Tema** untuk warna dan ornamen.
5. Klik tombol simpan pada menu tersebut.
6. Jika Supabase aktif, perubahan otomatis tersimpan online. Tombol **Simpan Online** di Dashboard bisa digunakan untuk memaksa sinkronisasi.

## Cara Aktifkan Supabase
1. Buat project di Supabase.
2. Buka **SQL Editor**.
3. Jalankan isi file `supabase/schema.sql`.
4. Buka file `supabase/config.js`.
5. Isi:
   - `url`
   - `anonKey`
   - ubah `enabled` menjadi `true`
6. Upload semua file web ke Vercel, Netlify, Cloudflare Pages, atau hosting biasa.

## Catatan Penting
- Jika Supabase belum aktif, data hanya tersimpan pada browser/perangkat admin.
- Jika Supabase aktif, perubahan yang dilakukan di `admin.html` akan tampil di semua perangkat.
- Musik pada browser modern biasanya akan mulai setelah tamu menekan tombol **Buka Undangan**.
