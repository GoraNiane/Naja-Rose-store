import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Prisma, PaymentStatus } from '@prisma/client';
import { invoiceRepository } from '../repositories/invoice.repository.js';
import { ApiError } from '../utils/apiError.js';

export interface InvoiceOrderData {
  orderNumber: string;
  createdAt: Date;
  deliveryAddress: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  subtotal: Prisma.Decimal | number | string;
  deliveryFee: Prisma.Decimal | number | string;
  total: Prisma.Decimal | number | string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string | null;
    address?: string | null;
    city?: string | null;
  } | null;
  deliveryZone?: {
    name: string;
    price: Prisma.Decimal | number | string;
    estimatedDelivery?: string | null;
  } | null;
  items: Array<{
    productName: string;
    colorName?: string | null;
    sizeName?: string | null;
    quantity: number;
    unitPrice: Prisma.Decimal | number | string;
    total: Prisma.Decimal | number | string;
    variant?: {
      sku?: string | null;
    } | null;
    product?: {
      slug?: string;
      images?: Array<{ url: string }>;
    } | null;
  }>;
  invoice?: {
    invoiceNumber: string;
    createdAt?: Date;
  } | null;
}

function cleanPdfText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/[\u202F\u00A0\u2000-\u200B]/g, ' ')
    .replace(/[•●]/g, '-')
    .replace(/[—–]/g, '-')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x00-\xFF]/g, '');
}

function formatCurrency(amount: Prisma.Decimal | number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '0 FCFA';
  const num = Number(amount);
  const rounded = Math.round(isNaN(num) ? 0 : num);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}

function formatDate(date: Date | string | undefined | null): string {
  if (!date) return new Intl.DateTimeFormat('fr-FR').format(new Date());
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date)).replace(/[\u202F\u00A0]/g, ' ');
}

export class InvoiceService {
  async getByInvoiceNumber(invoiceNumber: string) {
    const invoice = await invoiceRepository.findByInvoiceNumber(invoiceNumber);
    if (!invoice || !invoice.order) {
      throw ApiError.notFound(`Facture ${invoiceNumber} introuvable`);
    }
    return invoice;
  }

