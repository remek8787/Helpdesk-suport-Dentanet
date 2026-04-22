# DENTANET Help Desk

WhatsApp helpdesk multi-user untuk CS DENTANET menggunakan **Baileys** + **Express** + **Socket.io** + **SQLite**.

## Fitur awal
- Login multi-user staff CS
- Inbox customer dari WhatsApp
- Balas pesan dari web
- History chat tersimpan
- Nama staff yang membalas ikut tercatat

## Struktur
- `backend/` → API, WebSocket, Baileys, SQLite
- `frontend/` → dashboard React
- `docs/` → blueprint & deployment guide
- `scripts/` → setup & backup

## Quick start
```bash
cd backend && npm install && npm run migrate && npm run seed
cd ../frontend && npm install
```

Jalankan:
```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

Login default:
- username: `admin`
- password: `admin123`

> Ganti password admin setelah login pertama.

## Catatan
Project ini masih scaffold v1, tapi arsitekturnya sudah siap untuk disempurnakan agent lain tanpa bongkar total.
