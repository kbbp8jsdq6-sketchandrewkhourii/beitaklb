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
  preferredDate?: string;
  backupDate?: string;
  guests?: number;
}

/** Formats an ISO yyyy-mm-dd string as "Nov 14, 2026". */
function formatReservationDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
  }).format(new Date(y, m - 1, d));
}

export function reservationListingUrl(url: string): string {
  const [withoutHash] = url.split("#");
  const [path, query] = (withoutHash ?? url).split("?");
  const search = new URLSearchParams(query);
  search.set("src", "reserve");
  return `${path}?${search.toString()}`;
}

export function buildListingMessage({
  title,
  url,
  preferredDate,
  backupDate,
  guests,
}: WhatsAppListingMessage): string {
  const details = [
    ...(preferredDate ? [`Preferred date: ${formatReservationDate(preferredDate)}`] : []),
    ...(backupDate ? [`Backup date: ${formatReservationDate(backupDate)}`] : []),
    ...(guests != null ? [`Guests: ${guests}`] : []),
  ];
  return [
    "Hi Beitak!",
    "",
    "I'm interested in the following listing:",
    "",
    `*${title}*`,
    "",
    ...(details.length ? [...details, ""] : []),
    "I understand prices may vary on public holidays and that the final price is confirmed after inquiry.",
    "",
    `View listing: ${reservationListingUrl(url)}`,
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

/** All listing reservation entry points share the same message format. */
export function buildHostListingMessage(payload: WhatsAppListingMessage): string {
  return buildListingMessage(payload);
}