  async getByOrderId(orderId: string) {
    const invoice = await invoiceRepository.findByOrderId(orderId);
    if (!invoice || !invoice.order) {
      throw ApiError.notFound(`Facture pour la commande ${orderId} introuvable`);
    }
    return invoice;
  }

  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    paymentStatus?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    return invoiceRepository.findMany(params);
  }

  /**
   * Generates a 100% in-memory A4 PDF invoice buffer using pdf-lib (Zero external font filesystem dependency)
   */
  async generatePdfBuffer(order: InvoiceOrderData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();

    // Standard high-performance embedded fonts (No filesystem read needed on Vercel)
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size in points
    const { width, height } = page.getSize();

    // Palette Couleurs Naja Rose Store
    const cPrimary = rgb(139 / 255, 58 / 255, 74 / 255);       // #8B3A4A
    const cDark = rgb(44 / 255, 30 / 255, 33 / 255);            // #2C1E21
    const cRoseLight = rgb(250 / 255, 242 / 255, 240 / 255);    // #FAF2F0
    const cRoseBorder = rgb(232 / 255, 207 / 255, 207 / 255);   // #E8CFCF
    const cTextMuted = rgb(122 / 255, 100 / 255, 105 / 255);    // #7A6469
    const cWhite = rgb(1, 1, 1);
    const cZebra = rgb(250 / 255, 249 / 255, 247 / 255);

    // 1. Header Banner Box
    const headerTop = height - 40;
    const headerH = 75;
    page.drawRectangle({
      x: 35,
      y: headerTop - headerH,
      width: width - 70,
      height: headerH,
      color: cDark,
    });

    // Brand Name & Subtitle
    page.drawText(cleanPdfText('NAJA ROSE STORE'), {
      x: 55,
      y: headerTop - 30,
      size: 20,
      font: fontBold,
      color: cWhite,
    });
    page.drawText(cleanPdfText('ELEGANCE STYLE GARANTIES - PRET-A-PORTER FEMININ - DAKAR'), {
      x: 55,
      y: headerTop - 46,
      size: 8,
      font: fontRegular,
      color: rgb(216 / 255, 167 / 255, 167 / 255),
    });
    page.drawText(cleanPdfText('Showroom Dakar, Senegal | WhatsApp : +221 77 381 71 91'), {
      x: 55,
      y: headerTop - 60,
      size: 7.5,
      font: fontRegular,
      color: rgb(229 / 255, 220 / 255, 218 / 255),
    });

    // Invoice Title & Ref (Right aligned)
    const invoiceNum = order.invoice?.invoiceNumber || `NRS-${new Date().getFullYear()}-000000`;
    page.drawText(cleanPdfText('FACTURE OFFICIELLE'), {
      x: width - 210,
      y: headerTop - 28,
      size: 13,
      font: fontBold,
      color: cWhite,
    });
    page.drawText(cleanPdfText(invoiceNum), {
      x: width - 210,
      y: headerTop - 44,
      size: 9.5,
      font: fontBold,
      color: rgb(216 / 255, 167 / 255, 167 / 255),
    });
    page.drawText(cleanPdfText(`Date : ${formatDate(order.createdAt)}`), {
      x: width - 210,
      y: headerTop - 58,
      size: 8,
      font: fontRegular,
      color: rgb(229 / 255, 220 / 255, 218 / 255),
    });

    // 2. Info Cards (Client & Delivery)
    const cardY = headerTop - headerH - 18;
    const cardH = 88;
    const cardW = (width - 70 - 15) / 2;

    // Card Left: Client
    page.drawRectangle({
      x: 35,
      y: cardY - cardH,
      width: cardW,
      height: cardH,
      color: cRoseLight,
      borderColor: cRoseBorder,
      borderWidth: 1,
    });

    page.drawText(cleanPdfText('CLIENT FACTURE'), {
      x: 47,
      y: cardY - 18,
      size: 8.5,
      font: fontBold,
      color: cPrimary,
    });

    const customerName = order.customer
      ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 'Client Naja Rose'
      : 'Client Naja Rose';

    page.drawText(cleanPdfText(customerName), {
      x: 47,
      y: cardY - 33,
      size: 9.5,
      font: fontBold,
      color: cDark,
    });
    page.drawText(cleanPdfText(`Telephone : ${order.phone || order.customer?.phone || '+221'}`), {
      x: 47,
      y: cardY - 48,
      size: 8,
      font: fontRegular,
      color: cTextMuted,
    });
    if (order.email || order.customer?.email) {
      page.drawText(cleanPdfText(`Email : ${order.email || order.customer?.email}`), {
        x: 47,
        y: cardY - 60,
        size: 7.5,
        font: fontRegular,
        color: cTextMuted,
      });
    }
    page.drawText(cleanPdfText(`Commande Ref : ${order.orderNumber}`), {
      x: 47,
      y: cardY - 74,
      size: 8,
      font: fontBold,
      color: cDark,
    });

    // Card Right: Delivery
    const rightX = 35 + cardW + 15;
    page.drawRectangle({
      x: rightX,
      y: cardY - cardH,
      width: cardW,
      height: cardH,
      color: cRoseLight,
      borderColor: cRoseBorder,
      borderWidth: 1,
    });

    page.drawText(cleanPdfText('DESTINATION DE LIVRAISON'), {
      x: rightX + 12,
      y: cardY - 18,
      size: 8.5,
      font: fontBold,
      color: cPrimary,
    });
    page.drawText(cleanPdfText(`Zone : ${order.deliveryZone?.name || 'Dakar'}`), {
      x: rightX + 12,
      y: cardY - 33,
      size: 9,
      font: fontBold,
      color: cDark,
    });
    page.drawText(cleanPdfText(`Adresse : ${(order.deliveryAddress || 'Dakar').substring(0, 48)}`), {
      x: rightX + 12,
      y: cardY - 48,
      size: 8,
      font: fontRegular,
      color: cTextMuted,
    });
    if (order.notes) {
      page.drawText(cleanPdfText(`Repere : ${order.notes.substring(0, 48)}`), {
        x: rightX + 12,
        y: cardY - 62,
        size: 7.5,
        font: fontRegular,
        color: cTextMuted,
      });
    }

    // 3. Products Table
    let tableY = cardY - cardH - 22;
    const thHeight = 22;

    page.drawRectangle({
      x: 35,
      y: tableY - thHeight,
      width: width - 70,
      height: thHeight,
      color: cDark,
    });

    page.drawText(cleanPdfText('ARTICLE & DESIGNATION'), { x: 45, y: tableY - 15, size: 7.5, font: fontBold, color: cWhite });
    page.drawText(cleanPdfText('COULEUR'), { x: 235, y: tableY - 15, size: 7.5, font: fontBold, color: cWhite });
    page.drawText(cleanPdfText('TAILLE'), { x: 310, y: tableY - 15, size: 7.5, font: fontBold, color: cWhite });
    page.drawText(cleanPdfText('QTE'), { x: 365, y: tableY - 15, size: 7.5, font: fontBold, color: cWhite });
    page.drawText(cleanPdfText('PRIX UNIT.'), { x: 410, y: tableY - 15, size: 7.5, font: fontBold, color: cWhite });
    page.drawText(cleanPdfText('TOTAL'), { x: 495, y: tableY - 15, size: 7.5, font: fontBold, color: cWhite });

    tableY -= thHeight;

    const rowH = 22;
    (order.items || []).forEach((item, index) => {
      const isEven = index % 2 === 0;
      page.drawRectangle({
        x: 35,
        y: tableY - rowH,
        width: width - 70,
        height: rowH,
        color: isEven ? cWhite : cZebra,
        borderColor: cRoseBorder,
        borderWidth: 0.5,
      });

      const productName = cleanPdfText((item.productName || 'Article Naja Rose').substring(0, 32));
      page.drawText(productName, { x: 45, y: tableY - 15, size: 8, font: fontBold, color: cDark });
      page.drawText(cleanPdfText((item.colorName || '-').substring(0, 14)), { x: 235, y: tableY - 15, size: 7.5, font: fontRegular, color: cTextMuted });
      page.drawText(cleanPdfText((item.sizeName || '-').substring(0, 8)), { x: 310, y: tableY - 15, size: 7.5, font: fontRegular, color: cTextMuted });
      page.drawText(cleanPdfText(String(item.quantity || 1)), { x: 370, y: tableY - 15, size: 7.5, font: fontBold, color: cDark });
      page.drawText(cleanPdfText(formatCurrency(item.unitPrice)), { x: 410, y: tableY - 15, size: 7.5, font: fontRegular, color: cTextMuted });
      page.drawText(cleanPdfText(formatCurrency(item.total)), { x: 495, y: tableY - 15, size: 8, font: fontBold, color: cDark });

      tableY -= rowH;
    });

    // 4. Totals & Payment Summary Box
    tableY -= 16;
    const sumH = 88;

    // Left summary (Payment method)
    page.drawRectangle({
      x: 35,
      y: tableY - sumH,
      width: 260,
      height: sumH,
      color: cRoseLight,
      borderColor: cRoseBorder,
      borderWidth: 1,
    });

    page.drawText(cleanPdfText('REGLEMENT & STATUTS'), {
      x: 47,
      y: tableY - 18,
      size: 8.5,
      font: fontBold,
      color: cPrimary,
    });

    const payLabel =
      order.paymentMethod === 'WAVE'
        ? 'Wave Senegal (Paiement Mobile Direct)'
        : order.paymentMethod === 'ORANGE_MONEY'
        ? 'Orange Money Senegal (WebPay)'
        : order.paymentMethod === 'PAYTECH'
        ? 'Carte Bancaire Visa / Mastercard'
        : 'Paiement a la Livraison (Especes / Wave)';

    page.drawText(cleanPdfText(`Moyen : ${payLabel.substring(0, 36)}`), {
      x: 47,
      y: tableY - 34,
      size: 7.5,
      font: fontRegular,
      color: cDark,
    });

    const statusLabel =
      order.paymentStatus === 'PAID'
        ? 'PAYE / CONFIRME'
        : order.paymentStatus === 'FAILED'
        ? 'ECHEC DE PAIEMENT'
        : 'EN ATTENTE DE PAIEMENT';

    page.drawText(cleanPdfText(`Statut paiement : ${statusLabel}`), {
      x: 47,
      y: tableY - 48,
      size: 7.5,
      font: fontBold,
      color: order.paymentStatus === 'PAID' ? rgb(16 / 255, 120 / 255, 60 / 255) : cPrimary,
    });

    page.drawText(cleanPdfText(`Statut commande : ${order.status === 'NEW' ? 'Enregistree' : order.status}`), {
      x: 47,
      y: tableY - 62,
      size: 7.5,
      font: fontRegular,
      color: cTextMuted,
    });

    if (order.paymentMethod === 'CASH_ON_DELIVERY') {
      page.drawText(cleanPdfText(`MONTANT A REMETTRE : ${formatCurrency(order.total)}`), {
        x: 47,
        y: tableY - 76,
        size: 8,
        font: fontBold,
        color: cDark,
      });
    }

    // Right summary (Financial totals)
    const totX = 310;
    const totW = width - 70 - 275;
    page.drawRectangle({
      x: totX,
      y: tableY - sumH,
      width: totW,
      height: sumH,
      color: cRoseLight,
      borderColor: cRoseBorder,
      borderWidth: 1,
    });

    page.drawText(cleanPdfText('Sous-total articles :'), { x: totX + 12, y: tableY - 20, size: 8, font: fontRegular, color: cTextMuted });
    page.drawText(cleanPdfText(formatCurrency(order.subtotal)), { x: totX + totW - 90, y: tableY - 20, size: 8, font: fontBold, color: cDark });

    page.drawText(cleanPdfText(`Livraison (${order.deliveryZone?.name || 'Dakar'}) :`), { x: totX + 12, y: tableY - 36, size: 8, font: fontRegular, color: cTextMuted });
    page.drawText(cleanPdfText(formatCurrency(order.deliveryFee)), { x: totX + totW - 90, y: tableY - 36, size: 8, font: fontBold, color: cDark });

    page.drawLine({
      start: { x: totX + 12, y: tableY - 50 },
      end: { x: totX + totW - 12, y: tableY - 50 },
      color: cRoseBorder,
      thickness: 1,
    });

    page.drawText(cleanPdfText('TOTAL NET TTC :'), { x: totX + 12, y: tableY - 68, size: 9.5, font: fontBold, color: cPrimary });
    page.drawText(cleanPdfText(formatCurrency(order.total)), { x: totX + totW - 95, y: tableY - 68, size: 11, font: fontBold, color: cPrimary });

    // 5. Footer & Authenticity Notice
    const footerY = 55;
    page.drawLine({
      start: { x: 35, y: footerY + 20 },
      end: { x: width - 35, y: footerY + 20 },
      color: cRoseBorder,
      thickness: 1,
    });

    page.drawText(cleanPdfText('NAJA ROSE STORE SENEGAL - Elegance Style Garanties'), {
      x: 35,
      y: footerY + 8,
      size: 8,
      font: fontBold,
      color: cDark,
    });
    page.drawText(cleanPdfText('Facture certifiee emise par NAJA ROSE STORE - Showroom Dakar, Senegal | WhatsApp : +221 77 381 71 91'), {
      x: 35,
      y: footerY - 4,
      size: 7,
      font: fontRegular,
      color: cTextMuted,
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

export const invoiceService = new InvoiceService();
