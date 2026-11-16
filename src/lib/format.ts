import type { AvailabilityStatus, OrderStatus } from '../types/cms';

export function formatPrice(amount: number, currencySymbol = '€'): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currencySymbol}`;
}

export function formatDateFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatDateTimeFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getOrderStatusStyle(status: OrderStatus): {
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
        label: 'Nouvelle',
      };
    case 'En cours':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        label: 'En cours',
      };
    case 'Confirmée':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        label: 'Confirmée',
      };
    case 'Terminée':
      return {
        bg: 'bg-stone-100',
        text: 'text-stone-800',
        border: 'border-stone-300',
        label: 'Terminée',
      };
    case 'Annulée':
      return {
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-200',
        label: 'Annulée',
      };
  }
}

export function getAvailabilityLabel(availability: AvailabilityStatus): {
  textClass: string;
  label: string;
} {
  switch (availability) {
    case 'En stock':
      return { textClass: 'text-[#2A4036]', label: 'Disponible' };
    case 'Sur commande':
      return { textClass: 'text-amber-800', label: 'Préparé sur commande' };
    case 'Édition limitée':
      return { textClass: 'text-stone-700', label: 'Édition limitée' };
    case 'Rupture':
      return { textClass: 'text-red-700', label: 'Momentanément indisponible' };
  }
}
