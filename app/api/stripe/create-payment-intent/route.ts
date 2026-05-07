import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const STRIPE_API_VERSION = "2024-06-20";
const SUPPORTED_CURRENCIES = new Set(["kes", "usd"]);

function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Stripe is not configured");
  return new Stripe(secret, { apiVersion: STRIPE_API_VERSION });
}

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = "kes", metadata } = await req.json();
    const numericAmount = Number(amount);
    const normalizedCurrency = String(currency).toLowerCase();

    if (!Number.isFinite(numericAmount) || numericAmount < 50) {
      return NextResponse.json({ error: "Amount too low" }, { status: 400 });
    }
    if (!SUPPORTED_CURRENCIES.has(normalizedCurrency)) {
      return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(numericAmount * 100),
      currency: normalizedCurrency,
      automatic_payment_methods: { enabled: true },
      metadata: typeof metadata === "object" && metadata !== null ? metadata : {},
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
