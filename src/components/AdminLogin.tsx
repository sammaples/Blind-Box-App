"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Password gate for the inventory console. */
export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not sign in");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
      <p className="mt-2 text-sm text-muted">
        Stocking, restocking and pulling pieces from the shelves.
      </p>

      <label className="mt-6 block">
        <span className="text-[11px] uppercase tracking-[0.16em] text-faint">Password</span>
        <input
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-hairline bg-ink px-4 py-3 text-sm outline-none transition-colors focus:border-white/30"
        />
      </label>

      <button
        type="submit"
        disabled={busy || password === ""}
        className="mt-5 w-full rounded-xl bg-chalk py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
      >
        {busy ? "Checking…" : "Sign in"}
      </button>
      {error && <p className="mt-3 text-center text-xs text-rose-400">{error}</p>}
    </form>
  );
}
