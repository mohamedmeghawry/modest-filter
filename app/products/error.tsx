"use client";

import { useEffect } from "react";

export default function ProductsError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-col items-start gap-4 rounded-lg border border-black/10 p-6">
        <h1 className="text-xl font-semibold">
          Something went wrong loading the catalog
        </h1>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="rounded-full border border-black/10 px-4 py-1.5 text-sm font-medium opacity-80 transition-opacity hover:opacity-100"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
