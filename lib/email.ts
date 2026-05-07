import { Resend } from "resend";
import { formatPrice } from "./utils";

const FROM = "Baywoods Store <orders@baywoodsstore.com>";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "placeholder");
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
            <a href="${process.env.NEXTAUTH_URL ?? "https://baywoodsstore.com"}/account/orders" style="display:inline-block;background:#2D6A4F;color:#fff;font-size:13px;font-weight:600;padding:14px 32px;text-decoration:none;letter-spacing:1px">TRACK YOUR ORDER</a>
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
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://baywoodsstore.com";

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
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://baywoodsstore.com";

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
  const base = process.env.NEXTAUTH_URL ?? "https://baywoodsstore.com";

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
            <a href="${process.env.NEXTAUTH_URL ?? "https://baywoodsstore.com"}/shop" style="display:inline-block;background:#2D6A4F;color:#fff;font-size:13px;font-weight:600;padding:14px 32px;text-decoration:none;letter-spacing:1px">SHOP NOW</a>
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
