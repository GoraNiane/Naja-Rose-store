import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { formatCFA, formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { CheckCircle2, ShoppingBag, ArrowRight, Download, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { APP_CONFIG } from '../lib/constants';
import { InvoicePreview, type InvoiceData } from '../components/common/InvoicePreview';

export function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || '';
  const [showFullInvoice, setShowFullInvoice] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-success', orderNumber],
    queryFn: () => orderService.getOrderByNumber(orderNumber),
    enabled: !!orderNumber,
  });

  const invoiceData: InvoiceData | null = order
    ? {
        invoiceNumber: order.invoice?.invoiceNumber || `FAC-${order.orderNumber}`,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customer: {
          firstName: order.customer?.firstName || '',
          lastName: order.customer?.lastName || '',
          phone: order.phone || order.customer?.phone || '',
          email: order.email || order.customer?.email || null,
          address: order.deliveryAddress || order.customer?.address || '',
          city: order.customer?.city || 'Dakar',
        },
        deliveryZoneName: order.deliveryZone?.name || 'Dakar',
        deliveryAddress: order.deliveryAddress,
        notes: order.notes,
        paymentMethod: order.paymentMethod as any,
        paymentStatus: order.paymentStatus,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        total: Number(order.total),
        items: (order.items || []).map((i: any) => ({
          productName: i.productName,
          imageUrl: i.product?.images?.[0]?.url,
          colorName: i.colorName,
          sizeName: i.sizeName,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          total: Number(i.total),
        })),
      }
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs font-bold text-[#8B3A4A] uppercase tracking-widest block pt-2">
          Jërëjëf ! Merci pour votre confiance
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif italic font-bold text-[#2C1E21]">
          Commande & Facture Validées avec Succès
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6469] max-w-md mx-auto">
          Votre commande a bien été enregistrée par notre atelier à Dakar. Nous préparons votre colis avec le plus grand soin.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Spinner size="md" />
        </div>
      ) : order ? (
        <div className="space-y-6">
          {/* Quick Order Actions Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF2F0] p-4 rounded-2xl border border-[#F4E2E0]">
            <div>
              <span className="text-[11px] text-[#A0888E]">Facture & Commande :</span>
              <p className="font-mono font-bold text-sm text-[#2C1E21]">{order.orderNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={orderService.getInvoiceUrl(order.orderNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#8B3A4A] hover:bg-[#722E3C] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger Facture (PDF)</span>
              </a>
              <button
                type="button"
                onClick={() => setShowFullInvoice(!showFullInvoice)}
                className="px-3 py-2 rounded-xl bg-white border border-[#F2E5E2] hover:border-[#8B3A4A] text-xs font-semibold text-[#382B2F] flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{showFullInvoice ? 'Masquer la Facture' : 'Afficher la Facture'}</span>
                {showFullInvoice ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Full Invoice Preview (Toggled or inline) */}
          {showFullInvoice && invoiceData && (
            <div className="pt-2">
              <InvoicePreview invoice={invoiceData} isProforma={false} />
            </div>
          )}

          {/* Summary Card */}
          {!showFullInvoice && (
            <div className="bg-white rounded-3xl border border-[#F2E5E2] p-6 sm:p-8 text-left shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#F4E2E0]">
                <div>
                  <span className="text-xs text-slate-400">N° de Commande</span>
                  <p className="font-mono font-bold text-slate-900 text-base">{order.orderNumber}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Date</span>
                  <p className="text-xs font-medium text-slate-800">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Statut</span>
                  <p className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {order.status}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B3A4A]">
                  Articles commandés
                </h3>
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center text-xs py-1">
                    <div>
                      <p className="font-semibold text-slate-800">{item.productName}</p>
                      <p className="text-slate-500 text-[11px]">
                        Qté: {item.quantity} {item.colorName && `• ${item.colorName}`}{' '}
                        {item.sizeName && `• ${item.sizeName}`}
                      </p>
                    </div>
                    <span className="font-semibold text-slate-900">{formatCFA(item.total)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-4 border-t border-[#F4E2E0] space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span className="font-mono font-medium text-slate-900">{formatCFA(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais de livraison ({order.deliveryZone?.name || 'Dakar'})</span>
                  <span className="font-mono font-medium text-slate-900">{formatCFA(order.deliveryFee)}</span>
                </div>
                <div className="pt-2 flex justify-between font-bold text-base text-slate-950">
                  <span>Total Réglé</span>
                  <span className="font-display font-black text-[#8B3A4A]">
                    {formatCFA(order.total)}
                  </span>
                </div>
              </div>

              {/* Delivery destination */}
              <div className="p-4 rounded-2xl bg-[#FAF5F4] border border-[#F4E2E0] text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Adresse de livraison :</p>
                <p>
                  {order.customer?.firstName} {order.customer?.lastName} • {order.phone}
                </p>
                <p>{order.deliveryAddress}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 bg-amber-50 rounded-2xl text-xs text-amber-800">
          Votre référence de commande est : <strong>{orderNumber || 'Enregistrée'}</strong>. Un SMS / Email de confirmation vous a été adressé.
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-4 justify-center items-center pt-2">
        <Link to="/shop">
          <Button variant="gold" size="lg" leftIcon={<ShoppingBag className="w-4 h-4" />}>
            Continuer mes achats
          </Button>
        </Link>
        <a
          href={`https://wa.me/${APP_CONFIG.whatsapp.replace(/\+/g, '')}?text=Bonjour%20Naja%20Store,%20je%20souhaite%20suivre%20ma%20commande%20${orderNumber}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Assistance WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
}
