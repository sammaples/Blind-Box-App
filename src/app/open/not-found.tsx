import Link from "next/link";

export default function OpenNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">That box isn&apos;t yours</h1>
      <p className="text-sm text-muted">
        We could not find a sealed box on this account with that id. It may have been
        opened on another device.
      </p>
      <Link
        href="/"
        className="rounded-full bg-chalk px-6 py-3 text-sm font-semibold text-ink"
      >
        Back to the shop
      </Link>
    </div>
  );
}
