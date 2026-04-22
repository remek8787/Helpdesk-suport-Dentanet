# Blueprint — DENTANET Help Desk (WhatsApp Support System)

## Tujuan
Sistem helpdesk berbasis WhatsApp yang memungkinkan beberapa CS (customer service) login ke web dashboard untuk membaca dan membalas pesan pelanggan secara real-time, dengan riwayat chat yang terekam penuh.

## Nama
**DENTANET Help Desk**

## Tech Stack

### Backend
- **Runtime:** Node.js v22+
- **Framework:** Express.js (REST API + WebSocket via Socket.io)
- **WhatsApp Engine:** Baileys (Multi-Device, session sendiri / nomor baru)
- **Database:** SQLite via `better-sqlite3`
- **Auth:** JSON Web Token (JWT)
- **Real-time:** Socket.io
- **Session Storage:** File-based (Baileys auth state)

### Frontend
- **Framework:** React 18 + Vite
- **UI Library:** Tailwind CSS + Headless UI / shadcn
- **State Management:** React Context + useReducer
- **Real-time Client:** Socket.io-client
- **HTTP Client:** Fetch API / Axios

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────┐
│              DENTANET HELP DESK                      │
│                                                      │
│  ┌──────────┐    ┌──────────────┐   ┌─────────────┐ │
│  │  Staff A  │    │   Web UI     │   │   Socket.IO │ │
│  │  Login B  │◄──►│  (React)     │◄──►│  Server     │ │
│  │  Staff C  │    │              │   │  (Express)  │ │
│  └──────────┘    └──────────────┘   └──────┬──────┘ │
│                                             │        │
│                                   ┌─────────▼──────┐ │
│                                   │   Baileys      │ │
│                                   │   WhatsApp MD  │ │
│                                   │  (Nomor Baru)  │ │
│                                   └────────────────┘ │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │         Database (SQLite)                     │   │
│  │  • staff (login CS)                           │   │
│  │  • customers (kontak pelanggan)               │   │
│  │  • messages (riwayat pesan)                   │   │
│  │  • conversations (thread per pelanggan)       │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Database Schema (SQLite)

### Tabel `staff`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INTEGER PK AUTOINCREMENT | ID unik CS |
| username | TEXT UNIQUE | Username untuk login |
| password_hash | TEXT | Hash bcrypt password |
| display_name | TEXT | Nama tampil di chat (misal "Ananta CS") |
| avatar | TEXT | URL/foto profil opsional |
| status | TEXT DEFAULT 'offline' | online / offline / busy |
| created_at | DATETIME | Waktu dibuat akun |

### Tabel `customers`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INTEGER PK AUTOINCREMENT | ID unik pelanggan |
| wa_id | TEXT UNIQUE | Nomor WA pelanggan (+62xxx) |
| name | TEXT | Nama kontak tersimpan |
| avatar | TEXT | Avatar WA pelanggan |
| last_message_at | DATETIME | Pesan terakhir |
| created_at | DATETIME | Waktu pertama kali chat |

### Tabel `messages`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INTEGER PK AUTOINCREMENT | ID unik pesan |
| conversation_id | INTEGER FK | Relasi ke customers |
| sender_type | TEXT | customer atau staff |
| staff_id | INTEGER NULL FK | NULL jika dari customer |
| content | TEXT | Isi pesan (teks) |
| media_url | TEXT NULL | URL media jika ada gambar/video/dokumen |
| message_type | TEXT | text, image, video, document, audio, sticker, location, contact |
| direction | TEXT | inbound / outbound |
| status | TEXT DEFAULT 'delivered' | sent / delivered / read / failed |
| timestamp | DATETIME | Waktu kirim/terima |

## Fitur Core

### 1. Multi-CS Login
- Setiap CS punya akun login terpisah (username + password)
- Nama CS muncul di setiap pesan outbound → pelanggan tahu siapa yang balas
- Status online/offline/busy ditampilkan di dashboard
- Password di-hash pakai bcrypt

### 2. Real-Time Inbox
- Pesan masuk & keluar langsung update di web tanpa refresh
- Notifikasi badge count untuk pesan belum dibaca
- Sound notification untuk pesan masuk baru

### 3. Chat Thread Per Pelanggan
- Semua percakapan per pelanggan dikelompokkan dalam thread
- Riwayat chat lengkap terlihat
- Pagination/load more untuk pesan lama
- Search/filter pesan dalam thread

### 4. Balas Pesan dari Web
- CS bisa mengetik & kirim balasan dari dashboard web
- Support teks, gambar, dokumen, voice note
- Attachment upload via drag & drop
- Typing indicator otomatis (opsional)

### 5. Manajemen Kontak Pelanggan
- Daftar semua pelanggan yang pernah chat
- Search/name filter
- Info quick view: nama, pesan terakhir, waktu terakhir

