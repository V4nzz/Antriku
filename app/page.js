'use client';

import { useState, useEffect } from 'react';
import { ref, set, get, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

export default function UserPage() {
  const [currentServing, setCurrentServing] = useState(null);
  const [myTicket, setMyTicket] = useState(null);
  const [loading, setLoading] = useState(false);

  // ─── Real-time listener for currently serving ──────────────────────────────
  useEffect(() => {
    const queueRef = ref(db, 'queue/current');
    const unsubscribe = onValue(queueRef, (snap) => {
      setCurrentServing(snap.exists() ? snap.val() : 0);
    });
    return () => unsubscribe();
  }, []);

  // ─── Get a ticket ──────────────────────────────────────────────────────────
  const handleGetTicket = async () => {
    if (myTicket !== null) return; // already has a ticket
    setLoading(true);
    try {
      const snap = await get(ref(db, 'queue'));
      const data = snap.exists() ? snap.val() : { current: 0, total: 0 };
      const newTotal = (data.total ?? 0) + 1;
      await set(ref(db, 'queue'), {
        current: data.current ?? 0,
        total: newTotal,
      });
      setMyTicket(newTotal);
    } finally {
      setLoading(false);
    }
  };

  const isBeingServed = myTicket !== null && myTicket === currentServing;
  const waitCount = myTicket !== null && currentServing !== null
    ? Math.max(0, myTicket - currentServing)
    : null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-6">
      {/* Title */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Sistem Antrian Digital
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Antriku</h1>
        <p className="text-slate-500 mt-2 text-base">Ambil tiket Anda dan pantau antrean secara langsung</p>
      </div>

      {/* Currently serving card */}
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

      {/* My ticket */}
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
        </div>
      )}

      {/* Get ticket button */}
      {myTicket === null ? (
        <button
          onClick={handleGetTicket}
          disabled={loading}
          className="w-full max-w-sm py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xl font-bold shadow-xl shadow-indigo-200 transition-all duration-200"
        >
          {loading ? 'Memproses...' : '🎫 Ambil Tiket'}
        </button>
      ) : (
        <p className="text-slate-400 text-sm">
          Harap tunggu nomor Anda dipanggil.
        </p>
      )}

      <p className="text-slate-300 text-xs mt-10">
        © {new Date().getFullYear()} Antriku · Sistem Antrian Digital
      </p>
    </main>
  );
}
