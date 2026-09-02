"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * The door to the inventory console.
 *
 * Same emailed link as the shop's own sign-in — there is no second admin
 * password, because a second password is one more thing to leak and one more
 * thing nobody rotates. What is different here is where the link lands: back
 * on /admin, so signing in to manage stock does not drop you on the shop's
 * front page to find your own way back.
 */
export function AdminSignIn({ devHint }: { devHint: boolean }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, next: "/admin" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not send that link");
      setSent(true);
      setDevLink(typeof data.devLink === "string" ? data.devLink : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          A sign-in link is on its way to{" "}
          <span className="font-medium text-chalk">{email}</span>. It works once and
          expires in fifteen minutes, and it will bring you straight back here.
        </p>

        {devLink && (
          <div className="mt-6 rounded-xl border border-hairline bg-black/30 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-faint">
              Development — no email provider configured
            </p>
            <a
              href={devLink}
              className="mt-2 block break-all font-mono text-[11px] leading-relaxed text-orange-300 underline decoration-orange-300/40 underline-offset-2"
            >
              {devLink}
            </a>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setSent(false);
            setDevLink(null);
          }}
          className="mt-6 text-xs text-faint underline underline-offset-4 transition-colors hover:text-muted"
        >
          Use a different address
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Admin sign-in</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        The catalogue, the shelf and every stock change live behind this. Sign in with
        an admin address and we will email you a link.
      </p>

      <form onSubmit={submit} className="mt-7">
        <label
          htmlFor="admin-email"
          className="text-[11px] font-medium uppercase tracking-wider text-faint"
        >
          Email address
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourshop.com"
          className="mt-2 w-full rounded-xl border border-hairline bg-black/30 px-4 py-3 text-sm text-chalk outline-none transition-colors placeholder:text-faint focus:border-white/30"
        />

        {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={busy || email.trim() === ""}
          className="mt-5 w-full rounded-full bg-chalk py-3 text-sm font-semibold text-ink transition-opacity disabled:opacity-40"
        >
          {busy ? "Sending…" : "Email me a sign-in link"}
        </button>
      </form>

      {devHint && (
        <p className="mt-5 text-[11px] leading-relaxed text-faint">
          <code className="font-mono text-muted">ADMIN_EMAILS</code> is not set, so in
          development the first account to sign in gets the console. Set it before this
          shop goes anywhere public.
        </p>
      )}

      <Link
        href="/"
        className="mt-7 inline-block text-xs text-faint transition-colors hover:text-muted"
      >
        ← Back to the shop
      </Link>
    </div>
  );
}
