# Antriku — Sistem Antrian Digital Real-Time

Aplikasi manajemen antrean digital berbasis web yang beroperasi secara real-time, dibangun dengan menggunakan **Next.js**, **Firebase Realtime Database**, **Firebase Authentication**, dan **Tailwind CSS**. 

Sistem ini dirancang untuk memudahkan pengunjung dalam mengambil tiket antrean secara mandiri, melihat status antrean secara langsung, serta memudahkan operator/admin dalam mengelola panggilan nomor antrean.

---

## ✨ Fitur Utama

- 🎫 **Halaman Pengguna (`/`)** — Pengunjung dapat mengambil nomor antrean baru secara mandiri.
  - **Retina-Ready Canvas Renderer** — Struk tiket digambar secara deterministik menggunakan HTML5 Canvas 2D API off-screen untuk menjamin cetakan gambar PNG yang tajam (high-res 3x), pixel-perfect, dan bebas error font/CSS.
  - **Pratinjau Tiket Interaktif** — Menampilkan modal struk tiket thermal digital sebelum pengguna mengunduhnya.
- 🖥️ **Halaman Layar Display (`/display`)** — Halaman display publik untuk memantau antrean yang sedang dilayani.
  - **Text-to-Speech (TTS) Otomatis** — Mengumumkan panggilan nomor antrean baru menggunakan suara manusia dalam Bahasa Indonesia (*"Nomor antrian 5, silakan menuju loket."*) melalui Web Speech API.
  - **Proteksi Audio Tumpang Tindih** — Membatalkan pengumuman suara sebelumnya secara instan jika admin mempercepat panggilan, guna menghindari lag suara.
  - **Tombol Mute/Unmute** — Kontrol audio interaktif yang dilengkapi dengan lampu indikator status kesiapan audio browser.
  - **Micro-Animations** — Transisi Pop Angka, gelombang lingkaran denyut (*pulse rings*), dan kedipan audio indicator untuk memberikan kesan aplikasi yang interaktif dan hidup.
- 🔐 **Dashboard Admin (`/admin`)** — Panel kendali khusus operator/loket untuk mengelola jalannya antrean.
  - **Otentikasi Aman** — Dilindungi sistem login menggunakan Firebase Authentication (Email & Password).
  - **Kebijakan Privasi Kustom** — Form login dilengkapi dengan checkbox persetujuan kebijakan data pribadi yang interaktif, di mana tombol Login akan terkunci hingga persetujuan dicentang.
  - **Identitas Kelompok Pengembang** — Menampilkan identitas **Capstone Project Kelompok B, Kelas 66 | 2026** di bawah panel login.
  - **Kontrol Panggilan** — Tombol **Next** (memanggil antrean selanjutnya), **Back** (memanggil ulang/kembali ke antrean sebelumnya), dan **Reset** (mengembalikan antrean ke awal/nol).
- 🔄 **Sinkronisasi Real-Time** — Semua halaman (Pengguna, Display, Admin) terhubung langsung dan tersinkronisasi secara instan (< 100ms) menggunakan Firebase Realtime Database.

---

## 🛠️ Spesifikasi Teknologi (Tech Stack)

| Komponen | Teknologi | Keterangan |
|---|---|---|
| **Framework Utama** | Next.js 16 (App Router) | React Server & Client Components |
| **Styling & UI** | Tailwind CSS | Modern, clean, dan responsive design |
| **Database Utama** | Firebase Realtime Database | Sinkronisasi data dinamis instan di semua client |
| **Sistem Keamanan** | Firebase Authentication | Mengamankan jalur akses operator di `/admin` |
| **Mesin Tiket** | HTML5 Canvas 2D API | Menggambar struk tiket resolusi tinggi secara dinamis |
| **Mesin Pengumuman** | Web Speech API | Sintesis suara lokal (`SpeechSynthesisUtterance`) |

---

## 📁 Struktur Direktori Proyek

