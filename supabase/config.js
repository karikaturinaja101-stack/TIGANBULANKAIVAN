// Konfigurasi Supabase untuk Undangan 3 Bulanan / Telung Oton Kaivan.
// 1) Jalankan supabase/schema.sql di Supabase SQL Editor.
// 2) Buat/cek bucket public bernama "kaivan-media".
// 3) Isi URL dan anon key dari Project Settings > API.
// 4) Ubah enabled menjadi true.

window.SUPABASE_CONFIG = {
  enabled: true,
  url: "https://eycwectpwbmvmisxbxkl.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Y3dlY3Rwd2Jtdm1pc3hieGtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjE0NTgsImV4cCI6MjA5NjkzNzQ1OH0.N0b4xPJPFemHAegksAGLPiYzW_V0IwZY5VH3PRLTQMs",
  dataTable: "app_data",
  dataId: "main",
  storageBucket: "kaivan-media"
};
