export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="rounded-none border border-arb-blue/40 bg-surface px-3 py-1 font-mono text-xs uppercase tracking-widest text-arb-blue-soft">
        scaffold check
      </span>
      <h1 className="text-4xl font-bold tracking-tight">
        x402 on <span className="text-arb-blue">Arbitrum</span>
      </h1>
      <p className="max-w-prose text-arb-blue-soft">
        Interactive walkthrough scaffold is live. The full lesson UI lands next.
      </p>
    </main>
  );
}
