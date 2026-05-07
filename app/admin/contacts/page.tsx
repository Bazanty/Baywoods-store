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
    <div>
      <div className="mb-8 flex items-baseline justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">Contact Messages</h1>
          <p className="text-sm text-muted mt-1">
            {unread} unread · {messages.length} total
          </p>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 border border-danger/30 bg-white p-5 text-sm">
          <p className="font-semibold text-danger">Contact messages are not set up yet.</p>
          <p className="mt-2 text-muted">
            {loadError.includes("contact_messages")
              ? "The Supabase table public.contact_messages is missing. Apply the migration supabase/migrations/20260413150000_contact_messages.sql."
              : loadError}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`border bg-white p-5 ${m.is_read ? "border-stone" : "border-ink"}`}
          >
            <div className="grid md:grid-cols-[1fr_auto] gap-4 items-start">
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  {!m.is_read && (
                    <span className="text-[10px] font-semibold tracking-wide uppercase bg-ink text-white px-2 py-0.5">
                      New
                    </span>
                  )}
                  <span className="text-xs text-muted font-mono">
                    {new Date(m.created_at).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <p className="text-sm font-semibold text-ink">{m.subject}</p>
                <div className="flex gap-4 mt-1 text-xs text-muted">
                  <span>{m.name}</span>
                  <a
                    href={`mailto:${m.email}`}
                    className="hover:text-forest transition-colors underline underline-offset-2"
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
                  className="text-xs font-medium px-4 py-2 bg-ink text-white hover:bg-ink/90 transition-colors text-center"
                >
                  Reply
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
                      className="w-full text-xs font-medium px-4 py-2 border border-stone text-muted hover:text-ink hover:border-ink transition-colors"
                    >
                      Mark read
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="border border-stone bg-white py-14 text-center text-sm text-muted">
            No contact messages yet.
          </div>
        )}
      </div>
    </div>
  );
}
