# Lemon Cloudy Discord Bot

## Run

- Workflow: `Discord bot`
- Command: `npm start`
- Local development: `npm run dev`

## Required secret

- `DISCORD_BOT_TOKEN`: token bot dari Discord Developer Portal. Jangan commit token ke repository.

Optional:

- `DISCORD_GUILD_ID`: ID server Discord untuk mendaftarkan `/streaming` langsung ke satu server. Jika tidak ada, command didaftarkan global dan propagasinya dapat membutuhkan waktu.

## Discord setup

Invite bot dengan scope `bot` dan `applications.commands`. Bot dan pengguna yang memakai panel perlu permission `Manage Server`.

## Panel

Gunakan `/streaming` di server. Panel menyediakan tombol untuk:

- mengatur Page 1 dan Page 2 lewat modal
- mengatur nama/URL streaming dan delay
- mengatur tombol status
- mengatur progress
- enable/disable presence bot
- mengunduh konfigurasi JSON terbaru

Konfigurasi disimpan lokal di `data/streaming-config.json`, di luar commit. Saat pertama kali berjalan, file JSON yang dilampirkan user dipakai sebagai seed awal jika tersedia.