"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { wordmark } from "@/lib/fonts";
import { formatPhone } from "@/lib/phone";
import { useScrollLock } from "@/lib/useScrollLock";
import { useAccount } from "./AccountBar";
import { AppleMark } from "./AppleButton";
import { Coins } from "./Coin";
import { Monogram } from "./Monogram";

/** The avatar: plain silver — a bright top edge running down into a cool grey. */
const AVATAR_GRADIENT = "linear-gradient(160deg, #fbfbfd 0%, #dcdee4 42%, #a9adb8 100%)";

function PersonGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <circle cx="12" cy="8.2" r="4.2" />
      <path d="M3.8 20.2c0-4 3.7-6.9 8.2-6.9s8.2 2.9 8.2 6.9c0 .6-.4 1-1 1H4.8c-.6 0-1-.4-1-1Z" />
    </svg>
  );
}

/**
 * The profile button, top right.
 *
 * One control for everything about you — signed in or not — so the header no
 * longer carries a Sign in button, a Sign out button and an address. Tapping
 * it opens the account screen, which knows which of the two it is.
 */
export function ProfileButton() {
  const { account, loading, openProfile } = useAccount();
  return (
    <button
      type="button"
      onClick={openProfile}
      aria-label={account ? "Your account" : "Sign in"}
      aria-haspopup="dialog"
      className={`grid size-9 place-items-center rounded-full text-[#1b1c22] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.35)] transition-transform hover:scale-[1.05] active:scale-[0.96] ${
        loading ? "opacity-0" : "opacity-100"
      }`}
      style={{ background: AVATAR_GRADIENT }}
    >
      <PersonGlyph className="size-[18px]" />
    </button>
  );
}

/* --------------------------------------------------------------------- */

/**
 * The account screen.
 *
 * Signed out, it is one card that asks you to sign in, and the help links.
 * Signed in, it is who you are and what you have, then the places that are
 * yours, help, signing out and — because any app that makes an account has to
 * let you remove it — deleting the account.
 *
 * Full screen rather than a sheet: it is a place you go, with enough rows that
 * a sheet would be most of the screen anyway.
 */
