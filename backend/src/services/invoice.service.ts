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
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    city?: string | null;
  };
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

function formatCurrency(amount: Prisma.Decimal | number | string): string {
  const num = Number(amount);
  return `${new Intl.NumberFormat('fr-FR').format(num)} FCFA`;
}

function formatDate(date: Date): string {
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
          Author: 'NAJA STORE Dakar',
          Subject: `Facture de commande ${order.orderNumber}`,
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#854D0E'; // Amber-800
      const darkColor = '#0F172A'; // Slate-900
      const mutedColor = '#64748B'; // Slate-500
      const lightBg = '#F8FAFC'; // Slate-50

      // 1. Header Banner
      doc.rect(40, 40, 515, 75).fill(darkColor);

      doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('NAJA STORE', 60, 55);
      doc.fontSize(9).font('Helvetica').fillColor('#FCD34D').text('MAISON DE COUTURE & MAROQUINERIE • DAKAR', 60, 80);
      doc.fontSize(8).fillColor('#CBD5E1').text('Point E, Boulevard du Sud, Dakar, Sénégal | +221 77 000 00 00', 60, 93);

      doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text('FACTURE', 420, 55, { align: 'right', width: 115 });
      const invoiceNumber = order.invoice?.invoiceNumber || `FAC-${order.orderNumber}`;
      doc.fontSize(9).font('Helvetica').fillColor('#FCD34D').text(invoiceNumber, 400, 75, { align: 'right', width: 135 });
      doc.fontSize(8).fillColor('#CBD5E1').text(formatDate(order.createdAt), 400, 90, { align: 'right', width: 135 });

      doc.moveDown(4);

      // 2. Client & Delivery Information Cards
      const startY = 135;
      
      // Left Card: Customer Info
      doc.roundedRect(40, startY, 250, 95, 6).fillAndStroke(lightBg, '#E2E8F0');
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('CLIENT', 52, startY + 10);
      doc.fillColor(darkColor).fontSize(10).font('Helvetica-Bold').text(`${order.customer.firstName} ${order.customer.lastName}`, 52, startY + 25);
      doc.fillColor(mutedColor).fontSize(9).font('Helvetica');
      doc.text(`Tél : ${order.phone || order.customer.phone}`, 52, startY + 40);
      if (order.email || order.customer.email) {
        doc.text(`Email : ${order.email || order.customer.email}`, 52, startY + 54);
      }
      doc.text(`Réf. Commande : ${order.orderNumber}`, 52, startY + 68);

      // Right Card: Delivery Destination Info
      doc.roundedRect(305, startY, 250, 95, 6).fillAndStroke(lightBg, '#E2E8F0');
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('LIVRAISON AU SÉNÉGAL', 317, startY + 10);
      doc.fillColor(darkColor).fontSize(9).font('Helvetica-Bold').text(`Zone : ${order.deliveryZone?.name || 'Dakar'}`, 317, startY + 25);
      doc.fillColor(mutedColor).fontSize(9).font('Helvetica');
      doc.text(`Adresse : ${order.deliveryAddress}`, 317, startY + 40, { width: 225 });
      if (order.notes) {
        doc.text(`Repères : ${order.notes}`, 317, startY + 68, { width: 225 });
      }

      // 3. Products Table
      let tableY = 250;
      doc.rect(40, tableY, 515, 24).fill(darkColor);

      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('ARTICLE / MODÈLE', 50, tableY + 8);
      doc.text('COULEUR', 240, tableY + 8);
      doc.text('TAILLE', 310, tableY + 8);
      doc.text('QTÉ', 360, tableY + 8, { width: 30, align: 'center' });
      doc.text('PRIX UNIT.', 400, tableY + 8, { width: 70, align: 'right' });
      doc.text('TOTAL', 480, tableY + 8, { width: 65, align: 'right' });

      tableY += 24;

      // Table rows
      order.items.forEach((item, index) => {
        const isEven = index % 2 === 0;
        doc.rect(40, tableY, 515, 24).fill(isEven ? '#FFFFFF' : '#F8FAFC');
        doc.rect(40, tableY, 515, 24).stroke('#E2E8F0');

        doc.fillColor(darkColor).fontSize(8).font('Helvetica-Bold');
        doc.text(item.productName, 50, tableY + 8, { width: 185, lineBreak: false });

        doc.font('Helvetica').fillColor(mutedColor);
        doc.text(item.colorName || '-', 240, tableY + 8);
        doc.text(item.sizeName || '-', 310, tableY + 8);
        doc.text(String(item.quantity), 360, tableY + 8, { width: 30, align: 'center' });
        doc.text(formatCurrency(item.unitPrice), 400, tableY + 8, { width: 70, align: 'right' });

        doc.font('Helvetica-Bold').fillColor(darkColor);
        doc.text(formatCurrency(item.total), 480, tableY + 8, { width: 65, align: 'right' });

        tableY += 24;
      });

      // 4. Totals Breakdown & Payment Info
      tableY += 15;

      // Payment Details (Left Box)
      const payMethodLabel =
        order.paymentMethod === 'WAVE'
          ? 'Wave Sénégal'
          : order.paymentMethod === 'ORANGE_MONEY'
          ? 'Orange Money Sénégal'
          : 'Paiement à la Livraison (Espèces / Wave)';

      doc.roundedRect(40, tableY, 260, 85, 6).fillAndStroke('#FEF3C7', '#FDE68A');
      doc.fillColor('#92400E').fontSize(9).font('Helvetica-Bold').text('MODE DE RÈGLEMENT', 52, tableY + 10);
      doc.fillColor(darkColor).fontSize(9).font('Helvetica').text(`Méthode : ${payMethodLabel}`, 52, tableY + 26);
      doc.text(`Statut paiement : ${order.paymentStatus === 'PAID' ? 'PAYÉ' : 'EN ATTENTE'}`, 52, tableY + 40);

      if (order.paymentMethod === 'CASH_ON_DELIVERY') {
        doc.fillColor('#B45309').fontSize(9).font('Helvetica-Bold').text(
          `À PAYER À LA LIVRAISON : ${formatCurrency(order.total)}`,
          52,
          tableY + 58
        );
      }

      // Totals (Right Box)
      doc.roundedRect(315, tableY, 240, 85, 6).fillAndStroke(lightBg, '#CBD5E1');
      doc.fillColor(mutedColor).fontSize(8).font('Helvetica');
      doc.text('Sous-total articles :', 327, tableY + 12);
      doc.fillColor(darkColor).font('Helvetica-Bold').text(formatCurrency(order.subtotal), 430, tableY + 12, { width: 115, align: 'right' });

      doc.fillColor(mutedColor).font('Helvetica').text(`Frais de livraison (${order.deliveryZone?.name || 'Dakar'}) :`, 327, tableY + 30);
      doc.fillColor(darkColor).font('Helvetica-Bold').text(formatCurrency(order.deliveryFee), 430, tableY + 30, { width: 115, align: 'right' });

      doc.moveTo(327, tableY + 48).lineTo(545, tableY + 48).stroke('#CBD5E1');

      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('TOTAL TTC :', 327, tableY + 58);
      doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold').text(formatCurrency(order.total), 430, tableY + 57, { width: 115, align: 'right' });

      // 5. Footer & Legal
      const footerY = 740;
      doc.moveTo(40, footerY).lineTo(555, footerY).stroke('#E2E8F0');
      doc.fillColor(mutedColor).fontSize(8).font('Helvetica').text(
        'NAJA STORE SÉNÉGAL — Confection artisanale haut de gamme et prêt-à-porter de luxe.',
        40,
        footerY + 10,
        { align: 'center', width: 515 }
      );
      doc.text(
        'Pour toute question ou suivi de votre commande, contactez notre service client au +221 77 000 00 00 ou via WhatsApp.',
        40,
        footerY + 22,
        { align: 'center', width: 515 }
      );

      doc.end();
    });
  }
}

export const invoiceService = new InvoiceService();
