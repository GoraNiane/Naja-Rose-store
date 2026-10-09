import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { formatCFA, formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import {
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  MessageCircle,
  RotateCcw,
} from 'lucide-react';
import { APP_CONFIG } from '../lib/constants';
import { InvoicePreview, type InvoiceData } from '../components/common/InvoicePreview';

export function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || '';
  const [showFullInvoice, setShowFullInvoice] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Poll the order and its verified payment status every 2.5s while PENDING
  const {
    data: order,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['order-success-verification', orderNumber],
    queryFn: () => orderService.getOrderByNumber(orderNumber),
    enabled: !!orderNumber,
    refetchInterval: (query) => {
      const status = query.state.data?.paymentStatus;
      return status === 'PENDING' || status === 'PROCESSING' ? 2500 : false;
    },
    staleTime: 2000,
  });

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      setIsDownloadingPdf(true);
      await orderService.downloadInvoicePdf(
        order.orderNumber || order.id,
        order.invoice?.invoiceNumber || order.orderNumber
      );
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const orderTotal = Math.round(Number(order?.total || 0));
  const amountPaid = Math.round(
    Number(order?.amountPaid !== undefined ? order.amountPaid : (order?.paymentStatus === 'PAID' ? orderTotal : 0))
  );
  const remainingBalance = Math.max(
    0,
    Math.round(
      Number(order?.remainingBalance !== undefined ? order.remainingBalance : (order?.paymentStatus === 'PAID' ? 0 : orderTotal))
    )
  );

  const isPaid = order?.paymentStatus === 'PAID' || (order && remainingBalance === 0);
  const isPartiallyPaid = order?.paymentStatus === 'PARTIALLY_PAID' || (amountPaid > 0 && remainingBalance > 0);
  const isPending = !order || order.paymentStatus === 'PENDING' || order.paymentStatus === 'PROCESSING';
  const isReviewRequired = order?.paymentStatus === 'REVIEW_REQUIRED';
  const isFailed = order?.paymentStatus === 'FAILED' || order?.paymentStatus === 'CANCELLED';

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* 1. STATE-SPECIFIC HERO BANNER */}

      {/* STATE A: PENDING VERIFICATION */}
      {isPending && (
        <div className="text-center space-y-3 bg-sky-50/70 border border-sky-200 p-8 rounded-3xl">
          <div className="w-16 h-16 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mx-auto shadow-xs">
            <Spinner size="lg" />
          </div>
          <span className="text-xs font-bold text-sky-800 uppercase tracking-widest block pt-1">
            Contrôle Automatique Sécurisé
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif italic font-bold text-[#2C1E21]">
            Vérification de votre paiement en cours...
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6469] max-w-md mx-auto leading-relaxed">
            Nous interrogeons la passerelle officielle pour confirmer la réception de votre règlement. Cette page s'actualise automatiquement dès validation.
          </p>
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-4 py-2 bg-white hover:bg-sky-50 text-sky-900 border border-sky-300 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-700 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Vérifier le statut du paiement</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE B: FULLY PAID */}
      {isPaid && (
        <div className="text-center space-y-3 bg-emerald-50/60 border border-emerald-200 p-8 rounded-3xl">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <span className="text-xs font-bold text-[#8B3A4A] uppercase tracking-widest block pt-1">
            Jërëjëf ! Paiement Confirmé
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif italic font-bold text-[#2C1E21]">
            Paiement confirmé. Votre facture est intégralement réglée.
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6469] max-w-md mx-auto leading-relaxed">
            Votre commande <strong>#{orderNumber}</strong> a été validée avec succès par notre système. Notre atelier à Dakar prépare votre colis avec soin.
          </p>
        </div>
      )}

      {/* STATE C: PARTIALLY PAID */}
      {isPartiallyPaid && !isPaid && (
        <div className="text-center space-y-3 bg-amber-50/80 border border-amber-300 p-8 rounded-3xl">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <span className="text-xs font-bold text-amber-900 uppercase tracking-widest block pt-1">
            Acompte Vérifié
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif italic font-bold text-[#2C1E21]">
            Paiement partiel confirmé
          </h1>
          <p className="text-xs sm:text-sm text-amber-950 max-w-md mx-auto leading-relaxed">
            Montant reçu : <strong className="font-mono">{formatCFA(amountPaid)}</strong> • Solde restant :{' '}
            <strong className="font-mono text-base text-[#8B3A4A]">{formatCFA(remainingBalance)}</strong> sur un total de {formatCFA(orderTotal)}.
          </p>
          <div className="pt-2 flex justify-center">
            <Link to={`/commande/${orderNumber}/facture`}>
              <Button variant="gold" size="md">
                Régler le solde restant ({formatCFA(remainingBalance)})
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* STATE D: REVIEW REQUIRED */}
      {isReviewRequired && (
        <div className="text-center space-y-3 bg-orange-50/80 border-2 border-orange-300 p-8 rounded-3xl">
          <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-10 h-10 text-orange-600" />
          </div>
          <span className="text-xs font-bold text-orange-900 uppercase tracking-widest block pt-1">
            Vérification Manuelle
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif italic font-bold text-[#2C1E21]">
            Votre paiement nécessite une vérification.
          </h1>
          <p className="text-xs sm:text-sm text-orange-950 max-w-md mx-auto leading-relaxed">
            Une incohérence sur le montant ou la référence de votre transaction a été détectée. Veuillez contacter notre service client pour débloquer votre commande.
          </p>
          <div className="pt-2 flex justify-center">
            <a
              href={`https://wa.me/${APP_CONFIG.whatsapp.replace(/\+/g, '')}?text=Bonjour%20Naja%20Store,%20je%20vous%20contacte%20concernant%20la%20vérification%20du%20paiement%20de%20ma%20commande%20${orderNumber}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="gold" size="md" leftIcon={<MessageCircle className="w-4 h-4" />}>
                Contacter le Service Client WhatsApp
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* STATE E: FAILED / CANCELLED */}
      {isFailed && (
        <div className="text-center space-y-3 bg-rose-50/80 border border-rose-300 p-8 rounded-3xl">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center mx-auto shadow-xs">
            <XCircle className="w-10 h-10 text-rose-600" />
          </div>
          <span className="text-xs font-bold text-rose-900 uppercase tracking-widest block pt-1">
            Transaction Interrompue
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif italic font-bold text-[#2C1E21]">
            Paiement non finalisé ou annulé
          </h1>
          <p className="text-xs sm:text-sm text-rose-950 max-w-md mx-auto leading-relaxed">
            La tentative de règlement n'a pas pu être validée. Votre commande <strong>#{orderNumber}</strong> reste conservée sans créer de doublon.
          </p>
          <div className="pt-2 flex justify-center">
            <Link to={`/commande/${orderNumber}/facture`}>
              <Button variant="gold" size="md" leftIcon={<RotateCcw className="w-4 h-4" />}>
                Réessayer le paiement de ma commande
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 2. ORDER DETAILS & INVOICE CONTROLS */}
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
              <button
                type="button"
                disabled={isDownloadingPdf}
                onClick={handleDownloadInvoice}
                className="px-3.5 py-2 rounded-xl bg-[#8B3A4A] hover:bg-[#722E3C] disabled:opacity-75 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                {isDownloadingPdf ? <Spinner size="sm" /> : <Download className="w-3.5 h-3.5" />}
                <span>{isDownloadingPdf ? 'Téléchargement...' : 'Télécharger Facture (PDF)'}</span>
              </button>
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

          {/* Full Invoice Preview (Toggled) */}
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
                  <span className="text-xs text-slate-400">Statut du Paiement</span>
                  <p
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isPaid
                        ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                        : isPartiallyPaid
                        ? 'text-amber-900 bg-amber-50 border border-amber-300'
                        : isReviewRequired
                        ? 'text-orange-900 bg-orange-50 border border-orange-300'
                        : isFailed
                        ? 'text-rose-800 bg-rose-50 border border-rose-200'
                        : 'text-sky-800 bg-sky-50 border border-sky-200'
                    }`}
                  >
                    {isPaid
                      ? 'Payé (Intégralement réglé)'
                      : isPartiallyPaid
                      ? 'Partiellement payé'
                      : isReviewRequired
                      ? 'Vérification requise'
                      : isFailed
                      ? 'Échoué / Annulé'
                      : 'En cours de vérification'}
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
                    <span className="font-semibold text-slate-900 font-mono">{formatCFA(item.total)}</span>
                  </div>
                ))}
              </div>

              {/* Totals & Balance Breakdown */}
              <div className="pt-4 border-t border-[#F4E2E0] space-y-2 text-xs text-slate-600 font-mono">
                <div className="flex justify-between">
                  <span>Sous-total articles</span>
                  <span className="font-medium text-slate-900">{formatCFA(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais de livraison ({order.deliveryZone?.name || 'Dakar'})</span>
                  <span className="font-medium text-slate-900">{formatCFA(order.deliveryFee)}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-base text-slate-950">
                  <span>Total Facture</span>
                  <span className="font-display font-black text-[#8B3A4A]">
                    {formatCFA(orderTotal)}
                  </span>
                </div>
                {amountPaid > 0 && (
                  <div className="pt-1 flex justify-between text-emerald-700 font-semibold text-xs">
                    <span>Montant Reçu & Confirmé :</span>
                    <span>- {formatCFA(amountPaid)}</span>
                  </div>
                )}
                {remainingBalance > 0 && (
                  <div className="flex justify-between text-[#8B3A4A] font-bold text-sm">
                    <span>Solde Restant à Régler :</span>
                    <span>{formatCFA(remainingBalance)}</span>
                  </div>
                )}
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
        <div className="p-6 bg-amber-50 rounded-2xl text-xs text-amber-800 text-center">
          Référence de commande : <strong>{orderNumber || 'Enregistrée'}</strong>.
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-4 justify-center items-center pt-2">
        <Link to="/shop">
          <Button variant="gold" size="lg" leftIcon={<ShoppingBag className="w-4 h-4" />}>
            Continuer mes achats
          </Button>
        </Link>
        <Link to={`/orders/${orderNumber}`}>
          <Button variant="outline" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Suivre l'acheminement
          </Button>
        </Link>
      </div>
    </div>
  );
}
