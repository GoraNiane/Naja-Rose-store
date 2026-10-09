import { formatCFA, formatDate } from '../../lib/utils';
import { orderService } from '../../services/order.service';
import { Download, Printer, FileText, ShieldCheck, MapPin, Phone, User, Calendar, CreditCard, Sparkles } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export interface InvoiceItem {
  productName: string;
  imageUrl?: string;
  colorName?: string | null;
  sizeName?: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  invoiceNumber?: string;
  orderNumber: string;
  createdAt?: string | Date;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
    address: string;
    city?: string;
  };
  deliveryZoneName: string;
  deliveryAddress: string;
  notes?: string | null;
  paymentMethod: 'WAVE' | 'ORANGE_MONEY' | 'CASH_ON_DELIVERY';
  paymentStatus?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: InvoiceItem[];
}

interface InvoicePreviewProps {
  invoice: InvoiceData;
  isProforma?: boolean;
  onProceedPayment?: () => void;
  onBackToEdit?: () => void;
  isSubmitting?: boolean;
}

export function InvoicePreview({
  invoice,
  isProforma = false,
  onProceedPayment,
  onBackToEdit,
  isSubmitting = false,
}: InvoicePreviewProps) {
  const invoiceNumber = invoice.invoiceNumber || `FAC-${invoice.orderNumber || 'PROFORMA'}`;
  const invoiceDate = invoice.createdAt ? formatDate(invoice.createdAt) : formatDate(new Date().toISOString());

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (invoice.orderNumber && invoice.orderNumber !== 'PROFORMA') {
      const url = orderService.getInvoiceUrl(invoice.orderNumber);
      window.open(url, '_blank');
    } else {
      window.print();
    }
  };

  const getPaymentMethodDetails = (method: string) => {
    switch (method) {
      case 'PAYTECH':
        return {
          name: 'Passerelle PayTech (Wave, Orange Money, Free Money, Carte)',
          badge: 'PayTech 100% Sécurisé',
          color: 'bg-[#FAF2F0] text-[#8B3A4A] border-[#F4E2E0]',
        };
      case 'WAVE':
        return {
          name: 'Wave Sénégal (Paiement Mobile)',
          badge: 'Wave 100% Sécurisé',
          color: 'bg-sky-50 text-sky-800 border-sky-200',
        };
      case 'ORANGE_MONEY':
        return {
          name: 'Orange Money Sénégal (WebPay)',
          badge: 'OM Sécurisé',
          color: 'bg-orange-50 text-orange-800 border-orange-200',
        };
      case 'CASH_ON_DELIVERY':
      default:
        return {
          name: 'Paiement à la Livraison (Espèces / Wave)',
          badge: 'À la Réception',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
    }
  };

  const paymentInfo = getPaymentMethodDetails(invoice.paymentMethod);

  return (
    <div className="space-y-6">
      {/* Top Banner & Print/Download Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FAF2F0] p-4 sm:p-5 rounded-2xl border border-[#F4E2E0] no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B3A4A] text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#2C1E21] flex items-center gap-1.5 font-serif">
              <span>{isProforma ? 'Facture Proforma Pré-Paiement' : 'Facture Officielle Naja Rose'}</span>
              <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-[#8B3A4A] text-white">
                {isProforma ? 'À Valider' : 'Générée'}
              </span>
            </h3>
            <p className="text-[11px] text-[#7A6469]">
              {isProforma
                ? 'Vérifiez le détail de votre facture avant de procéder au règlement'
                : 'Facture enregistrée et conforme aux normes de commerce au Sénégal'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl bg-white border border-[#F2E5E2] hover:border-[#8B3A4A] text-xs font-semibold text-[#382B2F] flex items-center gap-1.5 shadow-2xs hover:bg-[#FAF5F4] transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 rounded-xl bg-[#8B3A4A] hover:bg-[#722E3C] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Télécharger PDF</span>
          </button>
        </div>
      </div>

      {/* Official Invoice Sheet */}
      <div className="bg-white rounded-3xl border border-[#F2E5E2] shadow-sm overflow-hidden p-6 sm:p-10 space-y-8 text-slate-800 print:shadow-none print:border-none print:p-0">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-[#F4E2E0] pb-6 sm:pb-8">
          <div className="space-y-2">
            <BrandLogo size="md" />
            <p className="text-[10px] tracking-widest font-bold uppercase text-[#8B3A4A] pt-1">
              Élégance Style Garanties • Prêt-à-porter de luxe
            </p>
            <p className="text-xs text-[#7A6469] leading-relaxed">
              Showroom & Boutique physique à Dakar, Sénégal
              <br />
              Tél & WhatsApp : <strong>+221 77 381 71 91</strong>
              <br />
              Email : contact@najarosestore.sn
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1 bg-[#FAF2F0] sm:bg-transparent p-4 sm:p-0 rounded-2xl w-full sm:w-auto border border-[#F4E2E0] sm:border-0">
            <span className="text-[11px] font-bold text-[#8B3A4A] uppercase tracking-widest block">
              {isProforma ? 'FACTURE PROFORMA' : 'FACTURE COMMERCIALE'}
            </span>
            <p className="text-lg sm:text-xl font-mono font-black text-[#2C1E21]">{invoiceNumber}</p>
            <div className="text-xs text-[#7A6469] flex sm:justify-end items-center gap-1.5 pt-1">
              <Calendar className="w-3.5 h-3.5 text-[#8B3A4A]" />
              <span>Date d'émission : {invoiceDate}</span>
            </div>
            <p className="text-xs text-[#7A6469] font-mono">Réf : {invoice.orderNumber}</p>
          </div>
        </div>

        {/* Customer and Delivery 2-Column Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Customer */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF5F4] border border-[#F4E2E0] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B3A4A] flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Client Facturé
            </span>
            <p className="font-bold text-sm text-[#2C1E21]">
              {invoice.customer.firstName} {invoice.customer.lastName}
            </p>
            <div className="space-y-1 text-xs text-[#644D52]">
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#8B3A4A]" />
                <span>{invoice.customer.phone}</span>
              </p>
              {invoice.customer.email && <p>Email : {invoice.customer.email}</p>}
            </div>
          </div>

          {/* Destination */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF5F4] border border-[#F4E2E0] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B3A4A] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Destination de Livraison
            </span>
            <p className="font-bold text-sm text-[#2C1E21]">Zone : {invoice.deliveryZoneName}</p>
            <p className="text-xs text-[#644D52] leading-relaxed">
              Adresse : {invoice.deliveryAddress}
            </p>
            {invoice.notes && (
              <p className="text-[11px] text-[#A0888E] italic pt-0.5">
                Repères : {invoice.notes}
              </p>
            )}
          </div>
        </div>

        {/* Products Table */}
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-2xl border border-[#F2E5E2]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#2C1E21] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Article / Modèle</th>
                  <th className="py-3 px-3 text-center">Couleur / Taille</th>
                  <th className="py-3 px-3 text-center">Qté</th>
                  <th className="py-3 px-3 text-right">Prix Unitaire</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2E5E2]">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF5F4]'}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-[#F2E5E2]"
                          />
                        )}
                        <div>
                          <p className="font-bold text-slate-900 leading-snug">{item.productName}</p>
                          <p className="text-[10px] text-[#A0888E]">Collection Naja Rose Dakar</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center text-[#5A464A] whitespace-nowrap">
                      {item.colorName && <span className="font-medium">{item.colorName}</span>}
                      {item.colorName && item.sizeName && ' • '}
                      {item.sizeName && <span className="font-semibold">{item.sizeName}</span>}
                      {!item.colorName && !item.sizeName && '-'}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-slate-700 font-mono">
                      {formatCFA(item.unitPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#2C1E21] font-mono">
                      {formatCFA(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Payment Method Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-2">
          {/* Payment Method Badge (Left) */}
          <div className="md:col-span-6 p-5 rounded-2xl bg-[#FFF9F8] border border-[#F5DCD8] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B3A4A] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Règlement Sélectionné
            </span>
            <p className="text-sm font-bold text-[#2C1E21]">{paymentInfo.name}</p>
            <p className="text-xs text-[#7A6469]">
              {invoice.paymentMethod === 'CASH_ON_DELIVERY'
                ? 'Règlement du montant total à la remise du colis par notre livreur à Dakar.'
                : 'Paiement mobile instantané et sécurisé via application Wave ou Orange Money.'}
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Garantie de livraison & conformité Naja Rose Store</span>
            </div>
          </div>

          {/* Totals Box (Right) */}
          <div className="md:col-span-6 space-y-2 bg-[#FAF5F4] p-5 rounded-2xl border border-[#F4E2E0] text-xs">
            <div className="flex justify-between items-center text-[#644D52]">
              <span>Sous-total articles :</span>
              <span className="font-bold text-slate-900 font-mono">{formatCFA(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-[#644D52]">
              <span>Frais de livraison ({invoice.deliveryZoneName}) :</span>
              <span className="font-bold text-slate-900 font-mono">
                {invoice.deliveryFee > 0 ? `+ ${formatCFA(invoice.deliveryFee)}` : 'Gratuit'}
              </span>
            </div>
            <div className="pt-3 border-t border-[#E7A8B4]/60 flex justify-between items-baseline">
              <span className="font-bold text-sm text-[#2C1E21]">TOTAL NET TTC :</span>
              <span className="font-black text-2xl text-[#8B3A4A] font-display">
                {formatCFA(invoice.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Legal note */}
        <div className="pt-4 border-t border-[#F2E5E2] text-center space-y-1 text-[11px] text-[#A0888E]">
          <p className="font-medium text-[#644D52]">
            Naja Rose Store Sénégal • Confection et prêt-à-porter féminin haut de gamme à Dakar
          </p>
          <p>
            Pour toute assistance ou demande relative à cette facture, écrivez-nous sur WhatsApp au <strong>+221 77 381 71 91</strong>
          </p>
        </div>
      </div>

      {/* Proforma Action Bar: Proceed to Payment */}
      {isProforma && onProceedPayment && (
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 bg-white rounded-3xl border border-[#F2E5E2] shadow-sm no-print">
          {onBackToEdit && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onBackToEdit}
              className="w-full sm:w-auto px-5 py-3 rounded-full border border-slate-200 hover:border-slate-400 text-xs font-semibold text-slate-700 transition-colors"
            >
              ← Modifier mes informations
            </button>
          )}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onProceedPayment}
            className="w-full sm:w-auto flex-1 max-w-md bg-[#8B3A4A] hover:bg-[#722E3C] text-white font-bold text-xs sm:text-sm py-3.5 px-6 rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Génération & Connexion au paiement...'
                : invoice.paymentMethod === 'WAVE'
                ? `Valider la Facture & Payer avec Wave (${formatCFA(invoice.total)})`
                : invoice.paymentMethod === 'ORANGE_MONEY'
                ? `Valider la Facture & Payer avec Orange Money (${formatCFA(invoice.total)})`
                : `Confirmer la Commande & Valider la Facture (${formatCFA(invoice.total)})`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
