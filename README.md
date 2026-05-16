# Antriku — Sistem Antrian Digital

A real-time digital queue management system built with **Next.js**, **Firebase Realtime Database**, and **Tailwind CSS**.

---

## ✨ Features

- 🎫 **User Page** — Visitors take a ticket and track their queue position in real time.
- 🖥️ **Display Page** — Public screen showing the currently-served number with animations and **automatic voice announcements** (Text-to-Speech, Indonesian).
- 🔐 **Admin Dashboard** — Secure login for operators to advance, rewind, or reset the queue.
- 🔔 **Live sync** — All pages reflect queue changes instantly via Firebase `onValue` listeners.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | JavaScript / TypeScript |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Backend / DB | [Firebase Realtime Database](https://firebase.google.com/products/realtime-database) |
| Auth | Firebase Authentication (email & password) |
| TTS | Web Speech API (`SpeechSynthesisUtterance`) |

---

## 📁 Project Structure

```
antriku/
├── app/
│   ├── page.js          # User page — take a ticket & track position
│   ├── display/
│   │   └── page.js      # Public display screen with TTS announcements
│   ├── admin/
│   │   └── page.js      # Admin dashboard (login-protected)
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   └── firebase.js      # Firebase app initialization (db, auth)
└── public/
    └── logo.jpeg
```

---

## 🚀 Getting Started

### 1. Clone & install

```bash
git clone <repo-url>
cd antriku
npm install
```

### 2. Configure Firebase

The Firebase config is already embedded in `lib/firebase.js`. If you fork this project, replace the config object with your own credentials from the Firebase console.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

| Route | Description |
|---|---|
| `/` | User page — take a ticket |
| `/display` | Public queue display screen |
| `/admin` | Admin dashboard (requires login) |

---

## 🔊 Voice Announcements (TTS)

The Display page uses the native **Web Speech API** to announce each new queue number in Indonesian:

> *"Nomor antrian 5, silakan menuju loket."*

- Any ongoing speech is cancelled before playing the new announcement, preventing audio lag when the admin presses **Next** rapidly.
- A **Mute/Unmute** button and a status indicator dot are shown in the top-right corner of the display.
- The TTS button is hidden automatically on browsers that don't support the Web Speech API.

---

## 🔐 Admin Controls

Log in at `/admin` with your Firebase Auth credentials to access:

| Button | Action |
|---|---|
| **Next** | Advance the queue by 1 (disabled when all tickets are served) |
| **Back** | Rewind the queue by 1 (disabled at 0) |
| **Reset** | Reset both `current` and `total` to 0 |

---

## 🏗️ Firebase Database Structure

```json
{
  "queue": {
    "current": 3,
    "total": 10
  }
}
```

---

## 📦 Scripts

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run start  # Run production build
npm run lint   # Run ESLint
```

---

## 📄 License

MIT © Antriku