export function ProfileScreen({
  open,
  onClose,
  onSignIn,
}: {
  open: boolean;
  onClose: () => void;
  onSignIn: () => void;
}) {
  useScrollLock(open);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const screen = (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Your account"
          className="fixed inset-0 z-[60] overflow-y-auto bg-[#111113] pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mx-auto w-full max-w-md px-5">
            <div className="flex h-16 items-center">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                autoFocus
                className="grid size-11 place-items-center rounded-full bg-white text-black transition-transform active:scale-95"
              >
                <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <ProfileBody onClose={onClose} onSignIn={onSignIn} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return mounted ? createPortal(screen, document.body) : null;
}

function ProfileBody({ onClose, onSignIn }: { onClose: () => void; onSignIn: () => void }) {
  const { account } = useAccount();

  if (!account) {
    return (
      <>
        <section className="mt-2 rounded-[28px] border border-white/10 bg-[#1c1c1f] px-6 pb-7 pt-8 text-center">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-white text-black">
            <svg viewBox="0 0 24 24" aria-hidden className="size-9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="3.6" />
              <path d="M5 19.5c0-3.4 3.1-5.6 7-5.6s7 2.2 7 5.6c0 .3-.2.5-.5.5h-13c-.3 0-.5-.2-.5-.5Z" />
            </svg>
          </span>
          <h2 className="mt-5 text-[22px] font-semibold tracking-tight">Sign in to manage your account</h2>
          <p className="mt-1.5 text-[15px] text-muted">Access your coins, your vault, and more</p>
          <button
            type="button"
            onClick={onSignIn}
            className="mt-6 h-[52px] w-full rounded-full bg-white text-[16px] font-semibold text-black transition-transform active:scale-[0.98]"
          >
            Sign in
          </button>
        </section>
        <Help onClose={onClose} />
        <Legal onClose={onClose} />
      </>
    );
  }

  return <SignedIn onClose={onClose} />;
}

function SignedIn({ onClose }: { onClose: () => void }) {
  const { account, signOut } = useAccount();
  const router = useRouter();
  const [opened, setOpened] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<"idle" | "armed" | "busy">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void fetch("/api/orders")
      .then((r) => r.json())
      .then((d: { orders?: { status: string }[] }) => {
        if (live) setOpened((d.orders ?? []).filter((o) => o.status !== "paid").length);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (!account) return null;

  const remove = async () => {
    setDeleting("busy");
    setError(null);
    try {
      const res = await fetch("/api/auth/account", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Could not delete your account");
      onClose();
      await signOut();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDeleting("armed");
    }
  };

  return (
    <>
      <section className="mt-2 overflow-hidden rounded-[28px] border border-white/10 bg-[#1c1c1f]">
        <div className="flex items-center gap-4 px-6 pb-6 pt-7">
          <span
            className="grid size-16 shrink-0 place-items-center rounded-full text-[#1b1c22]"
            style={{ background: AVATAR_GRADIENT }}
          >
            <PersonGlyph className="size-8" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[20px] font-semibold tracking-tight">
              {account.displayName || "Collector"}
            </p>
            {(account.email || account.phone) && (
              <p className="mt-0.5 truncate text-sm text-muted">{account.email ?? formatPhone(account.phone)}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-white/10 bg-black/40">
          <Link href="/wallet" onClick={onClose} className="flex flex-col items-center gap-1 py-5">
            <span className="text-[22px] font-semibold">
              <Coins amount={account.coins} size={20} />
            </span>
            <span className="text-sm text-muted">Coins</span>
          </Link>
          <Link href="/collection" onClick={onClose} className="flex flex-col items-center gap-1 border-l border-white/10 py-5">
            <span className="text-[22px] font-semibold tabular-nums">{opened ?? "–"}</span>
            <span className="text-sm text-muted">Boxes opened</span>
          </Link>
        </div>
      </section>

      <Group label="Account">
        <Row href="/collection" onClose={onClose} icon={<VaultIcon />}>My vault</Row>
        <Row href="/rewards" onClose={onClose} icon={<GiftIcon />}>Rewards</Row>
        <Row href="/wallet" onClose={onClose} icon={<CoinIcon />}>Coins</Row>
        {account.isAdmin && (
          <>
            <Row href="/admin" onClose={onClose} icon={<BoxIcon />}>Inventory management</Row>
            <Row href="/admin/invites" onClose={onClose} icon={<InviteIcon />}>Invites</Row>
          </>
        )}
      </Group>

      <Help onClose={onClose} />

      <div className="mt-8">
        <button
          type="button"
          onClick={() => {
            onClose();
            void signOut();
          }}
          className="flex h-[60px] w-full items-center gap-4 rounded-2xl bg-[#1c1c1f] px-5 text-left text-[16px] font-medium transition-colors hover:bg-[#232327]"
        >
          <LogoutIcon />
          <span className="flex-1">Log out</span>
          <Chevron />
        </button>
      </div>

      <div className="mt-4">
        {deleting === "idle" ? (
          <button
            type="button"
            onClick={() => setDeleting("armed")}
            className="flex h-[60px] w-full items-center justify-center gap-3 rounded-2xl bg-[#1d1214] text-[16px] font-medium text-chalk transition-colors hover:bg-[#25161a]"
          >
            <TrashIcon />
            Delete account
          </button>
        ) : (
          <div className="rounded-2xl border border-rose-500/30 bg-[#1d1214] p-5">
            <p className="text-[15px] font-semibold">Delete your account?</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              This can’t be undone. Your coins are lost, and any pieces in your vault that haven’t
              shipped will no longer be yours to ship.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleting("idle")}
                disabled={deleting === "busy"}
                className="h-12 flex-1 rounded-xl border border-white/15 text-sm font-medium text-muted"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={() => void remove()}
                disabled={deleting === "busy"}
                className="h-12 flex-1 rounded-xl bg-rose-600 text-sm font-semibold text-white disabled:opacity-60"
              >
                {deleting === "busy" ? "Deleting…" : "Delete account"}
              </button>
            </div>
            {error && <p className="mt-3 text-center text-xs text-rose-400">{error}</p>}
          </div>
        )}
      </div>

      <Legal onClose={onClose} />
    </>
  );
}

function Help({ onClose }: { onClose: () => void }) {
  return (
    <Group label="Help">
      <Row href="/support" onClose={onClose} icon={<HelpIcon />}>Support</Row>
    </Group>
  );
}

function Legal({ onClose }: { onClose: () => void }) {
  return (
    <p className="mt-8 flex justify-center gap-6 text-[15px] text-muted">
      <Link href="/terms" onClick={onClose} className="underline underline-offset-4 hover:text-chalk">
        Terms of Service
      </Link>
      <Link href="/privacy" onClick={onClose} className="underline underline-offset-4 hover:text-chalk">
        Privacy Policy
      </Link>
    </p>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="px-1 text-[15px] font-medium text-chalk/90">{label}</h3>
      <div className="mt-3 overflow-hidden rounded-2xl bg-[#1c1c1f]">{children}</div>
    </section>
  );
}

function Row({
  href,
  icon,
  children,
  onClose,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex h-[60px] items-center gap-4 px-5 text-[16px] font-medium transition-colors hover:bg-white/[0.04]"
    >
      {icon}
      <span className="flex-1">{children}</span>
      <Chevron />
    </Link>
  );
}

/* Icons, drawn at one weight so the rows read as one set. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
function Chevron() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
const VaultIcon = () => (
  <Icon>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="12" cy="12" r="3.2" />
  </Icon>
);
const CoinIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M14.6 9.3c-.5-.8-1.5-1.3-2.6-1.3-1.5 0-2.6.8-2.6 2s1.1 1.7 2.6 2 2.6.8 2.6 2-1.1 2-2.6 2c-1.1 0-2.1-.5-2.6-1.3M12 6.5V8m0 8v1.5" />
  </Icon>
);
const GiftIcon = () => (
  <Icon>
    <rect x="3.5" y="8" width="17" height="4" rx="1" />
    <path d="M5 12v7.5h14V12M12 8v11.5M12 8c-1.6-3.4-5.5-3.6-5.5-1.3C6.5 8 9 8 12 8Zm0 0c1.6-3.4 5.5-3.6 5.5-1.3C17.5 8 15 8 12 8Z" />
  </Icon>
);
const BoxIcon = () => (
  <Icon>
    <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 0v18M4 7l8 4 8-4" />
  </Icon>
);
const InviteIcon = () => (
  <Icon>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M17 8v6M14 11h6" />
  </Icon>
);
const HelpIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.7 9.6a2.4 2.4 0 1 1 3.4 2.2c-.7.3-1.1.9-1.1 1.6v.4M12 16.6v.1" />
  </Icon>
);
const LogoutIcon = () => (
  <Icon>
    <path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14M10 12h10m0 0-3.5-3.5M20 12l-3.5 3.5" />
  </Icon>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="size-6 text-rose-500" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l1 13h9l1-13" />
  </svg>
);

/* --------------------------------------------------------------------- */

/**
 * Signing in.
 *
 * A screen of its own, lit and branded, because it is the front door: the
 * mark in the middle, and one way in — Apple. "Browse as guest" is the other
 * button rather than a small close icon, because looking around first is a
 * perfectly good answer and should not have to be hunted for.
 *
 * Where Apple is not configured (a development machine, which Apple will not
 * redirect back to), the one button signs in a test collector instead and
 * says so. A production build never offers that door.
 */
export function SignInScreen({
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Where to land afterwards, captured on open, so somebody sent here from
  // checkout comes back to checkout rather than the front page.
  const [next, setNext] = useState("/");
  useEffect(() => {
    if (open) setNext(window.location.pathname + window.location.search + window.location.hash);
  }, [open]);

  // Each way in is one button here; the typing happens in a sheet of its own.
  const [method, setMethod] = useState<CodeMethod | null>(null);
  useEffect(() => {
    if (!open) setMethod(null);
  }, [open]);

  const pill =
    "flex h-14 w-full items-center justify-center gap-2.5 rounded-full text-[17px] font-semibold transition-transform active:scale-[0.98]";

  const screen = (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Sign in"
          className="fixed inset-0 z-[70] flex flex-col overflow-y-auto px-6 pb-[calc(1.75rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]"
          style={{
            background:
              "linear-gradient(180deg, #05060f 0%, #10154f 24%, #2a3bd6 50%, #6a62f2 70%, #b9a6f3 86%, #ecd9ee 100%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex flex-1 flex-col items-center justify-center pt-10">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, type: "spring", stiffness: 240, damping: 22 }}
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

          <div className="mx-auto w-full max-w-md">
            {reason && (
              <p className="mb-4 text-center text-[14px] leading-relaxed text-white/85">{reason}</p>
            )}
            {apple ? (
              <a href={`/auth/apple?next=${encodeURIComponent(next)}`} className={`${pill} bg-white text-black`}>
                <AppleMark className="size-[22px] -translate-y-px" />
                Continue with Apple
              </a>
            ) : (
              <div className="flex h-14 w-full cursor-default items-center justify-center gap-2 rounded-full bg-white/15 px-5 text-center text-[14px] font-medium leading-snug text-white/75" aria-disabled="true">
                <AppleMark className="size-[18px] shrink-0 -translate-y-px" />
                Apple sign in isn’t available right now
              </div>
            )}
            <button type="button" onClick={() => setMethod("email")} className={`${pill} mt-3 bg-white text-black`}>
              <MailGlyph className="size-[21px]" />
              Continue with email
            </button>
            <button type="button" onClick={() => setMethod("phone")} className={`${pill} mt-3 bg-white text-black`}>
              <PhoneGlyph className="size-[21px]" />
              Continue with phone
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`${pill} mt-3 border border-[#1a1640]/45 text-[#0e0b2a]`}
            >
              Browse as guest
            </button>
            <p className="mt-6 flex justify-center gap-6 text-[15px] text-[#1a1640]/80">
              <Link href="/terms" onClick={onClose} className="underline underline-offset-4">
                Terms of Service
              </Link>
              <Link href="/privacy" onClick={onClose} className="underline underline-offset-4">
                Privacy Policy
              </Link>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return mounted
    ? createPortal(
        <>
          {screen}
          <CodeSheet method={open ? method : null} next={next} onClose={() => setMethod(null)} onSignedIn={onSignedIn} />
        </>,
        document.body,
      )
    : null;
}

type CodeMethod = "email" | "phone";

const METHOD = {
  email: {
    title: "Sign in with email",
    hint: "We’ll email you a code.",
    send: "/api/auth/request",
    verify: "/api/auth/code",
    change: "Use a different email",
    codeLength: 8,
  },
  phone: {
    title: "Sign in with phone",
    hint: "We’ll text you a code.",
    send: "/api/auth/phone/send",
    verify: "/api/auth/phone/verify",
    change: "Use a different number",
    codeLength: 6,
  },
} as const;

/** "5551234567" as "(555) 123-4567" while it is typed; "+44…" left alone. */
function typedPhone(value: string, previous: string): string {
  if (value.trim().startsWith("+")) return value;
  let digits = value.replace(/\D/g, "");
  // A backspace over a bracket or dash removes nothing but the formatting,
  // which would put straight back — so take the digit before it instead.
  if (value.length < previous.length && digits === previous.replace(/\D/g, "")) digits = digits.slice(0, -1);
  if (digits.length > 10) return digits;
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** How far the on-screen keyboard covers the bottom, so a sheet can sit on it. */
function useKeyboardInset(active: boolean): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    const update = () => setInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setInset(0);
    };
  }, [active]);
  return inset;
}

/**
 * The typing half of signing in by email or phone, in a sheet over the
 * sign-in screen: the address or number, then the code that was sent to it.
 *
 * A code rather than only a link, because a link opens in the browser, and an
 * app added to the home screen keeps its own sign-in, separate from Safari's.
 */
function CodeSheet({
  method,
  next,
  onClose,
  onSignedIn,
}: {
  method: CodeMethod | null;
  next: string;
  onClose: () => void;
  onSignedIn: () => void;
}) {
  const [kind, setKind] = useState<CodeMethod>("email");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inset = useKeyboardInset(method !== null);

  // A fresh sheet each time one is opened.
  useEffect(() => {
    if (!method) return;
    setKind(method);
    setValue("");
    setCode("");
    setSentTo(null);
    setError(null);
  }, [method]);

  const m = METHOD[kind];

  const post = async (url: string, body: object) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? "Something went wrong");
    return data;
  };

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await post(m.send, kind === "email" ? { email: value, next } : { phone: value });
      setSentTo(kind === "phone" && typeof data.phone === "string" ? data.phone : value.trim());
      setCode(typeof data.devCode === "string" ? data.devCode : "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (typed = code) => {
    setBusy(true);
    setError(null);
    try {
      await post(m.verify, kind === "email" ? { email: sentTo, code: typed } : { phone: sentTo, code: typed });
      onSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const codeReady = code.replace(/[^a-z0-9]/gi, "").length === m.codeLength;
  const field =
    "h-14 w-full rounded-2xl bg-[#f1f0f7] px-5 text-[17px] text-[#0e0b2a] outline-none ring-[#4b48d8]/50 placeholder:text-[#1a1640]/35 focus:ring-2";
  const primary =
    "mt-3 flex h-14 w-full items-center justify-center rounded-full bg-[#0e0b2a] text-[17px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40";

  return (
    <AnimatePresence>
      {method && (
        <motion.div
          key="code-sheet"
          className="fixed inset-0 z-[75]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={m.title}
            className="absolute inset-x-0 mx-auto w-full max-w-md rounded-t-[28px] bg-white px-6 pt-3 text-[#0e0b2a] shadow-[0_-12px_40px_rgba(10,10,40,0.3)]"
            style={{
              bottom: inset,
              paddingBottom: inset > 0 ? "1.25rem" : "calc(1.5rem + env(safe-area-inset-bottom))",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
          >
            <span className="mx-auto block h-1.5 w-10 rounded-full bg-[#0e0b2a]/15" />
            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-semibold tracking-tight">{sentTo ? "Enter the code" : m.title}</h2>
                <p className="mt-1 text-[14px] text-[#1a1640]/60">
                  {sentTo ? (
                    <>
                      Sent to <span className="font-medium text-[#0e0b2a]">{kind === "phone" ? formatPhone(sentTo) : sentTo}</span>
                    </>
                  ) : (
                    m.hint
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 grid size-9 shrink-0 place-items-center rounded-full bg-[#0e0b2a]/[0.06]"
              >
                <svg viewBox="0 0 24 24" aria-hidden className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            {sentTo === null ? (
              <form
                className="mt-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                {kind === "email" ? (
                  <input
                    key="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="you@example.com"
                    aria-label="Email address"
                    className={field}
                  />
                ) : (
                  <input
                    key="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(typedPhone(e.target.value, value))}
                    placeholder="(555) 123-4567"
                    aria-label="Phone number"
                    className={field}
                  />
                )}
                <button type="submit" disabled={busy || value.trim() === ""} className={primary}>
                  {busy ? "Sending…" : "Send code"}
                </button>
              </form>
            ) : (
              <form
                className="mt-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  void verify();
                }}
              >
                <input
                  key="code"
                  type="text"
                  inputMode={kind === "phone" ? "numeric" : "text"}
                  autoComplete="one-time-code"
                  autoCapitalize="characters"
                  spellCheck={false}
                  autoFocus
                  maxLength={kind === "phone" ? 10 : 9}
                  value={code}
                  onChange={(e) => {
                    const typed = kind === "phone" ? e.target.value.replace(/\D/g, "") : e.target.value.toUpperCase();
                    setCode(typed);
                    // A whole code, typed or filled in from the text, signs in
                    // without another tap.
                    if (!busy && typed.replace(/[^a-z0-9]/gi, "").length === m.codeLength) void verify(typed);
                  }}
                  placeholder={kind === "phone" ? "123456" : "XXXX-XXXX"}
                  aria-label="Sign-in code"
                  className={`${field} text-center font-mono text-[22px] tracking-[0.25em]`}
                />
                <button type="submit" disabled={busy || !codeReady} className={primary}>
                  {busy ? "Signing in…" : "Sign in"}
                </button>
                <p className="mt-4 flex justify-center gap-6 text-[14px] text-[#1a1640]/60">
                  <button type="button" disabled={busy} onClick={() => void send()} className="underline underline-offset-4">
                    Send a new code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSentTo(null);
                      setCode("");
                      setError(null);
                    }}
                    className="underline underline-offset-4"
                  >
                    {m.change}
                  </button>
                </p>
              </form>
            )}
            {error && <p className="mt-3 text-center text-[13px] text-rose-600">{error}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MailGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function PhoneGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </svg>
  );
}