```
antriku/
├── app/
│   ├── page.js          # Halaman Utama Pengguna (Mengambil Tiket & Status)
│   ├── layout.tsx       # Root Layout Next.js (Konfigurasi Font & Metadata)
│   ├── globals.css      # Styling Global & Tailwind CSS
│   ├── display/
│   │   └── page.js      # Halaman Layar Utama Display Publik (Visual & Suara TTS)
│   └── admin/
│       └── page.js      # Panel Kontrol Admin/Operator (Login-Protected & Cekbox)
├── lib/
│   └── firebase.js      # Inisialisasi Firebase Client SDK (DB & Auth)
├── public/
│   └── logo.jpeg        # Aset Logo Brand "Antriku"
├── README.md            # Dokumentasi Proyek
└── package.json         # Dependensi & Skrip Node.js
```

---

## 🚀 Panduan Memulai (Getting Started)

### 1. Kloning Repositori & Instalasi Dependensi
Jalankan perintah berikut di terminal Anda untuk mengunduh kode proyek dan menginstal modul pendukung:
```bash
git clone <url-repositori-anda>
cd antriku
npm install
```

### 2. Konfigurasi Database Firebase
Pengaturan koneksi Firebase terletak di file [lib/firebase.js](file:///d:/antriku/lib/firebase.js). Kredensial default kelompok kami sudah terpasang. Jika Anda ingin memigrasikannya ke database Firebase Anda sendiri:
1. Buat proyek baru di [Firebase Console](https://console.firebase.google.com/).
2. Aktifkan **Realtime Database** (pilih region Asia-Southeast/Singapore untuk latensi rendah).
3. Aktifkan **Authentication** dengan metode *Email/Password*.
4. Buat minimal 1 akun operator di tab *Users* Authentication untuk login admin.
5. Salin objek *Firebase Config* dari pengaturan proyek Anda dan ganti nilai `firebaseConfig` di file [lib/firebase.js](file:///d:/antriku/lib/firebase.js).

### 3. Menjalankan Server Pengembangan
Untuk melihat jalannya aplikasi di komputer lokal:
```bash
npm run dev
```
Setelah server menyala, buka tautan berikut di browser Anda:

- **Halaman Ambil Tiket (Pengguna):** [http://localhost:3000](http://localhost:3000)
- **Halaman Layar Display (Publik):** [http://localhost:3000/display](http://localhost:3000/display)
- **Halaman Panel Operator (Admin):** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🔊 Sintesis Suara Panggilan (TTS)

Sistem pemanggilan suara menggunakan **Web Speech API** bawaan browser untuk meminimalkan beban server dan kuota bandwidth internet.
- Format pengumuman terstandarisasi:
  > *"Nomor antrian [Nomor], silakan menuju loket."*
- Setiap kali nomor antrean bertambah (diperbarui), browser akan menghentikan pemanggilan suara aktif sebelumnya secara paksa menggunakan `window.speechSynthesis.cancel()` dan langsung memulai pengumuman nomor baru. Hal ini mencegah terjadinya *antrean suara* (audio lag) saat operator menekan tombol **Next** dengan cepat.

---

## 🏗️ Struktur Skema Firebase Realtime Database

Data disimpan dalam format JSON super sederhana untuk memastikan pembacaan dan penulisan data berlangsung secepat kilat:
```json
{
  "queue": {
    "current": 5,
    "total": 12
  }
}
```
*Keterangan:*
- `current`: Nomor antrean yang sedang dilayani saat ini (tampil besar di halaman Display).
- `total`: Total nomor tiket yang sudah dicetak/diambil oleh pengunjung pada hari tersebut.

---

## 📦 Daftar Perintah Build & Run

Berikut adalah skrip-skrip utilitas yang dapat dijalankan melalui npm:
- `npm run dev` — Menjalankan server lokal untuk proses pengembangan.
- `npm run build` — Melakukan kompilasi kode Next.js menjadi bundle produksi super cepat.
- `npm run start` — Menjalankan server produksi setelah proses build selesai.
- `npm run lint` — Memvalidasi dan memeriksa kesalahan pengetikan kode menggunakan ESLint.

---

## 👥 Pengembang (Kelompok B)

Proyek ini dikembangkan oleh kelompok pengembang **Capstone Project Kelompok B** sebagai bagian dari pemenuhan tugas akhir **Kelas 66 | Angkatan 2026**.

*Hak Cipta © 2026 Antriku — Sistem Antrian Digital.*
