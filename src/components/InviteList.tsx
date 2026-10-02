"use client";

import { useState } from "react";
import { formatPhone } from "@/lib/phone";

interface State {
  inviteOnly: boolean;
  invites: { entry: string; addedAt: string }[];
}

/**
 * The invite list: a switch for whether it is enforced, a box to add an
 * email or phone number, and the people on it, each with a Remove.
 */
export function InviteList({ initial }: { initial: State }) {
  const [state, setState] = useState<State>(initial);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = async (method: "POST" | "DELETE" | "PATCH", body: object) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/invites", {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong");
      setState(data as State);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6">
      <button
        type="button"
        role="switch"
        aria-checked={state.inviteOnly}
        disabled={busy}
        onClick={() => void call("PATCH", { inviteOnly: !state.inviteOnly })}
        className="flex w-full items-center gap-4 rounded-2xl border border-hairline bg-ink-card px-5 py-4 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium">Invite only</span>
          <span className="mt-0.5 block text-[13px] text-muted">
            {state.inviteOnly ? "Only the people below can sign in" : "Anyone can sign in"}
          </span>
        </span>
        <span
          aria-hidden
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${state.inviteOnly ? "bg-emerald-500" : "bg-white/15"}`}
        >
          <span
            className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform ${state.inviteOnly ? "translate-x-[22px]" : "translate-x-0.5"}`}
          />
        </span>
      </button>

      <form
        className="mt-6 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (value.trim() === "") return;
          if (await call("POST", { entry: value })) setValue("");
        }}
      >
        <input
          type="text"
          inputMode="email"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Email or phone number"
          aria-label="Email or phone number to invite"
          className="h-12 min-w-0 flex-1 rounded-full border border-hairline bg-ink-card px-5 text-[15px] outline-none placeholder:text-faint focus:border-white/30"
        />
        <button
          type="submit"
          disabled={busy || value.trim() === ""}
          className="h-12 shrink-0 rounded-full bg-chalk px-6 text-[15px] font-semibold text-ink disabled:opacity-40"
        >
          Add
        </button>
      </form>
      {error && <p className="mt-2 px-1 text-[13px] text-rose-400">{error}</p>}

      <p className="mt-8 px-1 text-sm font-semibold uppercase tracking-[0.16em] text-faint">
        Invited · {state.invites.length}
      </p>
      {state.invites.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-hairline px-5 py-8 text-center text-sm text-muted">
          No one yet. Admins can always sign in.
        </p>
      ) : (
        <ul className="mt-3 overflow-hidden rounded-2xl border border-hairline bg-ink-card">
          {state.invites.map((invite) => (
            <li
              key={invite.entry}
              className="flex items-center gap-3 border-b border-hairline px-5 py-3.5 last:border-b-0"
            >
              <span className="min-w-0 flex-1 truncate text-[15px]">
                {invite.entry.startsWith("+") ? formatPhone(invite.entry) : invite.entry}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void call("DELETE", { entry: invite.entry })}
                className="shrink-0 rounded-full border border-hairline px-3.5 py-1.5 text-[13px] font-medium text-muted transition-colors hover:text-chalk"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
