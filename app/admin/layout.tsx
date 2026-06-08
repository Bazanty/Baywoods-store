import AdminNav from "./_components/AdminNav";
import AdminMobileNav from "./_components/AdminMobileNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-cream font-sans lg:h-screen lg:overflow-hidden">
      <aside className="hidden w-60 bg-cream flex-shrink-0 flex-col select-none lg:flex border-r border-ink/15">
        <div className="px-6 pt-7 pb-5 border-b border-ink/15">
          <span className="font-display text-ink text-xl tracking-[-0.02em] font-semibold">BAYWOODS</span>
          <span className="block font-mono text-[10px] text-muted tracking-[0.2em] uppercase mt-2">
            / Admin panel
          </span>
        </div>
        <AdminNav />
      </aside>

      <div className="min-w-0 flex-1 overflow-y-auto">
        <AdminMobileNav />
        {children}
      </div>
    </div>
  );
}
