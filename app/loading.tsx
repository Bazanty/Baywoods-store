export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-5">
        <span className="font-display text-2xl tracking-[-0.02em] font-semibold text-ink animate-pulse">BAYWOODS</span>
        <div className="h-[3px] w-40 overflow-hidden bg-ink/10">
          <div className="h-full w-1/2 bg-ink animate-pulse" />
        </div>
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">/ Loading…</p>
      </div>
    </div>
  );
}
