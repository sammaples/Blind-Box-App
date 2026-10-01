import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Blind Box",
};

/**
 * A holding page. The terms are a legal document and are not written here;
 * this exists so the links on the sign-in and account screens lead somewhere
 * honest rather than to a 404.
 */
export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-10 pt-10 sm:px-8 sm:pt-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Terms of Service</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Our Terms of Service are being finalised and will be published here before launch.
      </p>
    </div>
  );
}
