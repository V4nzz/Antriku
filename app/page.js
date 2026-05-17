'use client';

import { useState, useEffect } from 'react';
import { ref, set, get, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

// ─── Helpers (Fungsi Pembantu) ──────────────────────────────────────────────────

/**
 * Memformat objek Date JavaScript menjadi teks string tanggal dengan format Indonesia.
 * Contoh output: "17 Mei 2026 - 09:20 WIB"
 */
function formatTicketDate(date) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const d = date.getDate();
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${d} ${m} ${y} - ${hh}:${mm} WIB`;
}

// ─── Canvas ticket renderer (Mesin Penggambar Tiket) ───────────────────────────
// Fungsi ini menggambar struk tiket antrean secara dinamis pada elemen <canvas> tersembunyi (off-screen).
// Menggunakan HTML5 Canvas 2D API untuk menjamin hasil cetak (download) 100% konsisten, tajam (high-res),
// dan bebas dari isu inkonsistensi rendering CSS/font antar browser (pixel-perfect output).

function drawTicketPNG(ticketNumber, dateTimeStr) {
  const W = 840;  // Lebar canvas: 280px × 3 (faktor skala Retina agar gambar sangat tajam saat dicetak)
  const S = 3;    // Faktor skala (scale factor) untuk rendering resolusi tinggi

  // Mendefinisikan ukuran font dengan memperhitungkan faktor skala (S)
  const pad   = 20 * S;
  const fontM = `bold ${11 * S}px "Courier New", Courier, monospace`;
  const fontS = `${8.5 * S}px "Courier New", Courier, monospace`;
  const fontN = `900 ${80 * S}px "Courier New", Courier, monospace`;
  const fontD = `${10 * S}px "Courier New", Courier, monospace`;
  const fontF = `italic ${8.5 * S}px "Courier New", Courier, monospace`;
  const fontB = `${7.5 * S}px "Courier New", Courier, monospace`;

  // Kalkulasi dinamis tinggi Canvas (H) dengan menelusuri alur tata letak dari atas ke bawah
  let y = 24 * S; // Jarak padding atas struk

  // Tambah tinggi teks brand utama (11px) + jarak celah (gap) 2px
  const brandH  = 11 * S;
  y += brandH + 2 * S;

  // Tambah tinggi sub-brand (8.5px) + jarak celah 16px
  const subH = 8.5 * S;
  y += subH + 16 * S;

  // Tambah tinggi garis pemisah putus-putus pertama (4px)
  y += 4 * S;

  // Tambah tinggi label "Nomor Antrian Anda" (8.5px) + jarak celah 2px
  y += 8.5 * S + 2 * S;

  // Tambah tinggi nomor antrean utama (80px) + padding atas 2px + padding bawah 12px
  const numTop = y + 2 * S;
  y += 80 * S + 2 * S + 12 * S;

  // Tambah tinggi garis pemisah putus-putus kedua (16px)
  y += 16 * S;

  // Tambah tinggi teks tanggal & waktu (10px) + jarak celah 16px
  const dtY = y;
  y += 10 * S + 16 * S;

  // Tambah tinggi garis pemisah putus-putus ketiga (16px)
  y += 16 * S;

  // Tambah tinggi catatan kaki (2 baris teks × tinggi 8.5px × spasi baris 1.6)
  const fnY = y;
  const fnLH = 8.5 * 1.6 * S;
  y += fnLH * 2;

  // Tambah tinggi watermark/footer brand (7.5px) + margin atas 10px
  y += 10 * S;
  const fbY = y;
  y += 7.5 * S;

  // Tambah jarak padding bawah struk
  y += 24 * S;

  const H = Math.ceil(y); // Membulatkan hasil kalkulasi tinggi total Canvas ke atas

  // Membuat elemen Canvas di memori (tidak langsung dirender ke layar)
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Mengisi latar belakang struk dengan warna putih bersih
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Titik tengah horizontal Canvas untuk meratakan teks ke tengah (alignment center)
  const cx = W / 2;

  // Fungsi pembantu untuk menggambar garis putus-putus horizontal khas kertas thermal struk kasir
  function dashedLine(atY) {
    ctx.save();
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth   = 1.5 * S;
    ctx.setLineDash([4 * S, 3 * S]); // Pola: 4px garis terisi, 3px kosong
    ctx.beginPath();
    ctx.moveTo(pad, atY);
    ctx.lineTo(W - pad, atY);
    ctx.stroke();
    ctx.restore();
  }

  // ─── Mulai Proses Penggambaran Struk ───
  let drawY = 24 * S;

  // 1. Menggambar Brand Utama: ★ ANTRIKU ★
  ctx.font      = fontM;
  ctx.fillStyle = '#4f46e5';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('★  A N T R I K U  ★', cx, drawY);
  drawY += brandH + 2 * S;

  // 2. Menggambar Sub-Brand: SISTEM ANTRIAN DIGITAL
  ctx.font      = fontS;
  ctx.fillStyle = '#9ca3af';
  ctx.fillText('S I S T E M   A N T R I A N   D I G I T A L', cx, drawY);
  drawY += subH + 16 * S;

  // 3. Menggambar Garis Pembatas Atas
  dashedLine(drawY);
  drawY += 4 * S;

  // 4. Menggambar Teks Petunjuk: NOMOR ANTRIAN ANDA
  ctx.font      = fontS;
  ctx.fillStyle = '#9ca3af';
  ctx.fillText('N O M O R   A N T R I A N   A N D A', cx, drawY);
  drawY += 8.5 * S + 2 * S;

  // 5. Menggambar Angka Nomor Antrean (Ukuran Raksasa & Tebal)
  drawY += 2 * S; // Jarak atas teks angka
  ctx.font      = fontN;
  ctx.fillStyle = '#4f46e5';
  ctx.fillText(String(ticketNumber), cx, drawY);
  drawY += 80 * S + 12 * S; // Update koordinat Y berdasarkan tinggi angka + padding bawah

  // 6. Menggambar Garis Pembatas Tengah
  dashedLine(drawY);
  drawY += 16 * S;

  // 7. Menggambar Teks Waktu Pengambilan Tiket
  ctx.font      = fontD;
  ctx.fillStyle = '#6b7280';
  ctx.fillText(dateTimeStr, cx, drawY);
  drawY += 10 * S + 16 * S;

  // 8. Menggambar Garis Pembatas Bawah
  dashedLine(drawY);
  drawY += 16 * S;

  // 9. Menggambar Catatan Kaki Baris 1
  ctx.font      = fontF;
  ctx.fillStyle = '#9ca3af';
  ctx.fillText('Simpan tiket ini sebagai bukti.', cx, drawY);
  drawY += fnLH;

  // 10. Menggambar Catatan Kaki Baris 2
  ctx.fillText('Tunjukkan kepada petugas saat dipanggil.', cx, drawY);
  drawY += fnLH;

  // 11. Menggambar Alamat Web Sistem (Watermark)
  drawY += 10 * S;
  ctx.font      = fontB;
  ctx.fillStyle = '#d1d5db';
  ctx.fillText('— antriku.vercel.app —', cx, drawY);

  return canvas;
}

// ─── Ticket Preview Card (Komponen Kartu Visual Pratinjau Struk di Modal) ──────
// Komponen React murni untuk menampilkan pratinjau struk thermal di layar.
// Menggunakan inline styles untuk mencocokkan tampilan visual secara akurat dengan struk hasil cetak Canvas.

function TicketCard({ ticketNumber, dateTimeStr }) {
  const s = {
    wrap: {
      fontFamily: "'Courier New', Courier, monospace",
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '24px 20px',
      width: '100%',
      boxSizing: 'border-box',
      textAlign: 'center',
      color: '#111827',
      userSelect: 'none',
    },
    brand: {
      fontSize: '11px',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '0.22em',
      color: '#4f46e5',
      marginBottom: '2px',
    },
    brandSub: {
      fontSize: '8.5px',
      color: '#9ca3af',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      marginBottom: '16px',
    },
    divider: {
      borderTop: '1.5px dashed #d1d5db',
      marginBottom: '16px',
    },
    dividerTight: {
      borderTop: '1.5px dashed #d1d5db',
      marginBottom: '4px',
    },
    label: {
      fontSize: '8.5px',
      textTransform: 'uppercase',
      letterSpacing: '0.14em',
      color: '#9ca3af',
      marginBottom: '2px',
    },
    number: {
      fontSize: '80px',
      fontWeight: 900,
      color: '#4f46e5',
      lineHeight: 1,
      letterSpacing: '-3px',
      display: 'block',
      margin: '0',
      paddingTop: '2px',
      paddingBottom: '12px',
    },
    datetime: {
      fontSize: '10px',
      color: '#6b7280',
      marginBottom: '16px',
    },
    footnote: {
      fontSize: '8.5px',
      color: '#9ca3af',
      fontStyle: 'italic',
      lineHeight: 1.6,
    },
    footerBrand: {
      fontSize: '7.5px',
      color: '#d1d5db',
      marginTop: '10px',
      letterSpacing: '0.06em',
    },
  };

  return (
    <div style={s.wrap}>
      <p style={s.brand}>★ ANTRIKU ★</p>
      <p style={s.brandSub}>Sistem Antrian Digital</p>
      <div style={s.dividerTight} />
      <p style={s.label}>Nomor Antrian Anda</p>
      <p style={s.number}>{ticketNumber}</p>
      <div style={s.divider} />
      <p style={s.datetime}>{dateTimeStr}</p>
      <div style={s.divider} />
      <p style={s.footnote}>
        Simpan tiket ini sebagai bukti.<br />
        Tunjukkan kepada petugas saat dipanggil.
      </p>
      <p style={s.footerBrand}>— antriku.vercel.app —</p>
    </div>
  );
}

// ─── Main Component (Halaman Utama Sisi Pengguna) ─────────────────────────────

export default function UserPage() {
  // --- React States (Penyimpan Status Halaman) ---
  const [currentServing, setCurrentServing] = useState(null); // Nomor antrean yang sedang dilayani saat ini
  const [myTicket, setMyTicket]             = useState(null); // Nomor antrean milik pengguna (jika sudah mengambil tiket)
  const [ticketDateTime, setTicketDateTime] = useState('');   // Menyimpan waktu pengambilan tiket milik pengguna
  const [loading, setLoading]               = useState(false); // Status loading saat proses pembuatan tiket di Firebase
  const [downloading, setDownloading]       = useState(false); // Status loading saat konversi struk canvas & download PNG
  const [showModal, setShowModal]           = useState(false); // Kontrol buka/tutup Modal pratinjau struk tiket

  // ─── Real-time listener (Pendengar Data Real-time dari Firebase) ─────────────────
  // Hook useEffect ini berjalan saat komponen pertama kali dipasang (mounted).
  // Ia memantau secara real-time perubahan pada path "queue/current" di Firebase Realtime Database.
  useEffect(() => {
    const queueRef = ref(db, 'queue/current');
    
    // Fungsi onValue mendaftarkan callback yang akan dipanggil secara otomatis setiap kali data di Firebase berubah
    const unsubscribe = onValue(queueRef, (snap) => {
      // Jika data ada, pasang ke state, jika tidak ada fallback ke 0
      setCurrentServing(snap.exists() ? snap.val() : 0);
    });

    // Membersihkan listener database saat pengguna meninggalkan halaman (unmount) demi menghindari kebocoran memori
    return () => unsubscribe();
  }, []);

  // ─── Get ticket (Proses Pengambilan Tiket Baru) ─────────────────────────
  // Fungsi ini dipanggil ketika tombol "Ambil Tiket" ditekan oleh pengguna.
  const handleGetTicket = async () => {
    // Jika pengguna sudah memiliki tiket, langsung buka kembali modal struk tiketnya
    if (myTicket !== null) {
      setShowModal(true);
      return;
    }
    setLoading(true);
    try {
      // 1. Ambil data antrean saat ini dari Firebase
      const snap = await get(ref(db, 'queue'));
      const data = snap.exists() ? snap.val() : { current: 0, total: 0 };
      
      // 2. Increment total tiket dengan menambahkan 1
      const newTotal = (data.total ?? 0) + 1;
      
      // 3. Simpan kembali data terbaru ke Firebase Database
      await set(ref(db, 'queue'), {
        current: data.current ?? 0,
        total: newTotal,
      });

      // 4. Catat waktu pengambilan tiket & set nomor tiket pengguna di state lokal
      setTicketDateTime(formatTicketDate(new Date()));
      setMyTicket(newTotal);

      // 5. Tampilkan modal pop-up pratinjau struk tiket secara otomatis
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  // ─── Download ticket sebagai PNG (Menggunakan Mesin Canvas 2D) ────────────────
  // Fungsi untuk mengekspor gambar tiket PNG resolusi tinggi secara murni di sisi client.
  const handleDownload = () => {
    setDownloading(true);
    try {
      // 1. Gambar struk secara dinamis ke canvas off-screen
      const canvas = drawTicketPNG(myTicket, ticketDateTime);
      
      // 2. Buat tautan jangkar (anchor link) palsu untuk menginisiasi pengunduhan browser
      const link = document.createElement('a');
      link.download = `Ticket-${myTicket}.png`;
      link.href = canvas.toDataURL('image/png'); // Konversi canvas menjadi DataURL base64 format PNG
      link.click(); // Trigger klik otomatis untuk memulai download file
    } finally {
      setDownloading(false);
    }
  };

  // --- Logika Status Antrean ---
  // Menentukan apakah nomor tiket pengguna saat ini sedang dipanggil oleh admin
  const isBeingServed = myTicket !== null && myTicket === currentServing;
  
  // Menghitung berapa banyak sisa antrean yang harus ditunggu sebelum giliran pengguna tiba
  const waitCount =
    myTicket !== null && currentServing !== null
      ? Math.max(0, myTicket - currentServing)
      : null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-6">

      {/* ─── Header & Judul Halaman ─── */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Sistem Antrian Digital
        </div>
        <img src="/logo.jpeg" alt="Antriku" className="h-16 md:h-20 mx-auto mb-2 object-contain" />
        <p className="text-slate-500 mt-2 text-base">Ambil tiket Anda dan pantau antrean secara langsung</p>
      </div>

      {/* ─── Kartu Pemantau Antrean yang Sedang Dilayani (Real-time) ─── */}
      <div className="w-full max-w-sm mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-100/60 p-6 text-center">
          <p className="text-slate-500 text-sm font-medium mb-1">Sedang Dilayani</p>
          <p className="text-7xl font-black text-indigo-600 tabular-nums leading-none py-2">
            {currentServing ?? '—'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 text-xs">Live</span>
          </div>
        </div>
      </div>

      {/* ─── Kartu Status Tiket Milik Pengguna (Muncul Setelah Mengambil Tiket) ─── */}
      {myTicket !== null && (
        <div className={`w-full max-w-sm mb-6 rounded-2xl border p-5 text-center transition-all ${
          isBeingServed
            ? 'bg-emerald-50 border-emerald-200 shadow-lg shadow-emerald-100'
            : 'bg-indigo-50 border-indigo-100'
        }`}>
          {isBeingServed ? (
            <>
              <p className="text-emerald-700 font-semibold text-sm">🎉 Giliran Anda!</p>
              <p className="text-4xl font-black text-emerald-600 mt-1 tabular-nums">{myTicket}</p>
              <p className="text-emerald-600 text-sm mt-1">Silakan menuju loket</p>
            </>
          ) : (
            <>
              <p className="text-indigo-600 font-semibold text-sm mb-1">Nomor Tiket Anda</p>
              <p className="text-4xl font-black text-indigo-700 tabular-nums">{myTicket}</p>
              {waitCount !== null && waitCount > 0 && (
                <p className="text-slate-500 text-sm mt-2">
                  Menunggu <span className="font-semibold text-slate-700">{waitCount}</span> antrian lagi
                </p>
              )}
            </>
          )}
          {/* Tombol pintasan untuk membuka kembali modal struk tiket */}
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 text-xs text-indigo-500 hover:text-indigo-700 underline underline-offset-2 transition-colors"
          >
            Lihat tiket saya →
          </button>
        </div>
      )}

      {/* ─── Tombol Interaktif Pengambilan Tiket / Label Keterangan ─── */}
      {myTicket === null ? (
        <button
          onClick={handleGetTicket}
          disabled={loading}
          className="w-full max-w-sm py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-white text-xl font-bold shadow-xl shadow-indigo-200 transition-all duration-200"
        >
          {loading ? '⏳ Memproses...' : '🎫 Ambil Tiket'}
        </button>
      ) : (
        <p className="text-slate-400 text-sm">Harap tunggu nomor Anda dipanggil.</p>
      )}

      {/* ─── Footer Halaman ─── */}
      <div className="text-center mt-10">
        <img src="/logo.jpeg" alt="Antriku" className="h-5 mx-auto mb-2 opacity-40 grayscale hover:grayscale-0 transition-all object-contain" />
        <p className="text-slate-300 text-xs">© {new Date().getFullYear()} Sistem Antrian Digital</p>
      </div>

      {/* ─── Modal Pop-up Pratinjau & Download Struk Tiket ─── */}
      {showModal && myTicket !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }} // Tutup modal jika klik di luar area struk
        >
          <div className="w-full max-w-xs animate-[fadeInUp_0.25s_ease-out]">

            {/* Header Modal */}
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-white font-semibold text-sm tracking-wide">🎟️ Tiket Anda</p>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg leading-none transition-colors"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            {/* Kartu Pratinjau Visual Struk */}
            <div className="shadow-2xl shadow-black/30 rounded-2xl ring-1 ring-white/10 overflow-hidden">
              <TicketCard
                ticketNumber={myTicket}
                dateTimeStr={ticketDateTime}
              />
            </div>

            {/* Tombol Unduh Struk Tiket sebagai Gambar PNG */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="mt-4 w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-indigo-900/40 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {downloading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Mengunduh...
                </>
              ) : (
                <>
                  ⬇️ Unduh Tiket sebagai Gambar
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-slate-500 mt-3">
              File akan tersimpan sebagai <span className="text-slate-300 font-mono">Ticket-{myTicket}.png</span>
            </p>
          </div>
        </div>
      )}

      {/* ─── Animasi CSS Transisi Modal Masuk ─── */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
