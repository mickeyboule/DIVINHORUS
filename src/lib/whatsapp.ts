import type { Order, SiteSettings } from '../types/cms';

export function buildAdminOrderDirectUrl(orderNumber: string, origin?: string): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/admin?order=${encodeURIComponent(orderNumber)}`;
}

export function formatWhatsappDigits(phone?: string | null): string {
  if (!phone) return '';
  let digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  digits = digits.replace(/\+/g, '').replace(/\D/g, '');
  return digits;
}

export function buildOrderWhatsappUrl(
  order: Order,
  settings: SiteSettings,
  formattedTotal: string,
  origin?: string,
  lang: 'fr' | 'en' = 'fr',
): { whatsappUrl: string; adminOrderUrl: string; messageText: string } {
  const adminOrderUrl = buildAdminOrderDirectUrl(order.orderNumber, origin);
  const rawPhone =
    settings.orderSettings.teamWhatsappPhone?.trim() || settings.contact.phone?.trim() || '';
  const digits = formatWhatsappDigits(rawPhone);
  const clientName = `${order.customerFirstName} ${order.customerLastName}`.trim();

  const lines =
    lang === 'en'
      ? [
          `Hello ${settings.general.siteName} team,`,
          `I have just submitted an order request on the shop:`,
          `• Order code: ${order.orderNumber}`,
          `• Customer: ${clientName}`,
          `• Phone: ${order.customerPhone}`,
          `• Total amount: ${formattedTotal}`,
          ``,
          `Direct link to the order (Administration):`,
          adminOrderUrl,
        ]
      : [
          `Bonjour l’équipe ${settings.general.siteName},`,
          `Je viens d’enregistrer une commande sur la boutique :`,
          `• Code commande : ${order.orderNumber}`,
          `• Client : ${clientName}`,
          `• Téléphone : ${order.customerPhone}`,
          `• Somme totale : ${formattedTotal}`,
          ``,
          `Lien direct vers la commande (Administration) :`,
          adminOrderUrl,
        ];
  const messageText = lines.join('\n');
  const base = digits ? `https://wa.me/${digits}` : 'https://wa.me/';
  return {
    whatsappUrl: `${base}?text=${encodeURIComponent(messageText)}`,
    adminOrderUrl,
    messageText,
  };
}
