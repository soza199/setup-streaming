# Lemon Cloudy Discord Bot

Bot Discord untuk mengatur status streaming melalui panel button dan modal seperti contoh yang diberikan.

## Menjalankan di Replit

1. Tambahkan secret `DISCORD_BOT_TOKEN` dari Discord Developer Portal.
2. Opsional: tambahkan `DISCORD_GUILD_ID` supaya slash command terdaftar langsung di satu server. Tanpa ini, command didaftarkan secara global dan bisa membutuhkan waktu propagasi.
3. Jalankan workflow `Discord bot` atau `npm start`.
4. Di server Discord, gunakan `/streaming`.

Bot membutuhkan permission `Manage Server` untuk membuka dan menggunakan panel. Data konfigurasi disimpan di `data/streaming-config.json` dan otomatis mengambil file JSON lampiran sebagai konfigurasi awal saat pertama kali berjalan.