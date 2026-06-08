import webpush, { type PushSubscription as WebPushSubscription, type WebPushError } from "web-push";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string | null;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

let configured = false;

function configure(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hello@baywoodsstore.com";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export function isPushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

/**
 * Send a payload to every subscription in the list. Dead endpoints (404/410)
 * are pruned from the DB. Returns counts so callers can log usefully.
 */
export async function sendPushToSubscriptions(
  subscriptions: PushSubscriptionRow[],
  payload: PushPayload
): Promise<{ delivered: number; pruned: number; failed: number }> {
  if (!configure() || subscriptions.length === 0) {
    return { delivered: 0, pruned: 0, failed: 0 };
  }

  const body = JSON.stringify(payload);
  const deadIds: string[] = [];
  let delivered = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      const subscription: WebPushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webpush.sendNotification(subscription, body, { TTL: 60 * 60 * 24 });
        delivered += 1;
      } catch (err) {
        const status = (err as WebPushError).statusCode;
        if (status === 404 || status === 410) {
          deadIds.push(sub.id);
        } else {
          failed += 1;
        }
      }
    })
  );

  if (deadIds.length > 0) {
    const admin = createSupabaseAdminClient();
    await admin.from("push_subscriptions").delete().in("id", deadIds);
  }

  return { delivered, pruned: deadIds.length, failed };
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!userId) return { delivered: 0, pruned: 0, failed: 0 };
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, user_id")
    .eq("user_id", userId);
  return sendPushToSubscriptions((data ?? []) as PushSubscriptionRow[], payload);
}

export async function sendPushToAll(payload: PushPayload) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, user_id");
  return sendPushToSubscriptions((data ?? []) as PushSubscriptionRow[], payload);
}

export async function sendPushToEmails(emails: string[], payload: PushPayload) {
  if (emails.length === 0) return { delivered: 0, pruned: 0, failed: 0 };
  const admin = createSupabaseAdminClient();
  const lower = Array.from(new Set(emails.map((e) => e.toLowerCase())));

  // Look up auth users by email — uses the admin auth API. Falls back to no-op
  // when the public users table is empty (e.g. local dev).
  const { data: userRows } = await admin
    .from("users")
    .select("id, email")
    .in("email", lower);

  const userIds = (userRows ?? []).map((r) => r.id as string).filter(Boolean);
  if (userIds.length === 0) return { delivered: 0, pruned: 0, failed: 0 };

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, user_id")
    .in("user_id", userIds);

  return sendPushToSubscriptions((subs ?? []) as PushSubscriptionRow[], payload);
}
