'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

export default function DisplayPage() {
  const [currentServing, setCurrentServing] = useState(null);
  const [animating, setAnimating]           = useState(false);
  const [isMuted, setIsMuted]               = useState(false);
  const [audioReady, setAudioReady]         = useState(false);

  const prevValueRef  = useRef(null);
  const isMutedRef    = useRef(false); // shadow ref so the Firebase callback always reads the latest value
  const isInitialLoad = useRef(true);

  // Keep isMutedRef in sync with state
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Detect Web Speech API availability on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setAudioReady(true);
    }
  }, []);

  // Firebase listener + TTS trigger
  useEffect(() => {
    const queueRef = ref(db, 'queue/current');

    const unsubscribe = onValue(queueRef, (snap) => {
      const value = snap.exists() ? snap.val() : 0;

      // Skip if nothing changed
      if (prevValueRef.current === value) return;

      // Trigger animation only on real updates (not initial load)
      if (!isInitialLoad.current) {
        setAnimating(true);
        const timer = setTimeout(() => setAnimating(false), 700);
        prevValueRef._animTimer = timer;

        // Voice announcement
        if (value && value !== 0 && !isMutedRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel(); // stop any ongoing speech
          const utterance = new SpeechSynthesisUtterance(
            `Nomor antrian ${value}, silakan menuju loket.`
          );
          utterance.lang  = 'id-ID';
          utterance.rate  = 0.95;
          utterance.pitch = 1;
          window.speechSynthesis.speak(utterance);
        }
      }

      prevValueRef.current = value;
      isInitialLoad.current = false;
      setCurrentServing(value);
    });

    return () => {
      unsubscribe();
      if (prevValueRef._animTimer) clearTimeout(prevValueRef._animTimer);
      // Stop any lingering speech on unmount
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleMute = () => setIsMuted((prev) => !prev);

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
        @keyframes speakerPing {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .number-pop  { animation: numberPop 0.65s cubic-bezier(0.34,1.56,0.64,1) both; }
        .pulse-ring  { animation: pulseRing 0.7s ease-out both; }
        .speaker-ping { animation: speakerPing 1.8s ease-in-out infinite; }
      `}</style>

      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 select-none overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-3xl" />
        </div>

        {/* Audio indicator + Mute button — top-right corner */}
        <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
          {/* Readiness dot */}
          <span
            title={audioReady ? 'Audio siap' : 'Audio tidak tersedia'}
            className={`w-2.5 h-2.5 rounded-full ${
              audioReady
                ? isMuted
                  ? 'bg-amber-400'
                  : 'bg-emerald-400 speaker-ping'
                : 'bg-red-400'
            }`}
          />

          {/* Mute / Unmute button */}
          {audioReady && (
            <button
              id="btn-toggle-mute"
              onClick={toggleMute}
              title={isMuted ? 'Aktifkan suara' : 'Matikan suara'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 shadow-sm
                ${isMuted
                  ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
            >
              {/* Speaker icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3.5 h-3.5"
              >
                {isMuted ? (
                  /* speaker-x-mark */
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.318 1.97v6.053c0 1.305 1.177 1.97 2.318 1.97h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06Zm5.78 6.44a.75.75 0 0 1 0 1.06L18.06 12.81l1.22 1.25a.75.75 0 1 1-1.08 1.04l-1.22-1.25-1.22 1.25a.75.75 0 1 1-1.08-1.04l1.22-1.25-1.22-1.31a.75.75 0 1 1 1.08-1.04l1.22 1.25 1.22-1.25a.75.75 0 0 1 1.06 0Z" />
                ) : (
                  /* speaker-wave */
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.318 1.97v6.053c0 1.305 1.177 1.97 2.318 1.97h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06Zm4.934 1.627a.75.75 0 0 1 1.06.006A8.224 8.224 0 0 1 21.75 12a8.224 8.224 0 0 1-2.256 5.307.75.75 0 0 1-1.066-1.054A6.725 6.725 0 0 0 20.25 12a6.725 6.725 0 0 0-1.822-4.253.75.75 0 0 1 .006-1.06Zm-1.961 2.8a.75.75 0 0 1 1.061.006 5.25 5.25 0 0 1 0 6.914.75.75 0 0 1-1.06-1.06 3.75 3.75 0 0 0 0-4.793.75.75 0 0 1-.001-1.067Z" />
                )}
              </svg>
              {isMuted ? 'Suara Mati' : 'Suara Aktif'}
            </button>
          )}
        </div>

        {/* Header label */}
        <div className="relative z-10 mb-8 text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-slate-200 bg-white/50 backdrop-blur shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-600 text-sm font-medium tracking-widest uppercase">
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
            className={`tabular-nums font-black leading-none text-slate-900 ${animating ? 'number-pop' : ''}`}
            style={{ fontSize: 'clamp(8rem, 30vw, 22rem)' }}
          >
            {currentServing ?? '—'}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-12 text-center">
          <img src="/logo.jpeg" alt="Antriku" className="h-10 mx-auto object-contain" />
          <p className="text-slate-500 text-xs mt-3">Sistem Antrian Digital</p>
        </div>
      </main>
    </>
  );
}
