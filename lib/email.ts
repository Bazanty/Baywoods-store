import { Resend } from "resend";
import { formatPrice } from "./utils";

const FROM = "Baywoods Store <orders@baywoodsstore.com>";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "placeholder");
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://baywoods.co.ke";
}

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  email: string;
  items: { name: string; variant: string; qty: number; price: number }[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  shippingAddress: string;
  paymentMethod: string;
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  const itemRows = data.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #E2DDD6;font-size:13px;color:#1E293B">${i.name} <span style="color:#94a3b8">${i.variant}</span></td>
          <td style="padding:8px 0;border-bottom:1px solid #E2DDD6;font-size:13px;text-align:right;color:#1E293B">x${i.qty}</td>
          <td style="padding:8px 0;border-bottom:1px solid #E2DDD6;font-size:13px;text-align:right;color:#1E293B">${formatPrice(i.price * i.qty)}</td>
        </tr>`
    )
    .join("");

  await getResend().emails.send({
    from: FROM,
    to: data.email,
    subject: `Order Confirmed — #${data.orderId.slice(0, 8).toUpperCase()}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:32px 16px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#FAFAF6;border:1px solid #E2DDD6">
        <!-- Header -->
        <tr><td style="padding:32px 40px;border-bottom:1px solid #E2DDD6;text-align:center">
          <p style="font-family:Georgia,serif;font-size:24px;letter-spacing:4px;color:#1E293B;margin:0">BAYWOODS</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px">
          <p style="font-family:Georgia,serif;font-size:22px;color:#1E293B;margin:0 0 8px">Order Confirmed!</p>
          <p style="font-size:14px;color:#64748b;margin:0 0 24px">Hi ${data.customerName}, your order has been received and is being processed.</p>
          <p style="font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#64748b;margin:0 0 4px">Order Reference</p>
          <p style="font-family:monospace;font-size:16px;font-weight:700;color:#1E293B;margin:0 0 32px">#${data.orderId.slice(0, 8).toUpperCase()}</p>
          <!-- Items -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <th style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;text-align:left;padding-bottom:8px;border-bottom:1px solid #E2DDD6">Item</th>
              <th style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;text-align:right;padding-bottom:8px;border-bottom:1px solid #E2DDD6">Qty</th>
              <th style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;text-align:right;padding-bottom:8px;border-bottom:1px solid #E2DDD6">Price</th>
            </tr>
            ${itemRows}
          </table>
          <!-- Totals -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px">
            <tr>
              <td style="font-size:13px;color:#64748b;padding:4px 0">Subtotal</td>
              <td style="font-size:13px;color:#64748b;text-align:right;padding:4px 0">${formatPrice(data.subtotal)}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#64748b;padding:4px 0">Shipping</td>
              <td style="font-size:13px;color:#64748b;text-align:right;padding:4px 0">${data.shippingCost === 0 ? "Free" : formatPrice(data.shippingCost)}</td>
            </tr>
            ${data.discount > 0 ? `<tr><td style="font-size:13px;color:#2D6A4F;padding:4px 0">Discount</td><td style="font-size:13px;color:#2D6A4F;text-align:right;padding:4px 0">-${formatPrice(data.discount)}</td></tr>` : ""}
            <tr>
              <td style="font-size:16px;font-weight:700;color:#1E293B;padding:12px 0 4px;border-top:1px solid #E2DDD6">Total</td>
              <td style="font-size:16px;font-weight:700;color:#1E293B;text-align:right;padding:12px 0 4px;border-top:1px solid #E2DDD6">${formatPrice(data.total)}</td>
            </tr>
          </table>
          <!-- Shipping address -->
          <div style="margin-top:32px;padding:20px;background:#F5F0E8;border:1px solid #E2DDD6">
            <p style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin:0 0 8px">Shipping To</p>
            <p style="font-size:13px;color:#1E293B;margin:0">${data.shippingAddress}</p>
          </div>
          <!-- CTA -->
          <div style="text-align:center;margin-top:32px">
            <a href="${siteUrl()}/account/orders" style="display:inline-block;background:#2D6A4F;color:#fff;font-size:13px;font-weight:600;padding:14px 32px;text-decoration:none;letter-spacing:1px">TRACK YOUR ORDER</a>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid #E2DDD6;text-align:center">
          <p style="font-size:12px;color:#94a3b8;margin:0">Baywoods Store · Nairobi, Kenya</p>
          <p style="font-size:12px;color:#94a3b8;margin:4px 0 0">Questions? <a href="mailto:hello@baywoodsstore.com" style="color:#2D6A4F">hello@baywoodsstore.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendShippingUpdateEmail(data: {
  orderId: string;
  email: string;
  customerName: string;
  trackingNumber: string;
}) {
  const shortRef = data.orderId.slice(0, 8).toUpperCase();
  const baseUrl = siteUrl();

  await getResend().emails.send({
    from: FROM,
    to: data.email,
    subject: `Your Order #${shortRef} Has Shipped!`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:32px 16px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#FAFAF6;border:1px solid #E2DDD6">
        <tr><td style="padding:32px 40px;border-bottom:1px solid #E2DDD6;text-align:center">
          <p style="font-family:Georgia,serif;font-size:24px;letter-spacing:4px;color:#1E293B;margin:0">BAYWOODS</p>
        </td></tr>
        <tr><td style="padding:40px">
          <p style="font-family:Georgia,serif;font-size:22px;color:#1E293B;margin:0 0 8px">Your Order Has Shipped!</p>
          <p style="font-size:14px;color:#64748b;margin:0 0 24px">Hi ${data.customerName.split(" ")[0]}, great news — your order #${shortRef} is on its way.</p>
          <div style="padding:20px;background:#F5F0E8;border:1px solid #E2DDD6;margin-bottom:24px">
            <p style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin:0 0 8px">Tracking Number</p>
            <p style="font-family:monospace;font-size:16px;font-weight:700;color:#1E293B;margin:0">${data.trackingNumber}</p>
          </div>
          <p style="font-size:14px;color:#64748b;margin:0 0 24px">Estimated delivery: 3–7 business days.</p>
          <div style="text-align:center">
            <a href="${baseUrl}/account/orders" style="display:inline-block;background:#2D6A4F;color:#fff;font-size:13px;font-weight:600;padding:14px 32px;text-decoration:none;letter-spacing:1px">TRACK YOUR ORDER</a>
          </div>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #E2DDD6;text-align:center">
          <p style="font-size:12px;color:#94a3b8;margin:0">Baywoods Store · Nairobi, Kenya</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendDeliveredEmail(data: {
  orderId: string;
  email: string;
  customerName: string;
}) {
  const shortRef = data.orderId.slice(0, 8).toUpperCase();
  const baseUrl = siteUrl();

  await getResend().emails.send({
    from: FROM,
    to: data.email,
    subject: `Order #${shortRef} Delivered — How Did We Do?`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:32px 16px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#FAFAF6;border:1px solid #E2DDD6">
        <tr><td style="padding:32px 40px;border-bottom:1px solid #E2DDD6;text-align:center">
          <p style="font-family:Georgia,serif;font-size:24px;letter-spacing:4px;color:#1E293B;margin:0">BAYWOODS</p>
        </td></tr>
        <tr><td style="padding:40px">
          <p style="font-family:Georgia,serif;font-size:22px;color:#1E293B;margin:0 0 8px">Order Delivered!</p>
          <p style="font-size:14px;color:#64748b;margin:0 0 24px">Hi ${data.customerName.split(" ")[0]}, your order #${shortRef} has been delivered. We hope you love your new items!</p>
          <p style="font-size:14px;color:#64748b;margin:0 0 24px">If you have a moment, we'd love to hear what you think.</p>
          <div style="text-align:center">
            <a href="${baseUrl}/account/orders" style="display:inline-block;background:#2D6A4F;color:#fff;font-size:13px;font-weight:600;padding:14px 32px;text-decoration:none;letter-spacing:1px">LEAVE A REVIEW</a>
          </div>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #E2DDD6;text-align:center">
          <p style="font-size:12px;color:#94a3b8;margin:0">Baywoods Store · Nairobi, Kenya</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendAbandonedCartEmail(params: {
  email: string;
  firstName: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
}) {
  const itemRows = params.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #E2DDD6;font-size:13px;color:#1E293B">${i.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #E2DDD6;font-size:13px;text-align:right;color:#1E293B">x${i.qty}</td>
          <td style="padding:8px 0;border-bottom:1px solid #E2DDD6;font-size:13px;text-align:right;color:#1E293B">${formatPrice(i.price * i.qty)}</td>
        </tr>`
    )
    .join("");
  const base = siteUrl();

  await getResend().emails.send({
    from: FROM,
    to: params.email,
    subject: "You left something behind",
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:32px 16px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#FAFAF6;border:1px solid #E2DDD6">
        <tr><td style="padding:32px 40px;text-align:center;border-bottom:1px solid #E2DDD6">
          <p style="font-family:Georgia,serif;font-size:24px;letter-spacing:4px;color:#1E293B;margin:0">BAYWOODS</p>
        </td></tr>
        <tr><td style="padding:40px">
          <p style="font-family:Georgia,serif;font-size:22px;color:#1E293B;margin:0 0 8px">Still thinking it over, ${params.firstName}?</p>
          <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0 0 24px">
            The items in your cart are in limited supply. Finish checking out before they're gone.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
          <div style="display:flex;justify-content:space-between;padding-top:12px;font-size:14px;color:#1E293B">
            <span>Subtotal</span><span>${formatPrice(params.subtotal)}</span>
          </div>
          <div style="text-align:center;margin-top:24px">
            <a href="${base}/cart" style="display:inline-block;background:#2D6A4F;color:#fff;font-size:13px;font-weight:600;padding:14px 32px;text-decoration:none;letter-spacing:1px">RETURN TO CART</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Welcome to Baywoods",
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:32px 16px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#FAFAF6;border:1px solid #E2DDD6">
        <tr><td style="padding:32px 40px;border-bottom:1px solid #E2DDD6;text-align:center">
          <p style="font-family:Georgia,serif;font-size:24px;letter-spacing:4px;color:#1E293B;margin:0">BAYWOODS</p>
        </td></tr>
        <tr><td style="padding:40px">
          <p style="font-family:Georgia,serif;font-size:22px;color:#1E293B;margin:0 0 16px">Welcome, ${firstName}.</p>
          <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0 0 24px">Your Baywoods account is ready. Explore the latest drops, save your wishlist, and check out faster with M-Pesa.</p>
          <div style="text-align:center;margin-top:24px">
            <a href="${siteUrl()}/shop" style="display:inline-block;background:#2D6A4F;color:#fff;font-size:13px;font-weight:600;padding:14px 32px;text-decoration:none;letter-spacing:1px">SHOP NOW</a>
          </div>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #E2DDD6;text-align:center">
          <p style="font-size:12px;color:#94a3b8;margin:0">Baywoods Store · Nairobi, Kenya</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendContactConfirmationEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const firstName = escapeHtml(data.name.split(/\s+/)[0] || data.name);
  const subject = escapeHtml(data.subject);
  const message = escapeHtml(data.message).replace(/\n/g, "<br>");
  const baseUrl = siteUrl();

  await getResend().emails.send({
    from: FROM,
    to: data.email,
    subject: "We received your message - Baywoods",
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:32px 16px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#FAFAF6;border:1px solid #E2DDD6">
        <tr><td style="padding:32px 40px;border-bottom:1px solid #E2DDD6;text-align:center">
          <p style="font-family:Georgia,serif;font-size:24px;letter-spacing:4px;color:#1E293B;margin:0">BAYWOODS</p>
        </td></tr>
        <tr><td style="padding:40px">
          <p style="font-family:Georgia,serif;font-size:22px;color:#1E293B;margin:0 0 8px">Message received.</p>
          <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0 0 24px">
            Hi ${firstName}, thanks for contacting Baywoods. We have your message and will reply as soon as possible.
          </p>
          <div style="padding:20px;background:#F5F0E8;border:1px solid #E2DDD6">
            <p style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin:0 0 8px">Subject</p>
            <p style="font-size:14px;color:#1E293B;margin:0 0 18px">${subject}</p>
            <p style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin:0 0 8px">Your Message</p>
            <p style="font-size:13px;color:#1E293B;line-height:1.6;margin:0">${message}</p>
          </div>
          <div style="text-align:center;margin-top:32px">
            <a href="${baseUrl}/shop" style="display:inline-block;background:#2D6A4F;color:#fff;font-size:13px;font-weight:600;padding:14px 32px;text-decoration:none;letter-spacing:1px">BROWSE BAYWOODS</a>
          </div>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #E2DDD6;text-align:center">
          <p style="font-size:12px;color:#94a3b8;margin:0">Baywoods Store - Nairobi, Kenya</p>
          <p style="font-size:12px;color:#94a3b8;margin:4px 0 0">Need to add details? Reply to this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendPaymentFailedEmail(data: {
  orderId: string;
  email: string;
  customerName: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const shortRef = data.orderId.slice(0, 8).toUpperCase();
  const baseUrl = siteUrl();

  await getResend().emails.send({
    from: FROM,
    to: data.email,
    subject: `Payment failed for order #${shortRef}`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:32px 16px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#FAFAF6;border:1px solid #E2DDD6">
        <tr><td style="padding:32px 40px;border-bottom:1px solid #E2DDD6;text-align:center">
          <p style="font-family:Georgia,serif;font-size:24px;letter-spacing:4px;color:#1E293B;margin:0">BAYWOODS</p>
        </td></tr>
        <tr><td style="padding:40px">
          <p style="font-family:Georgia,serif;font-size:22px;color:#1E293B;margin:0 0 8px">Payment unsuccessful</p>
          <p style="font-size:14px;color:#64748b;margin:0 0 24px">
            Hi ${data.customerName.split(" ")[0]}, your payment for order <span style="font-family:monospace;font-weight:700;color:#1E293B">#${shortRef}</span> could not be processed.
          </p>
          <p style="font-size:14px;color:#64748b;margin:0 0 24px">
            No charge was made. Your items have been released - please try again or contact support if M-Pesa confirmed a debit.
          </p>
          <div style="text-align:center;margin-top:8px">
            <a href="${baseUrl}/shop" style="display:inline-block;background:#2D6A4F;color:#fff;font-size:13px;font-weight:600;padding:14px 32px;text-decoration:none;letter-spacing:1px">RETURN TO SHOP</a>
          </div>
          <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:24px">
            Need help? <a href="mailto:hello@baywoodsstore.com" style="color:#2D6A4F">hello@baywoodsstore.com</a>
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #E2DDD6;text-align:center">
          <p style="font-size:12px;color:#94a3b8;margin:0">Baywoods Store · Nairobi, Kenya</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

// ---------------------------------------------------------------------------
// Restock notification — sent when an out-of-stock item is replenished
// ---------------------------------------------------------------------------
export async function sendRestockEmail(data: {
  email: string;
  productName: string;
  productUrl: string;
  variantName?: string | null;
  imageUrl?: string | null;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const variant = data.variantName ? `<p style="font-size:13px;color:#64748b;margin:0 0 18px">${escapeHtml(data.variantName)}</p>` : "";
  const image = data.imageUrl
    ? `<img src="${data.imageUrl}" alt="${escapeHtml(data.productName)}" width="540" style="display:block;width:100%;max-width:540px;height:auto;border:1px solid #E2DDD6;margin:0 0 24px">`
    : "";

  await getResend().emails.send({
    from: FROM,
    to: data.email,
    subject: `Back in stock — ${data.productName}`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:32px 16px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#FAFAF6;border:1px solid #E2DDD6">
        <tr><td style="padding:32px 40px;border-bottom:1px solid #E2DDD6;text-align:center">
          <p style="font-family:Georgia,serif;font-size:24px;letter-spacing:4px;color:#1E293B;margin:0">BAYWOODS</p>
        </td></tr>
        <tr><td style="padding:40px">
          <p style="font-family:Georgia,serif;font-size:22px;color:#1E293B;margin:0 0 8px">It's back.</p>
          <p style="font-size:14px;color:#64748b;margin:0 0 24px">
            ${escapeHtml(data.productName)} is back in stock. Grab one before it sells out again.
          </p>
          ${image}
          <p style="font-family:Georgia,serif;font-size:18px;color:#1E293B;margin:0 0 4px">${escapeHtml(data.productName)}</p>
          ${variant}
          <div style="text-align:center;margin-top:24px">
            <a href="${data.productUrl}" style="display:inline-block;background:#2D6A4F;color:#fff;font-size:13px;font-weight:600;padding:14px 32px;text-decoration:none;letter-spacing:1px">SHOP NOW</a>
          </div>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #E2DDD6;text-align:center">
          <p style="font-size:12px;color:#94a3b8;margin:0">Baywoods Store · Nairobi, Kenya</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

// ---------------------------------------------------------------------------
// M-Pesa refund confirmation - sent after a provider refund callback succeeds
// ---------------------------------------------------------------------------
export async function sendRefundSuccessEmail(data: {
  email: string;
  customerName: string;
  orderId: string;
  amount: number;
  receipt: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const shortRef = data.orderId.slice(0, 8).toUpperCase();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://baywoods.co.ke";

  await getResend().emails.send({
    from: FROM,
    to: data.email,
    subject: `Refund Processed — #${shortRef}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:32px 16px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#FAFAF6;border:1px solid #E2DDD6">
        <tr><td style="padding:32px 40px;border-bottom:1px solid #E2DDD6;text-align:center">
          <p style="font-family:Georgia,serif;font-size:24px;letter-spacing:4px;color:#1E293B;margin:0">BAYWOODS</p>
        </td></tr>
        <tr><td style="padding:40px">
          <p style="font-family:Georgia,serif;font-size:22px;color:#1E293B;margin:0 0 8px">Refund Processed</p>
          <p style="font-size:14px;color:#64748b;margin:0 0 24px">Hi ${escapeHtml(data.customerName)}, your M-Pesa refund has been sent back to your account.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;border:1px solid #E2DDD6;margin-bottom:24px">
            <tr>
              <td style="padding:16px 20px;border-bottom:1px solid #E2DDD6">
                <p style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin:0 0 4px">Order Reference</p>
                <p style="font-family:monospace;font-size:15px;font-weight:700;color:#1E293B;margin:0">#${shortRef}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;border-bottom:1px solid #E2DDD6">
                <p style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin:0 0 4px">Refund Amount</p>
                <p style="font-family:monospace;font-size:15px;font-weight:700;color:#1E293B;margin:0">${formatPrice(data.amount)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px">
                <p style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin:0 0 4px">M-Pesa Receipt</p>
                <p style="font-family:monospace;font-size:14px;color:#1E293B;margin:0">${escapeHtml(data.receipt)}</p>
              </td>
            </tr>
          </table>

          <p style="font-size:13px;color:#64748b;margin:0 0 24px">The amount will reflect in your M-Pesa account within minutes. If you have any questions, reply to this email.</p>

          <div style="text-align:center">
            <a href="${baseUrl}/account/orders" style="display:inline-block;background:#1E293B;color:#FAFAF6;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:14px 32px;text-decoration:none">View Your Orders</a>
          </div>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #E2DDD6;text-align:center">
          <p style="font-size:11px;color:#94a3b8;margin:0">BAYWOODS - Kenyan Streetwear</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

// ---------------------------------------------------------------------------
// Admin -- new order notification
// ---------------------------------------------------------------------------
export async function sendAdminOrderNotification(data: {
  orderId: string;
  customerName: string;
  email: string;
  total: number;
  paymentMethod: string;
  items: { name: string; variant: string; qty: number; price: number }[];
  shippingAddress: string;
}) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail || !process.env.RESEND_API_KEY) return;

  const shortRef = data.orderId.slice(0, 8).toUpperCase();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://baywoods.co.ke";

  const itemRows = data.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid #E2DDD6;font-size:12px;color:#1E293B">${escapeHtml(i.name)}${i.variant ? ` <span style="color:#94a3b8">${escapeHtml(i.variant)}</span>` : ""}</td><td style="padding:6px 0;border-bottom:1px solid #E2DDD6;font-size:12px;text-align:right;color:#64748b">${String.fromCharCode(215)}${i.qty}</td><td style="padding:6px 0;border-bottom:1px solid #E2DDD6;font-size:12px;text-align:right;color:#1E293B">${formatPrice(i.price * i.qty)}</td></tr>`
    )
    .join("");

  await getResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject: `New Order #${shortRef} - ${formatPrice(data.total)} via ${data.paymentMethod === "mpesa" ? "M-Pesa" : "payment"}`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:24px 16px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#FAFAF6;border:1px solid #E2DDD6">
<tr><td style="padding:24px 32px;border-bottom:1px solid #E2DDD6;background:#1E293B">
<p style="font-family:Georgia,serif;font-size:20px;letter-spacing:4px;color:#fff;margin:0">BAYWOODS</p>
<p style="font-size:11px;color:#94a3b8;margin:4px 0 0;letter-spacing:1px">NEW ORDER</p>
</td></tr>
<tr><td style="padding:28px 32px">
<p style="font-size:22px;font-family:Georgia,serif;color:#1E293B;margin:0 0 4px">Order #${shortRef}</p>
<p style="font-size:13px;color:#64748b;margin:0 0 20px">${data.customerName} · ${escapeHtml(data.email)} · via ${data.paymentMethod === "mpesa" ? "M-Pesa" : "payment"}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">${itemRows}</table>
<p style="font-size:16px;font-weight:700;color:#1E293B;border-top:2px solid #1E293B;padding-top:10px;margin:0">Total: ${formatPrice(data.total)}</p>
<p style="font-size:12px;color:#64748b;margin:12px 0 0">Ship to: ${escapeHtml(data.shippingAddress)}</p>
<div style="margin-top:24px">
<a href="${baseUrl}/admin/orders" style="display:inline-block;background:#2D6A4F;color:#fff;font-size:12px;font-weight:600;padding:12px 28px;text-decoration:none;letter-spacing:1px">VIEW IN ADMIN</a>
</div>
</td></tr>
</table>
</td></tr></table>
</body></html>`,
  });
}
