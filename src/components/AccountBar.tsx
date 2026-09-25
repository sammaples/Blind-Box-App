"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useScrollLock } from "@/lib/useScrollLock";
import { AppleButton } from "./AppleButton";
import { Coins } from "./Coin";

export interface Account {
  id: string;
  email: string | null;
  displayName: string | null;
  /** Coins in hand. */
  coins: number;
  /** Whether this account may reach the inventory console. */
  isAdmin: boolean;
  /** Whether they have been walked through how this works. */
  onboarded: boolean;
}

interface AccountState {
  account: Account | null;
  loading: boolean;
  /** Whether Sign in with Apple is configured on this deployment. */
  apple: boolean;
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
  const [apple, setApple] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setAccount(data.account ?? null);
      setApple(data.apple === true);
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
    // Everything Apple can hand back, said in a way somebody can act on.
    // "cancelled" deliberately says nothing at all: pressing Cancel is a
    // decision, not a failure, and answering it with a banner is nagging.
    const said: Record<string, string | null> = {
      expired: "That sign-in took too long to come back. Try again.",
      failed: "That sign-in did not complete. Please try again.",
      unconfigured: "Sign-in is not set up on this deployment yet.",
      cancelled: null,
      ok: null,
    };
    const reason = params.get("signin");
    const message = reason ? said[reason] : undefined;
    if (message) setPrompt(message);
    else if (message === null || claimed > 0) setPrompt(null);
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
        apple,
        signIn: (reason) => setPrompt(reason ?? ""),
        signOut,
        refresh,
      }}
    >
      {children}
      <SignInSheet
        open={prompt !== null}
        apple={apple}
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
/**
 * The balance, in the header.
 *
 * Next to the vault rather than beside the sign-out button, because coins are
 * a thing you have rather than a thing about your account — and because the
 * two places they are spent, the shop and the vault, are both one tap from
 * here. Hidden entirely at zero: a nought is an advertisement for a feature
 * somebody has not used, and it takes room a phone header does not have.
 */
export function CoinBalance() {
  const { account } = useAccount();
  if (!account || account.coins <= 0) return null;
  return (
    <Link
      href="/collection#coins"
      aria-label={`${account.coins} coins`}
      className="flex items-center rounded-full border border-hairline px-2.5 py-1 text-xs text-chalk transition-colors hover:border-white/30 sm:px-3"
    >
      <Coins amount={account.coins} size={14} />
    </Link>
  );
}

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
  apple,
  reason,
  onClose,
  onSignedIn,
}: {
  open: boolean;
  apple: boolean;
  reason: string | null;
  onClose: () => void;
  onSignedIn: () => void;
}) {
  useScrollLock(open);
  // Where to land afterwards. Captured on open rather than on click, so a
  // visitor sent here from the checkout sheet comes back to the checkout
  // sheet instead of the front page.
  const [next, setNext] = useState("/");
  useEffect(() => {
    if (open) setNext(window.location.pathname + window.location.search + window.location.hash);
  }, [open]);

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
            <h3 className="text-lg font-semibold tracking-tight">Sign in to collect</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {reason ||
                "Your pulls need somewhere to live, and a box has to reach a real address. One tap — no password, no sign-up form."}
            </p>

            <div className="mt-5">
              {apple ? (
                <AppleButton next={next} />
              ) : (
                <DevSignIn next={next} onSignedIn={onSignedIn} />
              )}
            </div>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-faint">
              We only ever get what Apple hands over, and you choose whether
              that includes your address. Hide My Email works fine here.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * The way in when Apple is not configured.
 *
 * Apple will not accept `localhost` as a return URL, so real Apple sign-in
 * cannot happen on a development machine at all — which would leave nobody
 * able to run the app without a paid developer account. This is the door for
 * that case: the emailed-link flow that predates Apple, reached without a
 * form because there is nothing to type. It refuses to appear in production,
 * where an unconfigured deployment should say so rather than quietly offering
 * a second way in.
 */
function DevSignIn({ next, onSignedIn }: { next: string; onSignedIn: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "you@example.com", next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not start a session");
      if (data.devLink) {
        // Straight through rather than showing the link: on a machine with no
        // email provider there is no inbox for it to land in.
        window.location.href = data.devLink;
      } else {
        setLink(null);
        onSignedIn();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300">
        Sign in with Apple is not configured
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-amber-200/90">
        Set APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID and APPLE_PRIVATE_KEY
        to turn it on. Until then this development door signs you in as a test
        collector.
      </p>
      <button
        type="button"
        onClick={() => void go()}
        disabled={busy}
        className="mt-3 w-full rounded-lg bg-amber-200/90 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Continue as a test collector"}
      </button>
      {link && <p className="mt-2 truncate font-mono text-[11px] text-amber-200">{link}</p>}
      {error && <p className="mt-2 text-center text-xs text-rose-400">{error}</p>}
    </div>
  );
}
