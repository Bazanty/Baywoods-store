// eslint-disable-next-line @typescript-eslint/no-require-imports
const AfricasTalking = require("africastalking") as (opts: { apiKey: string; username: string }) => { SMS: { send: (opts: { to: string[]; message: string; from: string }) => Promise<unknown> } };
import { formatPrice } from "./utils";

let _at: ReturnType<typeof AfricasTalking> | null = null;

function getAt(): ReturnType<typeof AfricasTalking> {
  if (!_at) {
    _at = AfricasTalking({
      apiKey:   process.env.AT_API_KEY!,
      username: process.env.AT_USERNAME ?? "sandbox",
    });
  }
  return _at;
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254")) return `+${digits}`;
  if (digits.startsWith("0")) return `+254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `+254${digits}`;
  return `+${digits}`;
}

export async function sendOrderSms(opts: {
  phone: string;
  customerName: string;
  orderId: string;
  total: number;
}) {
  if (!process.env.AT_API_KEY) return; // Skip if not configured

  const sms = getAt().SMS;
  const shortRef = opts.orderId.slice(0, 8).toUpperCase();
  const message = `Hi ${opts.customerName.split(" ")[0]}, your Baywoods order #${shortRef} for ${formatPrice(opts.total)} has been confirmed! We'll update you when it ships. Track: baywoodsstore.com/account/orders`;

  await sms.send({
    to:      [formatPhone(opts.phone)],
    message,
    from:    process.env.AT_SENDER_ID ?? "BAYWOODS",
  });
}

export async function sendShippingUpdateSms(opts: {
  phone: string;
  customerName: string;
  orderId: string;
  trackingNumber: string;
}) {
  if (!process.env.AT_API_KEY) return;

  const sms = getAt().SMS;
  const shortRef = opts.orderId.slice(0, 8).toUpperCase();
  const message = `Baywoods: Your order #${shortRef} has shipped! Tracking: ${opts.trackingNumber}. Delivery in 3-7 business days.`;

  await sms.send({
    to:      [formatPhone(opts.phone)],
    message,
    from:    process.env.AT_SENDER_ID ?? "BAYWOODS",
  });
}
