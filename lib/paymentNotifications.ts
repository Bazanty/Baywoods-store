import { sendAdminOrderNotification, sendOrderConfirmation } from "@/lib/email";
import { sendOrderSms } from "@/lib/sms";

export async function sendPaidOrderNotifications(db: any, checkoutRequestId: string) {
  const { data: payment } = await db
    .from("payments")
    .select(`
      order_id,
      orders (
        id, email, shipping_name, shipping_line1, shipping_city, shipping_state,
        shipping_phone, subtotal, shipping_cost, discount_amount, total, payment_method,
        order_items ( product_name, variant_name, quantity, unit_price )
      )
    `)
    .eq("checkout_request_id", checkoutRequestId)
    .single();

  const order = payment?.orders as any;
  if (!order?.email) return;

  const items = (order.order_items ?? []).map((item: any) => ({
    name: item.product_name,
    variant: item.variant_name,
    qty: item.quantity,
    price: Number(item.unit_price),
  }));

  await Promise.allSettled([
    sendOrderConfirmation({
      orderId: order.id,
      customerName: order.shipping_name,
      email: order.email,
      items,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shipping_cost),
      discount: Number(order.discount_amount),
      total: Number(order.total),
      shippingAddress: `${order.shipping_line1}, ${order.shipping_city}, ${order.shipping_state}`,
      paymentMethod: order.payment_method,
    }),
    order.shipping_phone
      ? sendOrderSms({
          phone: order.shipping_phone,
          customerName: order.shipping_name,
          orderId: order.id,
          total: Number(order.total),
        })
      : Promise.resolve(),
    sendAdminOrderNotification({
      orderId: order.id,
      customerName: order.shipping_name,
      email: order.email,
      total: Number(order.total),
      paymentMethod: order.payment_method,
      items,
      shippingAddress: `${order.shipping_line1}, ${order.shipping_city}, ${order.shipping_state}`,
    }),
  ]);
}
