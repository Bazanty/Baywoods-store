export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-beige">
      <div className="flex flex-col items-center gap-4">
        <p className="font-serif text-2xl tracking-widest text-ink animate-pulse">BAYWOODS</p>
        <div className="h-1 w-32 overflow-hidden bg-stone/50">
          <div className="h-full w-1/2 bg-forest animate-pulse" />
        </div>
      </div>
    </div>
  );
}
