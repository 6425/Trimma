"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-lg w-full rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-zinc-900">Trimma hit an internal error</h1>
          <p className="text-sm text-zinc-500 mt-2">
            {isDev
              ? "Run a clean dev restart: cd apps/web && npm run dev:restart"
              : "Please refresh the page. If this continues, wait for the latest deploy to finish."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
