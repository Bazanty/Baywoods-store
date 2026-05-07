"use client";

import { useTransition } from "react";
import { actionReturnRequest } from "@/app/admin/actions";

export default function ReturnActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [pending, start] = useTransition();

  const run = (action: "approve" | "deny" | "received" | "refund") =>
    start(async () => {
      await actionReturnRequest(id, action);
    });

  return (
    <div className="flex flex-col gap-2 md:items-end">
      {status === "requested" && (
        <>
          <button
            disabled={pending}
            onClick={() => run("approve")}
            className="px-3 py-1.5 text-xs bg-forest text-white disabled:opacity-50"
          >
            Approve
          </button>
          <button
            disabled={pending}
            onClick={() => run("deny")}
            className="px-3 py-1.5 text-xs border border-stone text-ink disabled:opacity-50"
          >
            Deny
          </button>
        </>
      )}
      {status === "approved" && (
        <button
          disabled={pending}
          onClick={() => run("received")}
          className="px-3 py-1.5 text-xs bg-indigo-600 text-white disabled:opacity-50"
        >
          Mark received
        </button>
      )}
      {status === "received" && (
        <button
          disabled={pending}
          onClick={() => run("refund")}
          className="px-3 py-1.5 text-xs bg-emerald-600 text-white disabled:opacity-50"
        >
          Issue refund
        </button>
      )}
    </div>
  );
}
