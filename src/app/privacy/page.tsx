import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Blind Box",
};

/**
 * A holding page, like the terms. What it does say is only what the app
 * actually does today, so it is true even before the full policy is written.
 */
export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-10 pt-10 sm:px-8 sm:pt-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Privacy Policy</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Our full Privacy Policy is being finalised and will be published here before launch. In
        the meantime, in short:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
        <li>
          You sign in with Apple. We receive what Apple shares — an account id, and the email and
          name you choose to share, which may be a Hide My Email relay.
        </li>
        <li>We keep your orders, your coin history, and the shipping address you give us for a parcel.</li>
        <li>You can delete your account at any time from the profile button.</li>
      </ul>
    </div>
  );
}
