import type { AvailabilityStatus, InvoicePaymentStatus, OrderStatus } from '../types/cms';
import type { AppLanguage } from './i18n';

export function formatPrice(
  amount: number,
  currencySymbol = '€',
  lang: AppLanguage = 'fr',
): string {
  const locale = lang === 'en' ? 'en-US' : 'fr-FR';
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currencySymbol}`;
}

export function formatDateFr(iso: string, lang: AppLanguage = 'fr'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatDateTimeFr(iso: string, lang: AppLanguage = 'fr'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getOrderStatusStyle(
  status: OrderStatus,
  lang: AppLanguage = 'fr',
): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (status) {
    case 'Nouvelle':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
        label: lang === 'en' ? 'New' : 'Nouvelle',
      };
    case 'En cours':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        label: lang === 'en' ? 'In progress' : 'En cours',
      };
    case 'Confirmée':
      return {
        bg: 'bg-[#FBF6EA]',
        text: 'text-[#7A5C12]',
        border: 'border-[#E5D3A1]',
        label: lang === 'en' ? 'Confirmed' : 'Confirmée',
      };
    case 'En expédition':
      return {
        bg: 'bg-indigo-50',
        text: 'text-indigo-800',
        border: 'border-indigo-200',
        label: lang === 'en' ? 'Shipping' : 'En expédition',
      };
    case 'Terminée':
      return {
        bg: 'bg-stone-100',
        text: 'text-stone-800',
        border: 'border-stone-300',
        label: lang === 'en' ? 'Completed' : 'Terminée',
      };
    case 'Annulée':
      return {
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-200',
        label: lang === 'en' ? 'Cancelled' : 'Annulée',
      };
  }
}

export function getAvailabilityLabel(
  availability: AvailabilityStatus,
  lang: AppLanguage = 'fr',
): {
  textClass: string;
  label: string;
} {
  switch (availability) {
    case 'En stock':
      return {
        textClass: 'text-[#8F6B18]',
        label: lang === 'en' ? 'Available' : 'Disponible',
      };
    case 'Sur commande':
      return {
        textClass: 'text-amber-800',
        label: lang === 'en' ? 'Made to order' : 'Préparé sur commande',
      };
    case 'Édition limitée':
      return {
        textClass: 'text-stone-700',
        label: lang === 'en' ? 'Limited edition' : 'Édition limitée',
      };
    case 'Rupture':
      return {
        textClass: 'text-red-700',
        label: lang === 'en' ? 'Temporarily unavailable' : 'Momentanément indisponible',
      };
  }
}

export function getInvoicePaymentStatusLabel(
  paymentStatus: InvoicePaymentStatus,
  lang: AppLanguage = 'fr',
): string {
  if (lang === 'fr') return paymentStatus;
  switch (paymentStatus) {
    case 'Payée':
      return 'Paid';
    case 'Partiellement payée':
      return 'Partially paid';
    case 'En attente de paiement':
      return 'Awaiting payment';
    default:
      return paymentStatus;
  }
}
