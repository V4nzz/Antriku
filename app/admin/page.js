'use client';

import { useState, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, set, get, onValue } from 'firebase/database';
import { db, auth } from '@/lib/firebase';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(null);
  const [total, setTotal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ─── Real-time listener (active only while logged in) ─────────────────────
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const queueRef = ref(db, 'queue');
    unsubscribeRef.current = onValue(queueRef, (snap) => {
      const data = snap.exists() ? snap.val() : { current: 0, total: 0 };
      setCurrent(data.current ?? 0);
      setTotal(data.total ?? 0);
    });
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [user]);

  // ─── Auth ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      setUser(credential.user);
    } catch (err) {
      setError('Email atau password salah. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (unsubscribeRef.current) unsubscribeRef.current();
    await signOut(auth);
    setUser(null);
    setCurrent(null);
    setTotal(null);
  };

  const handleNext = async () => {
    setActionLoading(true);
    const snap = await get(ref(db, 'queue'));
    const data = snap.exists() ? snap.val() : { current: 0, total: 0 };
    // Guard: jangan next jika sudah melebihi total
    if ((data.current ?? 0) >= (data.total ?? 0)) {
      setActionLoading(false);
      return;
    }
    const next = (data.current ?? 0) + 1;
    await set(ref(db, 'queue'), { current: next, total: data.total ?? 0 });
    setActionLoading(false);
  };

  const handleBack = async () => {
    setActionLoading(true);
    const snap = await get(ref(db, 'queue'));
    const data = snap.exists() ? snap.val() : { current: 0, total: 0 };
    // Guard: jangan back jika sudah di 0
    if ((data.current ?? 0) <= 0) {
      setActionLoading(false);
      return;
    }
    const prev = (data.current ?? 0) - 1;
    await set(ref(db, 'queue'), { current: prev, total: data.total ?? 0 });
    setActionLoading(false);
  };

  const handleReset = async () => {
    setActionLoading(true);
    await set(ref(db, 'queue'), { current: 0, total: 0 });
    setCurrent(0);
    setTotal(0);
    setActionLoading(false);
  };

  // ─── Login UI ──────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Logo / Title */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 mb-4">
                <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Admin Panel</h1>
              <p className="text-slate-400 text-sm mt-1">Manajemen Antrian Antriku</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/20"
              >
                {loading ? 'Masuk...' : 'Masuk'}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // ─── Dashboard UI ──────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
            <p className="text-slate-400 text-sm">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-slate-400 text-sm font-medium mb-2">Sedang Dilayani</p>
            <p className="text-6xl font-extrabold text-indigo-400 tabular-nums">
              {current ?? '—'}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-slate-400 text-sm font-medium mb-2">Total Tiket</p>
            <p className="text-6xl font-extrabold text-emerald-400 tabular-nums">
              {total ?? '—'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-4">
          {/* Back */}
          <button
            onClick={handleBack}
            disabled={actionLoading || current === null || current <= 0}
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-amber-500/10 hover:border-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-amber-400 font-bold text-lg transition-all duration-200 active:scale-95"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
            Back
          </button>
          {/* Next */}
          <button
            onClick={handleNext}
            disabled={actionLoading || current === null || total === null || current >= total}
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg shadow-lg shadow-indigo-500/20 transition-all duration-200 active:scale-95"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Next
          </button>
          {/* Reset */}
          <button
            onClick={handleReset}
            disabled={actionLoading}
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-red-400 font-bold text-lg transition-all duration-200 active:scale-95"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © {new Date().getFullYear()} Antriku Queue Management System
        </p>
      </div>
    </main>
  );
}
