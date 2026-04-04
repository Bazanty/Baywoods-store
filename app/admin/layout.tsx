import AdminNav from "./_components/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#F4F4F2] overflow-hidden font-sans">
      <aside className="w-56 bg-ink flex-shrink-0 flex flex-col select-none">
        <div className="px-6 pt-7 pb-6 border-b border-white/10">
          <span className="font-serif text-white text-xl tracking-wide">Baywoods</span>
          <span className="block text-[10px] text-white/35 tracking-[0.18em] uppercase mt-1">
            Admin Panel
          </span>
        </div>
        <AdminNav />
      </aside>

      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
