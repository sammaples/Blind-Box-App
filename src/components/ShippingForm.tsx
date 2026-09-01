"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { PublicOrder } from "@/lib/serialize";

const FIELDS = [
  { key: "name", label: "Full name", span: 2, autoComplete: "name" },
  { key: "line1", label: "Address", span: 2, autoComplete: "address-line1" },
  { key: "line2", label: "Apartment, suite (optional)", span: 2, autoComplete: "address-line2" },
  { key: "city", label: "City", span: 1, autoComplete: "address-level2" },
  { key: "region", label: "State / region", span: 1, autoComplete: "address-level1" },
  { key: "postal", label: "Postcode", span: 1, autoComplete: "postal-code" },
  { key: "country", label: "Country", span: 1, autoComplete: "country-name" },
] as const;

type Values = Record<(typeof FIELDS)[number]["key"], string>;

const EMPTY: Values = {
  name: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postal: "",
  country: "",
};

/** Collects the delivery address for a revealed pull and queues it for packing. */
export function ShippingForm({
  order,
  onUpdated,
}: {
  order: PublicOrder;
  onUpdated: (order: PublicOrder) => void;
}) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (order.shipping) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-hairline bg-ink-card p-6"
      >
        <p className="text-[11px] uppercase tracking-[0.16em] text-faint">Shipping to</p>
        <address className="mt-3 space-y-0.5 text-sm not-italic text-chalk">
          <p>{order.shipping.name}</p>
          <p className="text-muted">{order.shipping.line1}</p>
          {order.shipping.line2 && <p className="text-muted">{order.shipping.line2}</p>}
          <p className="text-muted">
            {order.shipping.city}, {order.shipping.region} {order.shipping.postal}
          </p>
          <p className="text-muted">{order.shipping.country}</p>
        </address>
        {order.trackingNumber && (
          <p className="mt-4 border-t border-hairline pt-4 text-xs text-faint">
            Tracking <span className="font-mono text-muted">{order.trackingNumber}</span> ·
            status <span className="text-muted">{order.status}</span>
          </p>
        )}
      </motion.div>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/ship`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shipping: values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not save that address");
      onUpdated(data.order as PublicOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="rounded-2xl border border-hairline bg-ink-card p-6"
    >
      <p className="text-[11px] uppercase tracking-[0.16em] text-faint">Ship the real one</p>
      <p className="mt-2 text-sm text-muted">
        Tell us where it goes and this pull joins the next packing run.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {FIELDS.map((field) => (
          <label
            key={field.key}
            className={field.span === 2 ? "col-span-2" : "col-span-2 sm:col-span-1"}
          >
            <span className="text-[11px] uppercase tracking-[0.14em] text-faint">
              {field.label}
            </span>
            <input
              value={values[field.key]}
              autoComplete={field.autoComplete}
              onChange={(e) =>
                setValues((v) => ({ ...v, [field.key]: e.target.value }))
              }
              className="mt-1.5 w-full rounded-xl border border-hairline bg-ink px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-white/30"
            />
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-5 w-full rounded-xl bg-chalk py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
      >
        {busy ? "Saving…" : "Send it to me"}
      </button>
      {error && <p className="mt-3 text-center text-xs text-rose-400">{error}</p>}
    </motion.form>
  );
}
