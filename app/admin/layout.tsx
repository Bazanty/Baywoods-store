import AdminNav from "./_components/AdminNav";
import AdminMobileNav from "./_components/AdminMobileNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F4F4F2] font-sans lg:h-screen lg:overflow-hidden">
      <aside className="hidden w-56 bg-ink flex-shrink-0 flex-col select-none lg:flex">
        <div className="px-6 pt-7 pb-6 border-b border-white/10">
          <span className="font-serif text-white text-xl tracking-wide">Baywoods</span>
          <span className="block text-[10px] text-white/35 tracking-[0.18em] uppercase mt-1">
            Admin Panel
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
