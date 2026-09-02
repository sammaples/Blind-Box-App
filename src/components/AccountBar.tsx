"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export interface Account {
  id: string;
  email: string | null;
  /** Whether this account may reach the inventory console. */
  isAdmin: boolean;
}

interface AccountState {
  account: Account | null;
  loading: boolean;
  /** Opens the sign-in sheet. `reason` explains why it appeared. */
  signIn: (reason?: string) => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AccountState | null>(null);

export function useAccount(): AccountState {
  const value = useContext(Ctx);
  if (!value) throw new Error("useAccount must be used inside AccountProvider");
  return value;
}

/**
 * Holds who is signed in, and owns the one sign-in sheet the whole app uses —
 * so asking someone to sign in never means sending them to another page and
 * losing what they were doing.
 */
export function AccountProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setAccount(data.account ?? null);
    } catch {
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Coming back from a sign-in link: pick up the session and tidy the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("signin") && !params.has("claimed")) return;

    void refresh();
    const claimed = Number(params.get("claimed") ?? 0);
    if (params.get("signin") === "expired") {
      setPrompt("That link has expired or was already used. Here is a fresh one.");
    } else if (claimed > 0) {
      setPrompt(null);
    }
    window.history.replaceState({}, "", window.location.pathname + window.location.hash);
  }, [refresh]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    setAccount(null);
    router.refresh();
  }, [router]);

  return (
    <Ctx.Provider
      value={{
        account,
        loading,
        signIn: (reason) => setPrompt(reason ?? ""),
        signOut,
        refresh,
      }}
    >
      {children}
      <SignInSheet
        open={prompt !== null}
        reason={prompt || null}
        onClose={() => setPrompt(null)}
        onSignedIn={() => {
          setPrompt(null);
          void refresh();
          router.refresh();
        }}
      />
    </Ctx.Provider>
  );
}

/**
 * The way into the inventory console from inside the app.
 *
 * Shown only to accounts that can actually use it — an owner should not have to
 * remember a URL to restock, and everyone else should not be invited to a door
 * that will refuse them. It is the console's own answer being asked here, not a
 * second guess at it, so this can never offer a link that then rejects you.
 *
 * On a phone it keeps the icon and drops the word, because the header has three
 * other things in it and 360 pixels to fit them in.
 */
export function AdminLink() {
  const { account } = useAccount();
  if (!account?.isAdmin) return null;

  return (
    <Link
      href="/admin"
      title="Inventory console"
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-muted transition-colors hover:bg-white/8 hover:text-chalk sm:px-3"
    >
      <svg viewBox="0 0 16 16" aria-hidden className="size-4">
        <path
          d="M2 5.2 8 2l6 3.2v5.6L8 14l-6-3.2V5.2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M2 5.2 8 8.4l6-3.2M8 8.4V14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
      <span className="hidden sm:inline">Inventory</span>
      <span className="sr-only sm:hidden">Inventory console</span>
    </Link>
  );
}

/** Header control: sign in, or the address you are signed in as. */
export function AccountButton() {
  const { account, loading, signIn, signOut } = useAccount();

  if (loading) return <span className="w-16" />;

  if (!account) {
    return (
      <button
        type="button"
        onClick={() => signIn()}
        className="rounded-full bg-chalk px-4 py-1.5 text-[13px] font-semibold text-ink transition-transform hover:scale-[1.04] active:scale-[0.97]"
      >
        Sign in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-40 truncate text-xs text-faint sm:inline">
        {account.email}
      </span>
      <button
        type="button"
        onClick={() => void signOut()}
        className="whitespace-nowrap rounded-full border border-hairline px-3 py-1.5 text-xs text-muted transition-colors hover:border-white/30 hover:text-chalk"
      >
        Sign out
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SignInSheet({
  open,
  reason,
  onClose,
  onSignedIn,
}: {
  open: boolean;
  reason: string | null;
  onClose: () => void;
  onSignedIn: () => void;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSent(false);
      setDevLink(null);
      setError(null);
    }
  }, [open]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not send that link");
      setSent(true);
      setDevLink(data.devLink ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-label="Sign in"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl border border-hairline bg-ink-raised p-6 sm:rounded-3xl"
          >
            {sent ? (
              <div className="text-center">
                <h3 className="text-lg font-semibold tracking-tight">Check your email</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
                  We sent a sign-in link to <span className="text-chalk">{email}</span>. It
                  works once, and expires in fifteen minutes.
                </p>

                {devLink && (
                  <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300">
                      No email provider configured
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-amber-200/90">
                      Nothing was actually sent, so here is the link. This only ever
                      appears outside production.
                    </p>
                    <a
                      href={devLink}
                      className="mt-3 block truncate rounded-lg bg-black/30 px-3 py-2 font-mono text-[11px] text-amber-200 underline"
                    >
                      {devLink}
                    </a>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onSignedIn}
                  className="mt-5 w-full rounded-xl bg-white/10 py-3 text-sm font-medium text-chalk transition-colors hover:bg-white/16"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <h3 className="text-lg font-semibold tracking-tight">Sign in to collect</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {reason ||
                    "Your pulls need somewhere to live, and a box has to reach a real address. No password — we email you a link."}
                </p>

                <label className="mt-5 block">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-faint">
                    Email
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-2 w-full rounded-xl border border-hairline bg-ink px-4 py-3 text-sm outline-none transition-colors focus:border-white/30"
                  />
                </label>

                <button
                  type="submit"
                  disabled={busy || email.trim() === ""}
                  className="mt-5 w-full rounded-xl bg-chalk py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {busy ? "Sending…" : "Email me a link"}
                </button>
                {error && <p className="mt-3 text-center text-xs text-rose-400">{error}</p>}
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
