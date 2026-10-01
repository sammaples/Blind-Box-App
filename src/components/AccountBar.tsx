"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Coins } from "./Coin";
import { ProfileScreen, SignInScreen } from "./Profile";

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
  /** Opens the sign-in screen. `reason` explains why it appeared. */
  signIn: (reason?: string) => void;
  /** Opens the account screen behind the profile button. */
  openProfile: () => void;
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
  const [profile, setProfile] = useState(false);
  const closeProfile = useCallback(() => setProfile(false), []);

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
        openProfile: () => setProfile(true),
        signOut,
        refresh,
      }}
    >
      {children}
      <ProfileScreen
        open={profile}
        onClose={closeProfile}
        onSignIn={() => {
          setProfile(false);
          setPrompt("");
        }}
      />
      <SignInScreen
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
 * The balance, in the header.
 *
 * Beside the profile button. Hidden entirely at zero: a nought is an
 * advertisement for a feature somebody has not used, and it takes room a
 * phone header does not have.
 */
export function CoinBalance() {
  const { account } = useAccount();
  if (!account || account.coins <= 0) return null;
  return (
    <Link
      href="/wallet"
      aria-label={`${account.coins} coins`}
      className="flex items-center rounded-full border border-hairline px-2.5 py-1 text-xs text-chalk transition-colors hover:border-white/30 sm:px-3"
    >
      <Coins amount={account.coins} size={14} />
    </Link>
  );
}
