import { jsPDF } from 'jspdf';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  Mail,
  MessageCircle,
  Printer,
  Share2,
} from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { formatAmountWithCurrency } from '../lib/currency';
import { formatDateFr, getInvoicePaymentStatusLabel } from '../lib/format';
import { getCountryDisplayName } from '../lib/shipping';
import type { OrderInvoice, SiteSettings } from '../types/cms';
import { SafeImage } from './SafeImage';

interface InvoicePreviewProps {
  invoice: OrderInvoice;
  orderNumber: string;
  settings: SiteSettings;
  showPrintButton?: boolean;
}

function pdfSafeText(text: string): string {
  return String(text || '')
    .replace(/[\u00A0\u202F]/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2212\u2013\u2014]/g, '-')
    .replace(/€/g, 'EUR');
}

async function generateInvoicePdfBlob(
  invoice: OrderInvoice,
  orderNumber: string,
  settings: SiteSettings,
  fmt: (amount: number) => string,
  lang: 'fr' | 'en',
  labels: {
    officialInvoice: string;
    orderPrefix: string;
    paymentStatusLabel: string;
    billedTo: string;
    countryLine: string;
    issuanceDetails: string;
    issuedAt: string;
    dueDate: string;
    sentAt: string;
    colDesignation: string;
    colQty: string;
    colUnitPrice: string;
    colTotal: string;
    productsSubtotal: string;
    shippingFee: string;
    free: string;
    discount: string;
    totalDue: string;
    paymentMethodLine: string;
    signatureValidation: string;
  },
): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 16) {
      doc.addPage();
      y = 18;
    }
  };

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 19);
  doc.text(pdfSafeText(settings.general.siteName || 'DIVIN HORUS'), margin, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(42, 64, 54);
  doc.text(pdfSafeText(labels.officialInvoice.toUpperCase()), pageWidth - margin, y - 2, {
    align: 'right',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 19);
  doc.text(pdfSafeText(invoice.invoiceNumber), pageWidth - margin, y + 5, { align: 'right' });

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(92, 90, 85);
  if (settings.general.tagline) {
    doc.text(pdfSafeText(settings.general.tagline), margin, y);
  }
  doc.text(pdfSafeText(labels.orderPrefix), pageWidth - margin, y + 4, { align: 'right' });

  y += 5;
  const addrLine = [settings.contact.address, settings.contact.city, settings.contact.country]
    .filter(Boolean)
    .join(', ');
  if (addrLine) {
    doc.text(pdfSafeText(addrLine), margin, y);
    y += 4;
  }
  const contactLine = [settings.contact.email, settings.contact.phone].filter(Boolean).join(' · ');
  if (contactLine) {
    doc.text(pdfSafeText(contactLine), margin, y);
  }
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(42, 64, 54);
  doc.text(pdfSafeText(labels.paymentStatusLabel), pageWidth - margin, y, { align: 'right' });

  y += 7;
  doc.setDrawColor(230, 228, 223);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Client & Issuance Info side-by-side
  const colWidth = (contentWidth - 8) / 2;
  const leftStartY = y;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 104, 96);
  doc.text(pdfSafeText(labels.billedTo.toUpperCase()), margin, y);
  doc.text(pdfSafeText(labels.issuanceDetails.toUpperCase()), margin + colWidth + 8, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(20, 20, 19);
  doc.text(pdfSafeText(invoice.customerName), margin, y);
  let ly = y + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(92, 90, 85);
  if (invoice.customerPhone) {
    doc.text(pdfSafeText(invoice.customerPhone), margin, ly);
    ly += 4.5;
  }
  if (invoice.customerEmail) {
    doc.text(pdfSafeText(invoice.customerEmail), margin, ly);
    ly += 4.5;
  }
  if (invoice.customerAddress) {
    const wrappedAddr = doc.splitTextToSize(pdfSafeText(invoice.customerAddress), colWidth);
    doc.text(wrappedAddr, margin, ly);
    ly += wrappedAddr.length * 4.2;
  }
  if (labels.countryLine) {
    doc.text(pdfSafeText(labels.countryLine), margin, ly + 0.5);
    ly += 5;
  }

  let ry = leftStartY + 5;
  const rx = margin + colWidth + 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(92, 90, 85);
  doc.text(pdfSafeText(`${labels.issuedAt} ${formatDateFr(invoice.issuedAt, lang)}`), rx, ry);
  ry += 5;
  doc.text(pdfSafeText(`${labels.dueDate} ${formatDateFr(invoice.dueDate, lang)}`), rx, ry);
  ry += 5;
  if (invoice.sentAt) {
    doc.text(pdfSafeText(`${labels.sentAt} ${formatDateFr(invoice.sentAt, lang)}`), rx, ry);
    ry += 5;
  }

  y = Math.max(ly, ry) + 6;

  // Table Header
  ensureSpace(16);
  doc.setFillColor(246, 246, 247);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setDrawColor(227, 227, 230);
  doc.line(margin, y, pageWidth - margin, y);
  doc.line(margin, y + 8, pageWidth - margin, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(92, 90, 85);
  doc.text(pdfSafeText(labels.colDesignation), margin + 3, y + 5.5);
  doc.text(pdfSafeText(labels.colQty), margin + contentWidth * 0.62, y + 5.5, { align: 'center' });
  doc.text(pdfSafeText(labels.colUnitPrice), margin + contentWidth * 0.8, y + 5.5, {
    align: 'right',
  });
  doc.text(pdfSafeText(labels.colTotal), pageWidth - margin - 3, y + 5.5, { align: 'right' });
  y += 10;

  // Table Rows
  for (const line of invoice.items) {
    const descLines = doc.splitTextToSize(pdfSafeText(line.description), contentWidth * 0.54);
    const rowHeight = Math.max(8, descLines.length * 4.5 + (line.reference ? 4 : 2));
    ensureSpace(rowHeight + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(20, 20, 19);
    doc.text(descLines, margin + 3, y + 3.5);

    if (line.reference) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(138, 135, 126);
      doc.text(pdfSafeText(`Ref. ${line.reference}`), margin + 3, y + 3.5 + descLines.length * 4.2);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(20, 20, 19);
    doc.text(String(line.quantity), margin + contentWidth * 0.62, y + 3.5, { align: 'center' });
    doc.text(pdfSafeText(fmt(line.unitPrice)), margin + contentWidth * 0.8, y + 3.5, {
      align: 'right',
    });
    doc.setFont('helvetica', 'bold');
    doc.text(pdfSafeText(fmt(line.quantity * line.unitPrice)), pageWidth - margin - 3, y + 3.5, {
      align: 'right',
    });

    y += rowHeight;
    doc.setDrawColor(240, 239, 234);
    doc.line(margin, y, pageWidth - margin, y);
    y += 2;
  }

  // Totals
  ensureSpace(32);
  y += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(92, 90, 85);
  doc.text(pdfSafeText(labels.productsSubtotal), margin + contentWidth * 0.55, y);
  doc.setTextColor(20, 20, 19);
  doc.text(pdfSafeText(fmt(invoice.subtotal)), pageWidth - margin - 3, y, { align: 'right' });
  y += 5.5;

  doc.setTextColor(92, 90, 85);
  doc.text(pdfSafeText(labels.shippingFee), margin + contentWidth * 0.55, y);
  doc.setTextColor(20, 20, 19);
  doc.text(
    pdfSafeText(invoice.shippingFee === 0 ? labels.free : fmt(invoice.shippingFee)),
    pageWidth - margin - 3,
    y,
    { align: 'right' },
  );
  y += 5.5;

  if (invoice.discount > 0) {
    doc.setTextColor(6, 95, 70);
    doc.text(pdfSafeText(labels.discount), margin + contentWidth * 0.55, y);
    doc.text(pdfSafeText(`- ${fmt(invoice.discount)}`), pageWidth - margin - 3, y, {
      align: 'right',
    });
    y += 5.5;
  }

  doc.setDrawColor(227, 227, 230);
  doc.line(margin + contentWidth * 0.5, y, pageWidth - margin, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(42, 64, 54);
  doc.text(pdfSafeText(labels.totalDue), margin + contentWidth * 0.55, y);
  doc.text(pdfSafeText(fmt(invoice.total)), pageWidth - margin - 3, y, { align: 'right' });
  y += 10;

  // Payment method & Signature
  ensureSpace(34);
  doc.setDrawColor(230, 228, 223);
  doc.setFillColor(250, 249, 246);
  const payText = doc.splitTextToSize(
    pdfSafeText(invoice.paymentDetails || ''),
    contentWidth * 0.58 - 6,
  );
  const boxHeight = Math.max(24, 12 + payText.length * 4.2);
  doc.roundedRect(margin, y, contentWidth * 0.58, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(42, 64, 54);
  doc.text(pdfSafeText(labels.paymentMethodLine), margin + 4, y + 6);
  if (invoice.paymentDetails) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(63, 62, 58);
    doc.text(payText, margin + 4, y + 11.5);
  }

  if (invoice.signature && invoice.signature.type !== 'none') {
    const sigX = margin + contentWidth * 0.62;
    const sigW = contentWidth * 0.38;
    doc.roundedRect(sigX, y, sigW, boxHeight, 2, 2, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(107, 104, 96);
    doc.text(pdfSafeText(labels.signatureValidation.toUpperCase()), sigX + sigW / 2, y + 5.5, {
      align: 'center',
    });

    if (
      (invoice.signature.type === 'image' || invoice.signature.type === 'drawn') &&
      invoice.signature.imageUrl &&
      invoice.signature.imageUrl.startsWith('data:image/')
    ) {
      try {
        const format = invoice.signature.imageUrl.includes('image/jpeg') ? 'JPEG' : 'PNG';
        doc.addImage(invoice.signature.imageUrl, format, sigX + sigW / 2 - 14, y + 7, 28, 10);
      } catch {
        // Fallback to text signer name below
      }
    } else {
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(12);
      doc.setTextColor(42, 64, 54);
      doc.text(
        pdfSafeText(invoice.signature.signerName || settings.general.siteName),
        sigX + sigW / 2,
        y + 13,
        { align: 'center' },
      );
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(92, 90, 85);
    if (invoice.signature.signerName) {
      doc.text(pdfSafeText(invoice.signature.signerName), sigX + sigW / 2, y + boxHeight - 5.5, {
        align: 'center',
      });
    }
    if (invoice.signature.signerRole) {
      doc.text(pdfSafeText(invoice.signature.signerRole), sigX + sigW / 2, y + boxHeight - 2, {
        align: 'center',
      });
    }
  }

  y += boxHeight + 8;

  if (invoice.notes) {
    ensureSpace(16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 104, 96);
    const notesLines = doc.splitTextToSize(pdfSafeText(invoice.notes), contentWidth);
    doc.text(notesLines, margin, y);
  }

  return doc.output('blob');
}

export function InvoicePreview({
  invoice,
  orderNumber,
  settings,
  showPrintButton = true,
}: InvoicePreviewProps) {
  const { lang, t } = useLanguage();
  const [downloading, setDownloading] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [actionError, setActionError] = useState('');

  const decimals = ['FCFA', 'CFA', 'FC', 'GNF', 'AR', 'HTG', 'DA'].includes(
    invoice.currencySymbol.toUpperCase(),
  )
    ? 0
    : 2;

  const fmt = (amount: number) =>
    formatAmountWithCurrency(amount, invoice.currencySymbol, decimals, lang);

  const isPaid = invoice.paymentStatus === 'Payée';
  const paymentStatusLabel = getInvoicePaymentStatusLabel(invoice.paymentStatus, lang);

  const buildPdf = () =>
    generateInvoicePdfBlob(invoice, orderNumber, settings, fmt, lang, {
      officialInvoice: t('invoice.officialInvoice'),
      orderPrefix: t('invoice.orderPrefix', { orderNumber }),
      paymentStatusLabel,
      billedTo: t('invoice.billedTo'),
      countryLine: invoice.customerCountry
        ? t('invoice.countryLabel', {
            country: getCountryDisplayName(invoice.customerCountry, lang),
          })
        : '',
      issuanceDetails: t('invoice.issuanceDetails'),
      issuedAt: t('invoice.issuedAt'),
      dueDate: t('invoice.dueDate'),
      sentAt: t('invoice.sentAt'),
      colDesignation: t('invoice.colDesignation'),
      colQty: t('invoice.colQty'),
      colUnitPrice: t('invoice.colUnitPrice'),
      colTotal: t('invoice.colTotal'),
      productsSubtotal: t('invoice.productsSubtotal'),
      shippingFee: `${t('invoice.shippingFee')}${
        invoice.customerCountry
          ? ` (${getCountryDisplayName(invoice.customerCountry, lang)})`
          : ''
      }`,
      free: t('common.free'),
      discount: t('invoice.discount'),
      totalDue: t('invoice.totalDue'),
      paymentMethodLine: t('invoice.paymentMethod', { method: invoice.paymentMethod }),
      signatureValidation: t('invoice.signatureValidation'),
    });

  const buildShareText = () => {
    const lines = [
      `${settings.general.siteName} — ${t('invoice.officialInvoice')} ${invoice.invoiceNumber}`,
      `${t('invoice.orderPrefix', { orderNumber })}`,
      `${t('invoice.billedTo')}: ${invoice.customerName}`,
      `${t('invoice.totalDue')}: ${fmt(invoice.total)} (${paymentStatusLabel})`,
      `${t('invoice.paymentMethod', { method: invoice.paymentMethod })}`,
      invoice.paymentDetails ? invoice.paymentDetails : '',
      `${window.location.origin}/suivi-commande?num=${encodeURIComponent(orderNumber)}`,
    ].filter(Boolean);
    return lines.join('\n');
  };

  const handleDownloadPdf = async () => {
    setActionError('');
    setDownloading(true);
    try {
      const blob = await buildPdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Facture-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setActionError(t('invoice.downloadError'));
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    setActionError('');
    const shareTitle = `${settings.general.siteName} — ${invoice.invoiceNumber}`;
    const shareText = buildShareText();

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const blob = await buildPdf();
        const file = new File([blob], `Facture-${invoice.invoiceNumber}.pdf`, {
          type: 'application/pdf',
        });
        if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            files: [file],
          });
          return;
        }
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: `${window.location.origin}/suivi-commande?num=${encodeURIComponent(orderNumber)}`,
        });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    setShareMenuOpen((v) => !v);
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildShareText());
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      setActionError(t('invoice.downloadError'));
    }
  };

  const shareTextEncoded = encodeURIComponent(buildShareText());
  const emailSubjectEncoded = encodeURIComponent(
    `${settings.general.siteName} — ${invoice.invoiceNumber} (${orderNumber})`,
  );

  return (
    <div className="space-y-4">
      {showPrintButton && (
        <div className="space-y-2 no-print">
          <div className="flex flex-wrap items-center justify-end gap-2 relative">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2A4036] hover:bg-[#20322A] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? t('invoice.downloadingBtn') : t('invoice.downloadPdfBtn')}</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#D9D6CF] hover:border-[#141413] text-[#141413] text-xs font-semibold rounded-lg transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{t('invoice.shareBtn')}</span>
              </button>

              {shareMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E3E3E6] rounded-xl shadow-lg p-1.5 z-20 text-xs">
                  <a
                    href={`https://wa.me/?text=${shareTextEncoded}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShareMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#141413] hover:bg-[#FAF9F6]"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#128C7E]" />
                    <span>{t('invoice.shareWhatsapp')}</span>
                  </a>
                  <a
                    href={`mailto:?subject=${emailSubjectEncoded}&body=${shareTextEncoded}`}
                    onClick={() => setShareMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#141413] hover:bg-[#FAF9F6]"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#2A4036]" />
                    <span>{t('invoice.shareEmail')}</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#141413] hover:bg-[#FAF9F6] text-left"
                  >
                    {copiedSummary ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="text-emerald-800 font-medium">
                          {t('invoice.shareCopied')}
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#5C5A55]" />
                        <span>{t('invoice.shareCopy')}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#141413] hover:bg-[#2A4036] text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('invoice.printBtn')}</span>
            </button>
          </div>

          {actionError && (
            <p className="text-right text-xs text-red-700">{actionError}</p>
          )}
        </div>
      )}

      <div
        id="printable-invoice"
        className="bg-white border border-[#E3E3E6] rounded-xl p-6 sm:p-8 space-y-6 text-[#141413]"
      >
        {/* Header: Brand & Invoice Meta */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-[#E6E4DF]">
          <div>
            {settings.general.logoUrl ? (
              <SafeImage
                src={settings.general.logoUrl}
                alt={settings.general.siteName}
                className="h-10 w-auto object-contain mb-2"
              />
            ) : (
              <p className="font-display text-2xl font-semibold tracking-tight text-[#141413]">
                {settings.general.siteName}
              </p>
            )}
            <p className="text-xs text-[#5C5A55]">{settings.general.tagline}</p>
            <div className="mt-2 text-[11px] text-[#6B6860] space-y-0.5">
              <p>
                {settings.contact.address} · {settings.contact.city}, {settings.contact.country}
              </p>
              <p>
                {settings.contact.email} · {settings.contact.phone}
              </p>
            </div>
          </div>

          <div className="sm:text-right space-y-1.5">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#2A4036]">
              {t('invoice.officialInvoice')}
            </p>
            <h2 className="text-xl font-mono font-semibold tabular-nums">
              {invoice.invoiceNumber}
            </h2>
            <p className="text-xs text-[#5C5A55] font-mono tabular-nums">
              {t('invoice.orderPrefix', { orderNumber })}
            </p>
            <div className="pt-1 flex sm:justify-end">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold ${
                  isPaid
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : invoice.paymentStatus === 'Partiellement payée'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-stone-100 text-stone-800 border-stone-300'
                }`}
              >
                {isPaid ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                <span>{paymentStatusLabel}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Client & Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="bg-[#FAF9F6] border border-[#E6E4DF] rounded-lg p-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B6860] mb-1.5">
              {t('invoice.billedTo')}
            </p>
            <p className="text-sm font-semibold text-[#141413]">{invoice.customerName}</p>
            {invoice.customerPhone && (
              <p className="font-mono text-[#5C5A55]">{invoice.customerPhone}</p>
            )}
            {invoice.customerEmail && <p className="text-[#5C5A55]">{invoice.customerEmail}</p>}
            <p className="text-[#5C5A55] pt-1">{invoice.customerAddress}</p>
            {invoice.customerCountry && (
              <p className="text-[#6B6860]">
                {t('invoice.countryLabel', {
                  country: getCountryDisplayName(invoice.customerCountry, lang),
                })}
              </p>
            )}
          </div>

          <div className="bg-[#FAF9F6] border border-[#E6E4DF] rounded-lg p-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B6860]">
              {t('invoice.issuanceDetails')}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[#5C5A55]">{t('invoice.issuedAt')}</span>
              <span className="font-mono tabular-nums font-medium">
                {formatDateFr(invoice.issuedAt, lang)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#5C5A55]">{t('invoice.dueDate')}</span>
              <span className="font-mono tabular-nums font-medium">
                {formatDateFr(invoice.dueDate, lang)}
              </span>
            </div>
            {invoice.sentAt && (
              <div className="flex items-center justify-between">
                <span className="text-[#5C5A55]">{t('invoice.sentAt')}</span>
                <span className="font-mono tabular-nums font-medium">
                  {formatDateFr(invoice.sentAt, lang)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-[#E3E3E6] rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#E3E3E6] text-[11px] font-semibold text-[#5C5A55]">
                <th className="py-2.5 px-4">{t('invoice.colDesignation')}</th>
                <th className="py-2.5 px-3 text-center">{t('invoice.colQty')}</th>
                <th className="py-2.5 px-3 text-right">{t('invoice.colUnitPrice')}</th>
                <th className="py-2.5 px-4 text-right">{t('invoice.colTotal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFEA]">
              {invoice.items.map((line) => (
                <tr key={line.id}>
                  <td className="py-3 px-4">
                    <p className="font-medium text-[#141413]">{line.description}</p>
                    {line.reference && (
                      <p className="text-[11px] font-mono text-[#8A877E]">
                        {t('invoice.refPrefix', { ref: line.reference })}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums">
                    {line.quantity}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-[#5C5A55]">
                    {fmt(line.unitPrice)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                    {fmt(line.quantity * line.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-[#FAF9F6] border-t border-[#E3E3E6] p-4 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[#5C5A55]">
              <span>{t('invoice.productsSubtotal')}</span>
              <span className="font-mono tabular-nums text-[#141413]">{fmt(invoice.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-[#5C5A55]">
              <span>
                {t('invoice.shippingFee')}
                {invoice.customerCountry
                  ? ` (${getCountryDisplayName(invoice.customerCountry, lang)})`
                  : ''}
              </span>
              <span className="font-mono tabular-nums text-[#141413]">
                {invoice.shippingFee === 0 ? t('common.free') : fmt(invoice.shippingFee)}
              </span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex items-center justify-between text-emerald-800">
                <span>{t('invoice.discount')}</span>
                <span className="font-mono tabular-nums">− {fmt(invoice.discount)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-[#E3E3E6] flex items-center justify-between text-base font-semibold text-[#141413]">
              <span>{t('invoice.totalDue')}</span>
              <span className="font-mono tabular-nums text-[#2A4036]">{fmt(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method & Signature */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-7 bg-[#FAF9F6] border border-[#2A4036]/25 rounded-lg p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-[#2A4036] font-semibold">
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>{t('invoice.paymentMethod', { method: invoice.paymentMethod })}</span>
            </div>
            {invoice.paymentDetails ? (
              <p className="text-[#3F3E3A] whitespace-pre-line leading-relaxed">
                {invoice.paymentDetails}
              </p>
            ) : (
              <p className="text-[#6B6860] italic">{t('invoice.noPaymentDetails')}</p>
            )}
          </div>

          {invoice.signature && invoice.signature.type !== 'none' && (
            <div className="md:col-span-5 border border-[#E6E4DF] rounded-lg p-4 text-center space-y-2">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-[#6B6860]">
                {t('invoice.signatureValidation')}
              </p>

              {(invoice.signature.type === 'image' || invoice.signature.type === 'drawn') &&
              invoice.signature.imageUrl ? (
                <div className="h-20 flex items-center justify-center bg-white rounded border border-[#F0EFEA] p-2">
                  <img
                    src={invoice.signature.imageUrl}
                    alt={t('invoice.signatureAlt', {
                      name: invoice.signature.signerName || t('invoice.directionFallback'),
                    })}
                    className="max-h-16 max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="py-3">
                  <p className="font-display italic text-2xl text-[#2A4036]">
                    {invoice.signature.signerName || settings.general.siteName}
                  </p>
                </div>
              )}

              <div className="text-[11px] text-[#5C5A55]">
                {invoice.signature.signerName && (
                  <p className="font-semibold text-[#141413]">{invoice.signature.signerName}</p>
                )}
                {invoice.signature.signerRole && <p>{invoice.signature.signerRole}</p>}
              </div>
            </div>
          )}
        </div>

        {invoice.notes && (
          <div className="pt-4 border-t border-[#EFECE6] text-[11px] text-[#6B6860] leading-relaxed whitespace-pre-line">
            {invoice.notes}
          </div>
        )}
      </div>
    </div>
  );
}
