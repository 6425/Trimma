"use client";

import { useEffect, useState } from "react";

/** Trimma public launch — midnight Sri Lanka (UTC+5:30). */
const LIVE_AT = new Date("2026-07-19T00:00:00+05:30").getTime();

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  live: boolean;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function computeTimeLeft(): TimeLeft {
  const diff = LIVE_AT - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, live: true };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    live: false,
  };
}

function DigitBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="min-w-[3rem] sm:min-w-[3.5rem] px-2 py-2 sm:py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 shadow-[inset_0_2px_10px_rgba(0,0,0,0.65)]">
        <span className="trimma-live-countdown-digit block font-mono text-2xl sm:text-3xl font-black tabular-nums tracking-wider text-white leading-none">
          {value}
        </span>
      </div>
      <span className="trimma-live-countdown-label text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
        {label}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <span
      className="trimma-live-countdown-colon font-mono text-xl sm:text-2xl font-black text-zinc-700 pb-5 select-none animate-pulse"
      aria-hidden
    >
      :
    </span>
  );
}

export function LiveCountdown() {
  const [time, setTime] = useState<TimeLeft>(() => computeTimeLeft());

  useEffect(() => {
    const id = window.setInterval(() => setTime(computeTimeLeft()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (time.live) {
    return (
      <div className="mt-5 mb-1 inline-flex items-center gap-2 rounded-full bg-zinc-950 border border-[#FFFD40]/40 px-5 py-2.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFFD40] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#FFFD40]" />
        </span>
        <span className="text-sm font-black uppercase tracking-widest text-[#FFFD40]">We&apos;re live</span>
      </div>
    );
  }

  return (
    <div className="trimma-live-countdown mt-5 mb-1">
      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] text-zinc-700 mb-3">
        Going live · 19 July 2026
      </p>
      <div
        className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-3 rounded-2xl bg-white/95 border border-slate-200 shadow-lg backdrop-blur-sm"
        role="timer"
        suppressHydrationWarning
        aria-label={`Countdown to 19 July 2026: ${time.days} days, ${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds`}
      >
        <DigitBlock value={pad(time.days)} label="Days" />
        <Colon />
        <DigitBlock value={pad(time.hours)} label="Hrs" />
        <Colon />
        <DigitBlock value={pad(time.minutes)} label="Min" />
        <Colon />
        <DigitBlock value={pad(time.seconds)} label="Sec" />
      </div>
    </div>
  );
}
