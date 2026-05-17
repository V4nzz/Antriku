'use client';

import { useState, useEffect } from 'react';
import { ref, set, get, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Canvas ticket renderer ──────────────────────────────────────────────────
// Draws the ticket to an off-screen <canvas> using the 2D API.
// This is 100% deterministic — no CSS involved, pixel-perfect output.

function drawTicketPNG(ticketNumber, dateTimeStr) {
  const W = 840;  // 280px × 3 (retina)
  const S = 3;    // scale factor

  // All measurements are in "design px" then multiplied by S
  const pad   = 20 * S;
  const fontM = `bold ${11 * S}px "Courier New", Courier, monospace`;
  const fontS = `${8.5 * S}px "Courier New", Courier, monospace`;
  const fontN = `900 ${80 * S}px "Courier New", Courier, monospace`;
  const fontD = `${10 * S}px "Courier New", Courier, monospace`;
  const fontF = `italic ${8.5 * S}px "Courier New", Courier, monospace`;
  const fontB = `${7.5 * S}px "Courier New", Courier, monospace`;

  // Pre-calculate height by walking through the layout
  let y = 24 * S; // top padding

  // brand (11px) + 2px gap
  const brandH  = 11 * S;
  y += brandH + 2 * S;

  // brandSub (8.5px) + 16px gap
  const subH = 8.5 * S;
  y += subH + 16 * S;

  // dividerTight: line + 4px
  y += 4 * S;

  // label (8.5px) + 2px gap
  y += 8.5 * S + 2 * S;

  // number (80px) + 2px top pad + 12px bottom pad
  const numTop = y + 2 * S;
  y += 80 * S + 2 * S + 12 * S;

  // divider: line + 16px
  y += 16 * S;

  // datetime (10px) + 16px gap
  const dtY = y;
  y += 10 * S + 16 * S;

  // divider: line + 16px
  y += 16 * S;

  // footnote: 2 lines × 8.5px × 1.6 lineHeight
  const fnY = y;
  const fnLH = 8.5 * 1.6 * S;
  y += fnLH * 2;

  // brand footer (7.5px) + 10px top margin
  y += 10 * S;
  const fbY = y;
  y += 7.5 * S;

  // bottom padding
  y += 24 * S;

  const H = Math.ceil(y);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // -- Draw helper --
  const cx = W / 2; // center x

  function dashedLine(atY) {
    ctx.save();
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth   = 1.5 * S;
    ctx.setLineDash([4 * S, 3 * S]);
    ctx.beginPath();
    ctx.moveTo(pad, atY);
    ctx.lineTo(W - pad, atY);
    ctx.stroke();
    ctx.restore();
  }

  // -- Layout pass (draw from top) --
  let drawY = 24 * S;

  // ★ ANTRIKU ★
  ctx.font      = fontM;
  ctx.fillStyle = '#4f46e5';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('★  A N T R I K U  ★', cx, drawY);
  drawY += brandH + 2 * S;

  // SISTEM ANTRIAN DIGITAL
  ctx.font      = fontS;
  ctx.fillStyle = '#9ca3af';
  ctx.fillText('S I S T E M   A N T R I A N   D I G I T A L', cx, drawY);
  drawY += subH + 16 * S;

  // Divider (tight)
  dashedLine(drawY);
  drawY += 4 * S;

  // NOMOR ANTRIAN ANDA
  ctx.font      = fontS;
  ctx.fillStyle = '#9ca3af';
  ctx.fillText('N O M O R   A N T R I A N   A N D A', cx, drawY);
  drawY += 8.5 * S + 2 * S;

  // Queue number
  drawY += 2 * S; // paddingTop
  ctx.font      = fontN;
  ctx.fillStyle = '#4f46e5';
  ctx.fillText(String(ticketNumber), cx, drawY);
  drawY += 80 * S + 12 * S; // number height + paddingBottom

  // Divider
  dashedLine(drawY);
  drawY += 16 * S;

  // Date & time
  ctx.font      = fontD;
  ctx.fillStyle = '#6b7280';
  ctx.fillText(dateTimeStr, cx, drawY);
  drawY += 10 * S + 16 * S;

  // Divider
  dashedLine(drawY);
  drawY += 16 * S;

  // Footnote line 1
  ctx.font      = fontF;
  ctx.fillStyle = '#9ca3af';
  ctx.fillText('Simpan tiket ini sebagai bukti.', cx, drawY);
  drawY += fnLH;

  // Footnote line 2
  ctx.fillText('Tunjukkan kepada petugas saat dipanggil.', cx, drawY);
  drawY += fnLH;

  // Brand footer
  drawY += 10 * S;
  ctx.font      = fontB;
  ctx.fillStyle = '#d1d5db';
  ctx.fillText('— antriku.vercel.app —', cx, drawY);

  return canvas;
}

// ─── Ticket Preview Card (visual only — for the modal) ───────────────────────
// Uses ONLY inline styles so it matches the Canvas-drawn version.

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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UserPage() {
  const [currentServing, setCurrentServing] = useState(null);
  const [myTicket, setMyTicket]             = useState(null);
  const [ticketDateTime, setTicketDateTime] = useState('');
  const [loading, setLoading]               = useState(false);
  const [downloading, setDownloading]       = useState(false);
  const [showModal, setShowModal]           = useState(false);

  // ─── Real-time listener ─────────────────────────────────────────────────
  useEffect(() => {
    const queueRef = ref(db, 'queue/current');
    const unsubscribe = onValue(queueRef, (snap) => {
      setCurrentServing(snap.exists() ? snap.val() : 0);
    });
    return () => unsubscribe();
  }, []);

  // ─── Get ticket ─────────────────────────────────────────────────────────
  const handleGetTicket = async () => {
    if (myTicket !== null) {
      setShowModal(true);
      return;
    }
    setLoading(true);
    try {
      const snap = await get(ref(db, 'queue'));
      const data = snap.exists() ? snap.val() : { current: 0, total: 0 };
      const newTotal = (data.total ?? 0) + 1;
      await set(ref(db, 'queue'), {
        current: data.current ?? 0,
        total: newTotal,
      });
      setTicketDateTime(formatTicketDate(new Date()));
      setMyTicket(newTotal);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  // ─── Download ticket as PNG (Canvas 2D — no html2canvas) ────────────────
  const handleDownload = () => {
    setDownloading(true);
    try {
      const canvas = drawTicketPNG(myTicket, ticketDateTime);
      const link = document.createElement('a');
      link.download = `Ticket-${myTicket}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  const isBeingServed = myTicket !== null && myTicket === currentServing;
  const waitCount =
    myTicket !== null && currentServing !== null
      ? Math.max(0, myTicket - currentServing)
      : null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-6">

      {/* ─── Title ─────────────────────────────────────────────────────── */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Sistem Antrian Digital
        </div>
        <img src="/logo.jpeg" alt="Antriku" className="h-16 md:h-20 mx-auto mb-2 object-contain" />
        <p className="text-slate-500 mt-2 text-base">Ambil tiket Anda dan pantau antrean secara langsung</p>
      </div>

      {/* ─── Currently serving card ─────────────────────────────────────── */}
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

      {/* ─── My ticket status card ──────────────────────────────────────── */}
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
          {/* Re-open preview */}
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 text-xs text-indigo-500 hover:text-indigo-700 underline underline-offset-2 transition-colors"
          >
            Lihat tiket saya →
          </button>
        </div>
      )}

      {/* ─── Get ticket / waiting ───────────────────────────────────────── */}
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

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <div className="text-center mt-10">
        <img src="/logo.jpeg" alt="Antriku" className="h-5 mx-auto mb-2 opacity-40 grayscale hover:grayscale-0 transition-all object-contain" />
        <p className="text-slate-300 text-xs">© {new Date().getFullYear()} Sistem Antrian Digital</p>
      </div>

      {/* ─── Ticket Preview Modal ─────────────────────────────────────────── */}
      {showModal && myTicket !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full max-w-xs animate-[fadeInUp_0.25s_ease-out]">

            {/* Modal header */}
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

            {/* The visual preview card */}
            <div className="shadow-2xl shadow-black/30 rounded-2xl ring-1 ring-white/10 overflow-hidden">
              <TicketCard
                ticketNumber={myTicket}
                dateTimeStr={ticketDateTime}
              />
            </div>

            {/* Download button */}
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

      {/* ─── Keyframe for modal entrance ─────────────────────────────────── */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
