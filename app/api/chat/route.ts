import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the Baywoods store assistant — a helpful, knowledgeable guide for an online Kenyan streetwear shop. Keep responses short and practical.

**What Baywoods sells:**
Shoes (sneakers, loafers, boots), hoodies, jorts (denim shorts), joggers, sweatpants, shirts, caps, belts, and accessories. All products target the Kenyan streetwear market with a clean, urban aesthetic.

**Sizing:**
- Clothing: XS, S, M, L, XL, XXL. When in doubt, recommend sizing up for an oversized fit popular in streetwear.
- Shoes: EU sizing 38–45. True to size unless stated on the product page.

**Shipping:**
- Kenya-wide delivery: 2–5 business days (Nairobi usually 1–2 days).
- Shipping fee calculated at checkout based on location.
- Orders above a certain threshold may qualify for free shipping — customers should check the cart.

**Returns & exchanges:**
- 7-day return window from delivery date.
- Items must be unworn, unwashed, with original tags.
- Exchange or store credit issued; no cash refunds unless item is faulty.
- Customer contacts support via the Contact page to initiate a return.

**Payments:**
- M-Pesa (STK push — customer gets a prompt on their phone) and Stripe (card).
- No cash on delivery currently.

**General guidance:**
- For specific product availability or stock questions, direct customers to browse the shop or use the search.
- For order issues (not received, wrong item), direct them to the Contact page.
- If you don't know something specific, say so honestly and point to the Contact page.
- Do not make up prices, product names, or policies not listed above.
- Respond in English unless the customer writes in Swahili, then respond in Swahili.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("Chat unavailable — API key not configured.", { status: 503 });
  }

  let messages: { role: string; content: string }[];
  try {
    ({ messages } = await req.json());
  } catch {
    return new Response("Invalid request body.", { status: 400 });
  }

  try {
    const stream = await client.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: messages as any,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("[chat] Anthropic error:", err);
    return new Response("Failed to get a response. Please try again.", { status: 500 });
  }
}
