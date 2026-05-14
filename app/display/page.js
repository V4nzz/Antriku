'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

export default function DisplayPage() {
  const [currentServing, setCurrentServing] = useState(null);
  const [animating, setAnimating] = useState(false);
  const prevValueRef = useRef(null);

  useEffect(() => {
    const queueRef = ref(db, 'queue/current');
    const unsubscribe = onValue(queueRef, (snap) => {
      const value = snap.exists() ? snap.val() : 0;

      // Trigger animation only when the value actually changes
      if (prevValueRef.current !== null && prevValueRef.current !== value) {
        setAnimating(true);
        const timer = setTimeout(() => setAnimating(false), 700);
        // Store cleanup but don't double-clear
        prevValueRef._animTimer = timer;
      }

      prevValueRef.current = value;
      setCurrentServing(value);
    });

    return () => {
      unsubscribe();
      if (prevValueRef._animTimer) clearTimeout(prevValueRef._animTimer);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes numberPop {
          0%   { transform: scale(0.7); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .number-pop  { animation: numberPop 0.65s cubic-bezier(0.34,1.56,0.64,1) both; }
        .pulse-ring  { animation: pulseRing 0.7s ease-out both; }
      `}</style>

      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 select-none overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-3xl" />
        </div>

        {/* Header label */}
        <div className="relative z-10 mb-8 text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 text-sm font-medium tracking-widest uppercase">
              Sedang Dilayani
            </span>
          </div>
        </div>

        {/* Number display */}
        <div className="relative z-10 flex items-center justify-center">
          {/* Pulse ring on change */}
          {animating && (
            <span
              key={currentServing}
              className="pulse-ring absolute w-80 h-80 rounded-full border-4 border-indigo-400"
            />
          )}

          <div
            key={animating ? `anim-${currentServing}` : 'static'}
            className={`tabular-nums font-black leading-none text-white ${animating ? 'number-pop' : ''}`}
            style={{ fontSize: 'clamp(8rem, 30vw, 22rem)' }}
          >
            {currentServing ?? '—'}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-12 text-center">
          <p className="text-slate-600 text-sm tracking-wide uppercase font-medium">Antriku</p>
          <p className="text-slate-700 text-xs mt-1">Sistem Antrian Digital</p>
        </div>
      </main>
    </>
  );
}
