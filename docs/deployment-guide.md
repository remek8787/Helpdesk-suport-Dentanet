# Deployment Guide — DENTANET Help Desk

## Quick Start (VPS)

### 1. Prerequisites
```bash
# Pastikan Node.js v22+ terinstall
node --version   # harus >= v22.0.0
npm --version    # harus >= 10.0.0
```

Jika belum ada:
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs
```

### 2. Clone & Setup
```bash
git clone <repo-url>
cd Helpdesk-suport-Dentanet

# Install dependencies backend
cd backend && npm install && cd ..

# Install dependencies frontend  
cd frontend && npm install && cd ..
```

### 3. Inisialisasi Database
```bash
bash scripts/setup.sh
```
Script ini akan:
- Buat direktori `backend/data/`
- Jalankan schema SQL ke SQLite DB
- Seed default admin user (`admin/admin123`)

### 4. Jalankan Server
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend (development)
cd frontend && npm run dev
```

### 5. QR Scan Nomor WhatsApp Baru
Ketika backend mulai, akan muncul QR code di terminal:
- Scan pakai WhatsApp → Settings → Linked Devices → Link a Device
- Setelah berhasil login → sesi tersimpan otomatis
- Backend tinggal jalan terus tanpa re-scan lagi

### 6. Akses Dashboard
Buka browser → `http://<ip-server>:5173`
- Login pakai kredensial yang sudah di-seed
- Tambah staff CS lewat menu **Staff Management**

## Production Setup

### Reverse Proxy Nginx
```nginx
server {
    listen 80;
    server_name helpdesk.dentanet.id;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:3100/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL dengan Certbot
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d helpdesk.dentanet.id
```

### Service Manager (Systemd)
```bash
sudo systemctl enable helpdesk-backend.service
sudo systemctl start helpdesk-backend.service
```

### Backup Rutin
```bash
crontab -e
# Tambahkan:
0 2 * * * /root/.openclaw/workspace/Helpdesk-suport-Dentanet/scripts/backup.sh
```

## Troubleshooting

### QR Tidak Keluar
- Cek log: `journalctl -u helpdesk-backend -f`
- Pastikan port 3100 tidak dipakai aplikasi lain
- Restart service: `systemctl restart helpdesk-backend`

### WebSocket Disconnect
- Cek firewall: pastikan port 3100 terbuka
- Pastikan Nginx proxy mendukung websocket upgrade

### Database Lock
- Tutup semua koneksi sebelum backup
- Gunakan WAL mode: PRAGMA journal_mode=WAL;

---

**Last Updated:** 2026-04-22
