"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { wordmark } from "@/lib/fonts";
import { Monogram } from "./Monogram";

/**
 * The access-code screen, in front of the whole site for the beta.
 *
 * Dressed like the sign-in screen, so it reads as the front door of the same
 * app. One field, one button; the right code signs this phone in as a tester
 * and drops it where it was headed.
 */
export function AccessGate({ next }: { next: string }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        // A full load, so every part of the app starts signed in.
        window.location.replace(next);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "That code isn’t right.");
      setShake((n) => n + 1);
    } catch {
      setError("Couldn’t reach the shop. Try again.");
    }
    setBusy(false);
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col overflow-y-auto px-6 pb-[calc(1.75rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]"
      style={{
        background:
          "linear-gradient(180deg, #05060f 0%, #10154f 24%, #2a3bd6 50%, #6a62f2 70%, #b9a6f3 86%, #ecd9ee 100%)",
      }}
    >
      <div className="flex flex-1 flex-col items-center justify-center pt-10">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 22 }}
          className="flex flex-col items-center gap-4"
        >
          <span className="grid size-24 place-items-center rounded-[28px] bg-white text-[#0b0b14] shadow-[0_18px_50px_rgba(10,10,40,0.45)]">
            <Monogram className="size-[84px]" />
          </span>
          <span className={`text-[44px] leading-none text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.25)] ${wordmark.className}`}>
            Blind Box
          </span>
        </motion.div>
      </div>

      <form onSubmit={submit} className="mx-auto w-full max-w-md">
        <p className="mb-4 text-center text-[15px] font-medium text-[#0e0b2a]">Enter your access code</p>
        <motion.div key={shake} animate={shake ? { x: [0, -10, 9, -6, 4, 0] } : undefined} transition={{ duration: 0.4 }}>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            type="password"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="Access code"
            aria-label="Access code"
            aria-invalid={error ? true : undefined}
            className="h-14 w-full rounded-full bg-white px-6 text-center text-[17px] text-[#0e0b2a] outline-none placeholder:text-[#0e0b2a]/40 focus:ring-2 focus:ring-[#4b48d8]/50"
          />
        </motion.div>
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="mt-3 flex h-14 w-full items-center justify-center rounded-full bg-[#0e0b2a] text-[17px] font-semibold text-white transition-[transform,opacity] active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Checking…" : "Enter"}
        </button>
        <p role="alert" className="mt-3 h-5 text-center text-[14px] font-medium text-[#7a1030]">
          {error}
        </p>
      </form>
    </div>
  );
}
