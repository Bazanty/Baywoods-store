import { formatPrice } from "./utils";

// ---------------------------------------------------------------------------
// WhatsApp notifications via Twilio
//
// Requires:
//   TWILIO_ACCOUNT_SID      — from console.twilio.com
//   TWILIO_AUTH_TOKEN       — from console.twilio.com
//   TWILIO_WHATSAPP_FROM    — sandbox: whatsapp:+14155238886
//                            production: whatsapp:+<your-approved-number>
//
// The recipient phone is stored in Kenyan local format (07xx / 01xx) and is
// converted to E.164 (+2547xx / +2541xx) before sending.
// ---------------------------------------------------------------------------

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://baywoods.co.ke";

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254")) return `+${digits}`;
  if (digits.startsWith("0"))   return `+254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `+254${digits}`;
  return `+${digits}`;
}

async function sendWhatsApp(to: string, body: string): Promise<void> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token || !from) return; // Skip if not configured

  // Use the twilio SDK — imported dynamically so dev still works without the package.
  const twilio = (await import("twilio")).default;
  const client = twilio(sid, token);

  await client.messages.create({
    from,
    to: `whatsapp:${formatPhone(to)}`,
    body,
  });
}

export async function sendOrderSms(opts: {
  phone: string;
  customerName: string;
  orderId: string;
  total: number;
}) {
  const firstName = opts.customerName.split(" ")[0];
  const shortRef  = opts.orderId.slice(0, 8).toUpperCase();

  const body = [
    `Hi ${firstName} 👋 Your Baywoods order is confirmed!`,
    ``,
    `🧾 *Order:* #${shortRef}`,
    `💳 *Total:* ${formatPrice(opts.total)}`,
    ``,
    `We'll message you the moment it ships.`,
    `Track your order 👉 ${SITE_URL}/account/orders`,
  ].join("\n");

  await sendWhatsApp(opts.phone, body);
}

export async function sendShippingUpdateSms(opts: {
  phone: string;
  customerName: string;
  orderId: string;
  trackingNumber: string;
}) {
  const firstName = opts.customerName.split(" ")[0];
  const shortRef  = opts.orderId.slice(0, 8).toUpperCase();

  const body = [
    `Great news ${firstName}! Your Baywoods order has shipped 🚚`,
    ``,
    `📦 *Order:* #${shortRef}`,
    `🔍 *Tracking:* ${opts.trackingNumber}`,
    ``,
    `Estimated delivery: 3–7 business days.`,
    `View order 👉 ${SITE_URL}/account/orders`,
  ].join("\n");

  await sendWhatsApp(opts.phone, body);
}
