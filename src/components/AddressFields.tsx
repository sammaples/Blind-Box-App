"use client";

/**
 * The delivery address, as a set of fields.
 *
 * Split out from the form around it because a bundle is arranged in one place
 * now but the same seven fields will be wanted again at checkout.
 */

export const ADDRESS_FIELDS = [
  { key: "name", label: "Full name", wide: true, autoComplete: "name" },
  { key: "line1", label: "Address", wide: true, autoComplete: "address-line1" },
  {
    key: "line2",
    label: "Apartment, suite (optional)",
    wide: true,
    autoComplete: "address-line2",
  },
  { key: "city", label: "City", wide: false, autoComplete: "address-level2" },
  { key: "region", label: "State / region", wide: false, autoComplete: "address-level1" },
  { key: "postal", label: "Postcode", wide: false, autoComplete: "postal-code" },
  { key: "country", label: "Country", wide: false, autoComplete: "country-name" },
] as const;

export type AddressValues = Record<(typeof ADDRESS_FIELDS)[number]["key"], string>;

export const EMPTY_ADDRESS: AddressValues = {
  name: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postal: "",
  country: "",
};

/** Everything but line 2, matching what the server insists on. */
export function addressComplete(values: AddressValues): boolean {
  return ADDRESS_FIELDS.every(
    (f) => f.key === "line2" || values[f.key].trim() !== "",
  );
}

export function AddressFields({
  values,
  onChange,
  disabled,
}: {
  values: AddressValues;
  onChange: (values: AddressValues) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ADDRESS_FIELDS.map((field) => (
        <label
          key={field.key}
          className={field.wide ? "col-span-2" : "col-span-2 sm:col-span-1"}
        >
          <span className="text-[11px] uppercase tracking-[0.14em] text-faint">
            {field.label}
          </span>
          <input
            value={values[field.key]}
            autoComplete={field.autoComplete}
            disabled={disabled}
            onChange={(e) => onChange({ ...values, [field.key]: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-hairline bg-ink px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-white/30 disabled:opacity-60"
          />
        </label>
      ))}
    </div>
  );
}
