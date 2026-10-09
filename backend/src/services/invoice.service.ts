import PDFDocument from 'pdfkit';
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

function formatCurrency(amount: Prisma.Decimal | number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '0 FCFA';
  const num = Number(amount);
  return `${new Intl.NumberFormat('fr-FR').format(isNaN(num) ? 0 : Math.round(num))} FCFA`;
}

function formatDate(date: Date | string | undefined | null): string {
  if (!date) return new Intl.DateTimeFormat('fr-FR').format(new Date());
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
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

  async generatePdfBuffer(order: InvoiceOrderData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Facture_${order.invoice?.invoiceNumber || order.orderNumber}`,
          Author: 'NAJA ROSE STORE Dakar',
          Subject: `Facture de commande ${order.orderNumber} - NAJA ROSE STORE`,
          Keywords: 'Naja Rose Store, Facture, Dakar, Mode, Prêt-à-porter',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Palette de couleurs officielle Naja Rose Store
      const colorPowderRose = '#D8A7A7'; // Rose poudré
      const colorLightRose = '#F7EEEE';  // Rose clair
      const colorRoseBeige = '#E8CFCF';  // Beige rosé
      const colorOffWhite = '#FAF9F7';   // Blanc cassé
      const colorSoftDark = '#242020';   // Noir doux
      const colorMutedGray = '#77706D';  // Gris secondaire

      // 1. Header Banner
      doc.rect(40, 40, 515, 82).fill(colorSoftDark);

      doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('NAJA ROSE STORE', 60, 56);
      doc.fontSize(9).font('Helvetica').fillColor(colorPowderRose).text('ÉLÉGANCE STYLE GARANTIES • PRÊT-À-PORTER FÉMININ • DAKAR', 60, 81);
      doc.fontSize(8).font('Helvetica').fillColor('#E5DCDA').text('Showroom Dakar, Sénégal | WhatsApp : +221 77 381 71 91', 60, 96);

      doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text('FACTURE', 400, 56, { align: 'right', width: 135 });
      const invoiceNumber = order.invoice?.invoiceNumber || `NRS-${new Date().getFullYear()}-000000`;
      doc.fontSize(9).font('Helvetica-Bold').fillColor(colorPowderRose).text(invoiceNumber, 400, 76, { align: 'right', width: 135 });
      doc.fontSize(8).font('Helvetica').fillColor('#E5DCDA').text(formatDate(order.createdAt), 400, 91, { align: 'right', width: 135 });

      // 2. Client & Delivery Destination Information Cards
      const startY = 138;
      const customerFullName = order.customer
        ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 'Client Naja Rose'
        : 'Client Naja Rose';
      const customerPhone = order.phone || order.customer?.phone || '+221';
      const customerEmail = order.email || order.customer?.email || '';

      // Left Box: Facturé à (Client)
      doc.roundedRect(40, startY, 250, 96, 6).fillAndStroke(colorLightRose, colorRoseBeige);
      doc.fillColor(colorSoftDark).fontSize(9.5).font('Helvetica-Bold').text('CLIENT FACTURÉ', 52, startY + 10);
      doc.fillColor(colorSoftDark).fontSize(10).font('Helvetica-Bold').text(customerFullName, 52, startY + 24);
      doc.fillColor(colorMutedGray).fontSize(8.5).font('Helvetica');
      doc.text(`Tél : ${customerPhone}`, 52, startY + 39);
      if (customerEmail) {
        doc.text(`Email : ${customerEmail}`, 52, startY + 52);
      }
      doc.fillColor(colorSoftDark).font('Helvetica-Bold').text(`Commande N° : ${order.orderNumber}`, 52, startY + 68);

      // Right Box: Lieu & Zone de Livraison
      doc.roundedRect(305, startY, 250, 96, 6).fillAndStroke(colorLightRose, colorRoseBeige);
      doc.fillColor(colorSoftDark).fontSize(9.5).font('Helvetica-Bold').text('DESTINATION DE LIVRAISON', 317, startY + 10);
      doc.fillColor(colorSoftDark).fontSize(9).font('Helvetica-Bold').text(`Zone : ${order.deliveryZone?.name || 'Dakar'}`, 317, startY + 24);
      doc.fillColor(colorMutedGray).fontSize(8.5).font('Helvetica');
      doc.text(`Adresse : ${order.deliveryAddress || 'Dakar'}`, 317, startY + 39, { width: 225 });
      if (order.notes) {
        doc.text(`Point de repère : ${order.notes}`, 317, startY + 66, { width: 225 });
      }

      // 3. Products Table
      let tableY = 250;
      doc.rect(40, tableY, 515, 24).fill(colorSoftDark);

      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('ARTICLE & DÉSIGNATION', 50, tableY + 8);
      doc.text('COULEUR', 240, tableY + 8);
      doc.text('TAILLE', 310, tableY + 8);
      doc.text('QTÉ', 360, tableY + 8, { width: 30, align: 'center' });
      doc.text('PRIX UNIT.', 400, tableY + 8, { width: 70, align: 'right' });
      doc.text('TOTAL', 480, tableY + 8, { width: 65, align: 'right' });

      tableY += 24;

      // Table rows
      (order.items || []).forEach((item, index) => {
        // Page break safety check
        if (tableY > 680) {
          doc.addPage();
          tableY = 50;
          // Re-draw table header on new page
          doc.rect(40, tableY, 515, 24).fill(colorSoftDark);
          doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
          doc.text('ARTICLE & DÉSIGNATION', 50, tableY + 8);
          doc.text('COULEUR', 240, tableY + 8);
          doc.text('TAILLE', 310, tableY + 8);
          doc.text('QTÉ', 360, tableY + 8, { width: 30, align: 'center' });
          doc.text('PRIX UNIT.', 400, tableY + 8, { width: 70, align: 'right' });
          doc.text('TOTAL', 480, tableY + 8, { width: 65, align: 'right' });
          tableY += 24;
        }

        const isEven = index % 2 === 0;
        doc.rect(40, tableY, 515, 26).fill(isEven ? '#FFFFFF' : colorOffWhite);
        doc.rect(40, tableY, 515, 26).stroke(colorRoseBeige);

        doc.fillColor(colorSoftDark).fontSize(8.5).font('Helvetica-Bold');
        doc.text(item.productName || 'Article Naja Rose', 50, tableY + 8, { width: 185, lineBreak: false });

        doc.font('Helvetica').fontSize(8).fillColor(colorMutedGray);
        doc.text(item.colorName || '-', 240, tableY + 9);
        doc.text(item.sizeName || '-', 310, tableY + 9);
        doc.text(String(item.quantity || 1), 360, tableY + 9, { width: 30, align: 'center' });
        doc.text(formatCurrency(item.unitPrice), 400, tableY + 9, { width: 70, align: 'right' });

        doc.font('Helvetica-Bold').fillColor(colorSoftDark);
        doc.text(formatCurrency(item.total), 480, tableY + 9, { width: 65, align: 'right' });

        tableY += 26;
      });

      // 4. Totals Breakdown & Payment Info
      tableY += 14;
      if (tableY > 640) {
        doc.addPage();
        tableY = 50;
      }

      const payMethodLabel =
        order.paymentMethod === 'WAVE'
          ? 'Wave Sénégal (Paiement Mobile 100% Sécurisé)'
          : order.paymentMethod === 'ORANGE_MONEY'
          ? 'Orange Money Sénégal (WebPay)'
          : 'Paiement à la Livraison (Espèces ou Wave)';

      const paymentStatusLabel =
        order.paymentStatus === 'PAID'
          ? 'PAYÉ / VALIDÉ'
          : order.paymentStatus === 'FAILED'
          ? 'ÉCHEC DE PAIEMENT'
          : 'EN ATTENTE DE PAIEMENT';

      // Payment Details (Left Box)
      doc.roundedRect(40, tableY, 260, 95, 6).fillAndStroke(colorLightRose, colorRoseBeige);
      doc.fillColor(colorSoftDark).fontSize(9.5).font('Helvetica-Bold').text('RÈGLEMENT & STATUTS', 52, tableY + 10);
      doc.fillColor(colorSoftDark).fontSize(8.5).font('Helvetica').text(`Mode : ${payMethodLabel}`, 52, tableY + 26, { width: 235 });
      doc.text(`Statut paiement : ${paymentStatusLabel}`, 52, tableY + 50);
      doc.text(`Statut commande : ${order.status === 'NEW' ? 'En attente' : order.status}`, 52, tableY + 65);

      if (order.paymentMethod === 'CASH_ON_DELIVERY') {
        doc.fillColor(colorSoftDark).fontSize(8.5).font('Helvetica-Bold').text(
          `MONTANT À REMETTRE : ${formatCurrency(order.total)}`,
          52,
          tableY + 79
        );
      }

      // Totals (Right Box)
      doc.roundedRect(315, tableY, 240, 95, 6).fillAndStroke(colorLightRose, colorRoseBeige);
      doc.fillColor(colorMutedGray).fontSize(8.5).font('Helvetica');
      doc.text('Sous-total vêtements :', 327, tableY + 12);
      doc.fillColor(colorSoftDark).font('Helvetica-Bold').text(formatCurrency(order.subtotal), 430, tableY + 12, { width: 115, align: 'right' });

      doc.fillColor(colorMutedGray).font('Helvetica').text(`Frais de livraison (${order.deliveryZone?.name || 'Dakar'}) :`, 327, tableY + 30);
      doc.fillColor(colorSoftDark).font('Helvetica-Bold').text(formatCurrency(order.deliveryFee), 430, tableY + 30, { width: 115, align: 'right' });

      doc.moveTo(327, tableY + 50).lineTo(545, tableY + 50).stroke(colorPowderRose);

      doc.fillColor(colorSoftDark).fontSize(10.5).font('Helvetica-Bold').text('TOTAL NET TTC :', 327, tableY + 63);
      doc.fillColor(colorSoftDark).fontSize(12.5).font('Helvetica-Bold').text(formatCurrency(order.total), 430, tableY + 61, { width: 115, align: 'right' });

      // 5. Footer & Legal
      const footerY = 745;
      doc.moveTo(40, footerY).lineTo(555, footerY).stroke(colorRoseBeige);
      doc.fillColor(colorSoftDark).fontSize(8.5).font('Helvetica-Bold').text(
        'NAJA ROSE STORE SÉNÉGAL — Elegance Style Garanties',
        40,
        footerY + 9,
        { align: 'center', width: 515 }
      );
      doc.fillColor(colorMutedGray).fontSize(7.5).font('Helvetica').text(
        'Facture émise automatiquement par NAJA ROSE STORE • Dakar, Sénégal | WhatsApp : +221 77 381 71 91',
        40,
        footerY + 22,
        { align: 'center', width: 515 }
      );

      doc.end();
    });
  }
}

export const invoiceService = new InvoiceService();