### 6. Activity Log
- Siapa CS yang membalas kapan
- Status pesan (sent, delivered, read)
- Timestamp lengkap WIB

## Deployment & Infrastruktur

### Server Requirements
- CPU: 2 cores minimum
- RAM: 512MB minimum (1GB recommended)
- Disk: 5GB free (SQLite database kecil)
- OS: Linux (Ubuntu/Debian/CentOS/OpenCloudOS)
- Node.js v22+
- npm >= 10

### Port Usage
- **Backend (API + WS):** port 3100
- **Frontend (Vite build):** served same port or reverse proxy nginx
- Reverse Proxy Nginx (optional): port 80/443

### Struktur Direktori

```
Helpdesk-suport-Dentanet/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Entry point server
│   │   ├── config.ts         # Environment & app config
│   │   ├── routes/           # Express route handlers
│   │   │   ├── auth.ts       # Login/logout endpoints
│   │   │   ├── staff.ts      # Staff CRUD (admin only)
│   │   │   ├── chat.ts       # Chat/message endpoints
│   │   │   └── customers.ts  # Customer contact endpoints
│   │   ├── middleware/
│   │   │   ├── auth.ts       # JWT verification middleware
│   │   │   └── errorHandler.ts
│   │   ├── db/
│   │   │   ├── schema.sql    # Database schema
│   │   │   ├── seed.sql      # Default admin user
│   │   │   └── migration.ts  # Migration script
│   │   ├── utils/
│   │   │   ├── baileys.ts    # Baileys connection handler
│   │   │   ├── jwt.ts        # JWT helper functions
│   │   │   ├── storage.ts    # File upload/attachment handling
│   │   │   └── logger.ts     # Logging utilities
│   │   └── ws/
│   │       └── socket.ts     # Socket.io event handlers
│   ├── uploads/              # Temporary file uploads
│   ├── data/                 # SQLite DB + Baileys auth state
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile (optional)
├── frontend/
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── App.jsx           # Root component
│   │   ├── main.jsx          # Entry point
│   │   ├── components/
│   │   │   ├── Layout.jsx    # Main layout wrapper
│   │   │   ├── Sidebar.jsx   # Left sidebar (chat list)
│   │   │   ├── ChatArea.jsx  # Main chat window
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   ├── CustomerList.jsx
│   │   │   ├── UserProfile.jsx
│   │   │   └── LoginScreen.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx # Main helpdesk screen
│   │   │   ├── Login.jsx     # Login page
│   │   │   └── StaffManagement.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.jsx
│   │   │   ├── useSocket.jsx
│   │   │   └── useChat.jsx
│   │   ├── services/
│   │   │   ├── api.ts        # HTTP client wrapper
│   │   │   └── socket.ts     # Socket.io client setup
│   │   └── styles/
│   │       └── tailwind.css
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── blueprint.md          # This document
│   └── deployment-guide.md   # How to deploy & run
├── scripts/
│   ├── setup.sh              # Initial setup script
│   ├── migrate-db.sh         # Database migration runner
│   └── backup.sh             # Backup database/script
├── .gitignore
├── docker-compose.yml (optional)
└── README.md
```

## Security Considerations

1. **Authentication:** JWT dengan expiry short-lived (1-2 jam), refresh token
2. **Password:** Hash pakai bcrypt (cost 12+)
3. **Rate Limiting:** Batas request per IP per endpoint
4. **CORS:** Whitelist domain frontend hanya
5. **HTTPS:** Wajib di production (SSL/TLS via certbot/Let's Encrypt)
6. **Input Validation:** Sanitasi semua input user sebelum masuk database
7. **CS Session:** Auto logout jika idle > 30 menit
8. **Backup Database:** Script otomatis harian untuk `.db` file

## Scaling Notes

- Baileys menggunakan ~50-100MB RAM per instance
- SQLite support concurrent reads baik, write serial
- Untuk skala besar (>50 CS, >10k customers/pelanggan):
  - Pertimbangkan PostgreSQL/MariaDB
  - Redis untuk cache session/socket
  - WebSocket scaling via Redis adapter
  - Horizontal scale via load balancer

## Checklist Deployments

- [ ] Setup server (VPS/cloud)
- [ ] Install Node.js + npm
- [ ] Clone repo ini
- [ ] Run `npm install` di backend & frontend
- [ ] Jalankan `scripts/setup.sh` (inisiil DB, seed default admin)
- [ ] QR Scan WhatsApp nomor baru
- [ ] Start backend server
- [ ] Build & serve frontend
- [ ] Setup Nginx reverse proxy + HTTPS (production)
- [ ] Test: login CS, kirim pesan ke nomor helpdesk, verifikasi reply muncul
- [ ] Monitor log & uptime
- [ ] Backup rutin setup cron job

---

**Last Updated:** 2026-04-22  
**Status:** Blueprint Draft v1
