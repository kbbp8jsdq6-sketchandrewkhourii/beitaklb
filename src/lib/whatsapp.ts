/**
 * WhatsApp helpers for BEITAK.
 */

export const WHATSAPP_NUMBER = "96181160435";

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

export function buildWhatsAppHref(message: string, phoneNumber?: string): string {
  const number = (phoneNumber ?? WHATSAPP_NUMBER).replace(/[^\d]/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds the WhatsApp href immediately using the full listing URL.
 */
export function buildListingWhatsAppHref(
  payload: WhatsAppListingMessage,
  phoneNumber?: string,
): string {
  const message = phoneNumber
    ? buildHostListingMessage(payload)
    : buildListingMessage(payload);
  return buildWhatsAppHref(message, phoneNumber);
}

/**
 * Friendly host-targeted message: "Hi! I am interested in booking [title]
 * located in [location] for [price] per night..."
 */
export function buildHostListingMessage({
  title,
  location,
  pricePerNight,
  priceWeekday,
  priceWeekend,
  url,
}: WhatsAppListingMessage): string {
  const candidates = [priceWeekday, priceWeekend, pricePerNight].filter(
    (n): n is number => typeof n === "number" && !Number.isNaN(n),
  );
  const minPrice = candidates.length ? Math.round(Math.min(...candidates)) : 0;
  const priceLabel = minPrice ? `$${minPrice}` : "the listed price";
  return [
    `Hi! I am interested in booking ${title} located in ${location} for ${priceLabel} per night.`,
    "Can you please help me with the reservation?",
    "",
    `Listing: ${url}`,
  ].join("\n");
}
