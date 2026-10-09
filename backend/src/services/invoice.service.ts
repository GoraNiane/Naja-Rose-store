import PDFDocument from 'pdfkit';
import { Prisma } from '@prisma/client';

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
  } | null;
  items: Array<{
    productName: string;
    colorName?: string | null;
    sizeName?: string | null;
    quantity: number;
    unitPrice: Prisma.Decimal | number | string;
    total: Prisma.Decimal | number | string;
  }>;
  invoice?: {
    invoiceNumber: string;
    createdAt?: Date;
  } | null;
}

function formatCurrency(amount: Prisma.Decimal | number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '0 FCFA';
  const num = Number(amount);
  return `${new Intl.NumberFormat('fr-FR').format(isNaN(num) ? 0 : num)} FCFA`;
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
  async generatePdfBuffer(order: InvoiceOrderData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Facture_${order.invoice?.invoiceNumber || order.orderNumber}`,
          Author: 'NAJA ROSE STORE Dakar',
          Subject: `Facture officielle de commande ${order.orderNumber}`,
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const brandBurgundy = '#8B3A4A';
      const brandDark = '#2C1E21';
      const brandRose = '#E7A8B4';
      const mutedColor = '#7A6469';
      const lightBg = '#FAF2F0';

      // 1. Header Banner
      doc.rect(40, 40, 515, 80).fill(brandDark);

      doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('NAJA ROSE STORE', 60, 55);
      doc.fontSize(9).font('Helvetica').fillColor(brandRose).text('ELEGANCE STYLE GARANTIES • PRÊT-À-PORTER DE LUXE • DAKAR', 60, 80);
      doc.fontSize(8).fillColor('#E8D5D8').text('Showroom & Boutique Dakar, Sénégal | WhatsApp & Tél : +221 77 381 71 91', 60, 95);

      doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text('FACTURE', 420, 55, { align: 'right', width: 115 });
      const invoiceNumber = order.invoice?.invoiceNumber || `FAC-${order.orderNumber}`;
      doc.fontSize(9).font('Helvetica').fillColor(brandRose).text(invoiceNumber, 400, 75, { align: 'right', width: 135 });
      doc.fontSize(8).fillColor('#E8D5D8').text(formatDate(order.createdAt), 400, 90, { align: 'right', width: 135 });

      doc.moveDown(4);

      // 2. Client & Delivery Information Cards
      const startY = 140;

      const customerFullName = order.customer
        ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 'Client Naja Rose'
        : 'Client Naja Rose';
      const customerPhone = order.phone || order.customer?.phone || '+221';
      const customerEmail = order.email || order.customer?.email || '';

      // Left Card: Customer Info
      doc.roundedRect(40, startY, 250, 95, 8).fillAndStroke(lightBg, '#F4E2E0');
      doc.fillColor(brandBurgundy).fontSize(10).font('Helvetica-Bold').text('CLIENT', 52, startY + 10);
      doc.fillColor(brandDark).fontSize(10).font('Helvetica-Bold').text(customerFullName, 52, startY + 25);
      doc.fillColor(mutedColor).fontSize(9).font('Helvetica');
      doc.text(`Tél : ${customerPhone}`, 52, startY + 40);
      if (customerEmail) {
        doc.text(`Email : ${customerEmail}`, 52, startY + 54);
      }
      doc.text(`Réf. Commande : ${order.orderNumber}`, 52, startY + 68);

      // Right Card: Delivery Destination Info
      doc.roundedRect(305, startY, 250, 95, 8).fillAndStroke(lightBg, '#F4E2E0');
      doc.fillColor(brandBurgundy).fontSize(10).font('Helvetica-Bold').text('LIVRAISON AU SÉNÉGAL', 317, startY + 10);
      doc.fillColor(brandDark).fontSize(9).font('Helvetica-Bold').text(`Zone : ${order.deliveryZone?.name || 'Dakar'}`, 317, startY + 25);
      doc.fillColor(mutedColor).fontSize(9).font('Helvetica');
      doc.text(`Adresse : ${order.deliveryAddress || 'Dakar'}`, 317, startY + 40, { width: 225 });
      if (order.notes) {
        doc.text(`Repères : ${order.notes}`, 317, startY + 68, { width: 225 });
      }

      // 3. Products Table
      let tableY = 255;
      doc.rect(40, tableY, 515, 24).fill(brandDark);

      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('ARTICLE / MODÈLE', 50, tableY + 8);
      doc.text('COULEUR', 240, tableY + 8);
      doc.text('TAILLE', 310, tableY + 8);
      doc.text('QTÉ', 360, tableY + 8, { width: 30, align: 'center' });
      doc.text('PRIX UNIT.', 400, tableY + 8, { width: 70, align: 'right' });
      doc.text('TOTAL', 480, tableY + 8, { width: 65, align: 'right' });

      tableY += 24;

      // Table rows
      (order.items || []).forEach((item, index) => {
        const isEven = index % 2 === 0;
        doc.rect(40, tableY, 515, 24).fill(isEven ? '#FFFFFF' : '#FAF5F4');
        doc.rect(40, tableY, 515, 24).stroke('#F2E5E2');

        doc.fillColor(brandDark).fontSize(8).font('Helvetica-Bold');
        doc.text(item.productName || 'Article Naja Rose', 50, tableY + 8, { width: 185, lineBreak: false });

        doc.font('Helvetica').fillColor(mutedColor);
        doc.text(item.colorName || '-', 240, tableY + 8);
        doc.text(item.sizeName || '-', 310, tableY + 8);
        doc.text(String(item.quantity || 1), 360, tableY + 8, { width: 30, align: 'center' });
        doc.text(formatCurrency(item.unitPrice), 400, tableY + 8, { width: 70, align: 'right' });

        doc.font('Helvetica-Bold').fillColor(brandDark);
        doc.text(formatCurrency(item.total), 480, tableY + 8, { width: 65, align: 'right' });

        tableY += 24;
      });

      // 4. Totals Breakdown & Payment Info
      tableY += 15;

      const payMethodLabel =
        order.paymentMethod === 'WAVE'
          ? 'Wave Sénégal (Paiement Mobile 100% Sécurisé)'
          : order.paymentMethod === 'ORANGE_MONEY'
          ? 'Orange Money Sénégal (WebPay)'
          : 'Paiement à la Livraison (Espèces ou Wave)';

      // Payment Details (Left Box)
      doc.roundedRect(40, tableY, 260, 90, 8).fillAndStroke('#FFF7ED', '#FFEDD5');
      doc.fillColor('#9A3412').fontSize(9).font('Helvetica-Bold').text('RÈGLEMENT & PAIEMENT', 52, tableY + 10);
      doc.fillColor(brandDark).fontSize(8.5).font('Helvetica').text(`Mode : ${payMethodLabel}`, 52, tableY + 26, { width: 235 });
      doc.text(`Statut : ${order.paymentStatus === 'PAID' ? 'PAYÉ / VALIDÉ' : 'EN ATTENTE DE VALIDATION'}`, 52, tableY + 50);

      if (order.paymentMethod === 'CASH_ON_DELIVERY') {
        doc.fillColor('#C2410C').fontSize(9).font('Helvetica-Bold').text(
          `MONTANT À REMETTRE : ${formatCurrency(order.total)}`,
          52,
          tableY + 68
        );
      }

      // Totals (Right Box)
      doc.roundedRect(315, tableY, 240, 90, 8).fillAndStroke(lightBg, '#F4E2E0');
      doc.fillColor(mutedColor).fontSize(8).font('Helvetica');
      doc.text('Sous-total articles :', 327, tableY + 12);
      doc.fillColor(brandDark).font('Helvetica-Bold').text(formatCurrency(order.subtotal), 430, tableY + 12, { width: 115, align: 'right' });

      doc.fillColor(mutedColor).font('Helvetica').text(`Frais de livraison (${order.deliveryZone?.name || 'Dakar'}) :`, 327, tableY + 30);
      doc.fillColor(brandDark).font('Helvetica-Bold').text(formatCurrency(order.deliveryFee), 430, tableY + 30, { width: 115, align: 'right' });

      doc.moveTo(327, tableY + 48).lineTo(545, tableY + 48).stroke('#E7A8B4');

      doc.fillColor(brandBurgundy).fontSize(11).font('Helvetica-Bold').text('TOTAL NET TTC :', 327, tableY + 60);
      doc.fillColor(brandDark).fontSize(12).font('Helvetica-Bold').text(formatCurrency(order.total), 430, tableY + 59, { width: 115, align: 'right' });

      // 5. Footer & Legal
      const footerY = 740;
      doc.moveTo(40, footerY).lineTo(555, footerY).stroke('#F2E5E2');
      doc.fillColor(brandBurgundy).fontSize(8.5).font('Helvetica-Bold').text(
        'NAJA ROSE STORE SÉNÉGAL — Elegance Style Garanties',
        40,
        footerY + 10,
        { align: 'center', width: 515 }
      );
      doc.fillColor(mutedColor).fontSize(8).font('Helvetica').text(
        'Des vêtements qui révèlent la meilleure version de vous. Dakar, Sénégal | WhatsApp : +221 77 381 71 91',
        40,
        footerY + 22,
        { align: 'center', width: 515 }
      );

      doc.end();
    });
  }
}

export const invoiceService = new InvoiceService();
