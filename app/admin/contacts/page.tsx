import { getContactMessages, markContactRead } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  let messages: Awaited<ReturnType<typeof getContactMessages>> = [];
  let loadError = "";

  try {
    messages = await getContactMessages();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load contact messages.";
  }

  const unread = messages.filter((m) => !m.is_read).length;

  return (
    <div className="px-6 lg:px-10 py-10 max-w-5xl">
      <div className="border-b border-ink/15 pb-6 mb-8">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
          <span className="text-ink">/</span> MESSAGES
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-4xl sm:text-5xl">Contact messages.</h1>
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase">
            <span className="text-ink">{unread} unread</span>
            <span className="text-muted"> · {messages.length} total</span>
          </p>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 border border-danger/30 bg-cream p-5">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-danger">/ Contact messages aren&apos;t set up yet</p>
          <p className="mt-2 font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
            {loadError.includes("contact_messages")
              ? "/ The Supabase table public.contact_messages is missing. Apply the migration supabase/migrations/20260413150000_contact_messages.sql."
              : `/ ${loadError}`}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {messages.map((m, i) => (
          <div
            key={m.id}
            className={`border bg-cream p-5 ${m.is_read ? "border-ink/15" : "border-ink"}`}
          >
            <div className="grid md:grid-cols-[1fr_auto] gap-4 items-start">
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-mono text-[10px] tracking-[0.16em] text-muted">/{String(i + 1).padStart(2, "0")}</span>
                  {!m.is_read && (
                    <span className="font-mono text-[9px] tracking-[0.2em] uppercase bg-ink text-citrine px-2 py-0.5">
                      New
                    </span>
                  )}
                  <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                    {new Date(m.created_at).toLocaleDateString("en-KE", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <p className="font-display text-lg tracking-[-0.01em] text-ink">{m.subject}</p>
                <div className="flex gap-4 mt-1 font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                  <span>{m.name}</span>
                  <a
                    href={`mailto:${m.email}`}
                    className="hover:text-ink transition-colors underline-citrine"
                  >
                    {m.email}
                  </a>
                </div>
                <p className="mt-3 text-sm text-ink/75 leading-relaxed whitespace-pre-wrap">
                  {m.message}
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <a
                  href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}
                  className="font-mono text-[10px] tracking-[0.18em] uppercase px-4 py-2 bg-ink text-citrine hover:bg-forest-dark transition-colors text-center"
                >
                  Reply →
                </a>
                {!m.is_read && (
                  <form
                    action={async () => {
                      "use server";
                      await markContactRead(m.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="w-full font-mono text-[10px] tracking-[0.18em] uppercase px-4 py-2 border border-ink/25 text-muted hover:text-ink hover:border-ink transition-colors"
                    >
                      Mark read
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ))}

        {messages.length === 0 && !loadError && (
          <div className="border border-ink/15 py-14 text-center font-mono text-[10px] tracking-[0.16em] uppercase text-muted">
            / No contact messages yet.
          </div>
        )}
      </div>
    </div>
  );
}
