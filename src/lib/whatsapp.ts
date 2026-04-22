/**
 * WhatsApp helpers for BEITAK.
 * Uses TinyURL's free API to shorten listing URLs so messages stay clean.
 */

export const WHATSAPP_NUMBER = "96181160435";

export async function shortenUrl(longUrl: string): Promise<string> {
  try {
    const res = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`,
    );
    if (!res.ok) return longUrl;
    const text = (await res.text()).trim();
    if (text.startsWith("http")) return text;
    return longUrl;
  } catch {
    return longUrl;
  }
}

export interface WhatsAppListingMessage {
  title: string;
  location: string;
  /** Used as fallback when weekday/weekend prices aren't provided. */
  pricePerNight?: number;
  priceWeekday?: number;
  priceWeekend?: number;
  url: string;
}

export function buildListingMessage({
  title,
  location,
  pricePerNight,
  priceWeekday,
  priceWeekend,
  url,
}: WhatsAppListingMessage): string {
  let priceLine: string;
  if (priceWeekday != null && priceWeekend != null) {
    priceLine = `💰 Weekday: $${Math.round(priceWeekday)} / night | Weekend: $${Math.round(priceWeekend)} / night`;
  } else {
    priceLine = `$${Math.round(pricePerNight ?? priceWeekday ?? priceWeekend ?? 0)} / night`;
  }
  return [
    "Hi Beitak!",
    "",
    "I'm interested in the following listing:",
    "",
    title,
    "",
    location,
    "",
    priceLine,
    "",
    `View listing: ${url}`,
    "",
    "Could you help me with availability and booking?",
  ].join("\n");
}

export function buildWhatsAppHref(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Build a WhatsApp link for a listing using a TinyURL-shortened URL.
 * Falls back to the original URL if shortening fails.
 */
export async function buildListingWhatsAppHref(
  payload: WhatsAppListingMessage,
): Promise<string> {
  const shortUrl = await shortenUrl(payload.url);
  const message = buildListingMessage({ ...payload, url: shortUrl });
  return buildWhatsAppHref(message);
}
