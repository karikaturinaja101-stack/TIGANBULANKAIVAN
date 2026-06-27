// Konfigurasi Supabase untuk Undangan 3 Bulanan / Telung Oton Kaivan.
// 1) Jalankan supabase/schema.sql di Supabase SQL Editor.
// 2) Buat/cek bucket public bernama "kaivan-media".
// 3) Isi URL dan anon key dari Project Settings > API.
// 4) Ubah enabled menjadi true.

window.SUPABASE_CONFIG = {
  enabled: false,
  url: "PASTE_SUPABASE_PROJECT_URL_HERE",
  anonKey: "PASTE_SUPABASE_ANON_KEY_HERE",
  dataTable: "app_data",
  dataId: "main",
  storageBucket: "kaivan-media"
};
