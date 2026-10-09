import { useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { paymentService } from '../services/payment.service';
import { formatCFA, formatDate } from '../lib/utils';
import { BrandLogo } from '../components/common/BrandLogo';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import {
  Download,
  Printer,
  FileText,
  ShieldCheck,
  MapPin,
  Phone,
  User,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShoppingBag,
  RotateCcw,
  RefreshCw,
  MessageCircle,
  History,
} from 'lucide-react';

export function InvoicePage() {
  const { orderNumber, id } = useParams<{ orderNumber?: string; id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const ref = orderNumber || id || searchParams.get('orderNumber') || '';
  const paymentParam = searchParams.get('payment'); // 'cancelled' | 'failed'

  type SelectedPaymentMethod = 'PAYTECH' | 'WAVE' | 'ORANGE_MONEY' | 'CASH_ON_DELIVERY';
  const [selectedMethod, setSelectedMethod] = useState<SelectedPaymentMethod>('PAYTECH');
  const [paymentError, setPaymentError] = useState<string | null>(
    paymentParam === 'failed' || paymentParam === 'cancelled'
      ? 'La tentative de paiement a été interrompue ou annulée sur la passerelle. Vous pouvez réessayer ci-dessous ou choisir un autre mode de règlement.'
      : null
  );
  const [codConfirmed, setCodConfirmed] = useState(false);

  // Fetch Order and Invoice Data
  const {
    data: orderData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['order-invoice', ref],
    queryFn: async () => {
      if (!ref) return null;
      try {
        if (ref.startsWith('CMD-')) {
          return await orderService.getOrderByNumber(ref);
        }
        return await orderService.getOrderById(ref);
      } catch {
        return await orderService.getOrderByNumber(ref);
      }
    },
    enabled: !!ref,
    staleTime: 5000,
    refetchInterval: (query) => {
      // Auto-poll every 4s if payment is pending
      const status = query.state.data?.paymentStatus;
      return status === 'PENDING' || status === 'PROCESSING' ? 4000 : false;
    },
  });

  const order = orderData;
  const invoiceNumber = order?.invoice?.invoiceNumber || `NRS-${new Date().getFullYear()}-000000`;

  // Payment Initiation Mutation
  const initiatePaymentMutation = useMutation({
    mutationFn: async (method: SelectedPaymentMethod) => {
      if (!order) throw new Error('Commande non chargée');
      return paymentService.initiatePayment({
        orderNumber: order.orderNumber,
        orderId: order.id,
        paymentMethod: method,
        successUrl: `${window.location.origin}/checkout/success?orderNumber=${order.orderNumber}`,
        cancelUrl: `${window.location.origin}/commande/${order.orderNumber}/facture?payment=cancelled`,
      });
    },
    onSuccess: (paymentData: any) => {
      if (selectedMethod === 'CASH_ON_DELIVERY') {
        setCodConfirmed(true);
        queryClient.invalidateQueries({ queryKey: ['order-invoice', ref] });
        return;
      }

      const redirectUrl =
        paymentData?.paymentUrl ||
        paymentData?.redirectUrl ||
        paymentData?.launchUrl ||
        paymentData?.wave_launch_url ||
        paymentData?.payment_url;

      if (redirectUrl) {
        // 1. If it's a relative URL, navigate internally with React Router
        if (redirectUrl.startsWith('/')) {
          navigate(redirectUrl);
          return;
        }

        // 2. Parse absolute URLs
        try {
          const parsed = new URL(redirectUrl, window.location.origin);

          // If it targets an internal application route or localhost dev URL, navigate internally
          if (
            parsed.origin === window.location.origin ||
            parsed.pathname.startsWith('/checkout') ||
            parsed.pathname.startsWith('/commande') ||
            parsed.hostname === 'localhost' ||
            parsed.hostname === '127.0.0.1'
          ) {
            navigate(`${parsed.pathname}${parsed.search}${parsed.hash}`);
            return;
          }

          // 3. External Gateway (PayTech, Wave mobile, etc.)
          window.location.href = redirectUrl;
        } catch {
          window.location.href = redirectUrl;
        }
      } else {
        navigate(`/checkout/success?orderNumber=${order?.orderNumber}`);
      }
    },
    onError: (err: any) => {
      setPaymentError(
        err.message || 'Impossible de lancer la session de paiement. Veuillez réessayer ou contacter notre service client.'
      );
    },
  });

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!order) return;
    try {
      setIsDownloadingPdf(true);
      await orderService.downloadInvoicePdf(
        order.orderNumber || order.id,
        order.invoice?.invoiceNumber || order.orderNumber
      );
    } catch (err: any) {
      console.error('Invoice PDF Download failed:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleScrollToPayment = () => {
    const el = document.getElementById('payment-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 space-y-4">
        <Spinner size="lg" />
        <p className="text-xs text-[#7A6469] font-medium animate-pulse">
          Émission de votre facture officielle Naja Rose Store...
        </p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-serif text-[#2C1E21]">Facture introuvable</h2>
          <p className="text-xs text-[#7A6469]">
            Aucune commande active ne correspond à la référence <strong>« {ref} »</strong>.
          </p>
        </div>
        <div className="pt-2 flex flex-col gap-2.5">
          <Link to="/shop">
            <Button variant="gold" size="md" className="w-full">
              Retourner à la boutique
            </Button>
          </Link>
          <Link to="/orders">
            <Button variant="outline" size="md" className="w-full">
              Rechercher une commande
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Exact math from verified DB states
  const orderTotal = Math.round(Number(order.total || 0));
  const amountPaid = Math.round(
    Number(order.amountPaid !== undefined ? order.amountPaid : (order.paymentStatus === 'PAID' ? orderTotal : 0))
  );
  const remainingBalance = Math.max(
    0,
    Math.round(
      Number(order.remainingBalance !== undefined ? order.remainingBalance : (order.paymentStatus === 'PAID' ? 0 : orderTotal))
    )
  );

  const isPaid = order.paymentStatus === 'PAID' || remainingBalance === 0;
  const isPartiallyPaid =
    order.paymentStatus === 'PARTIALLY_PAID' || (amountPaid > 0 && remainingBalance > 0);
  const isPending = order.paymentStatus === 'PENDING' || order.paymentStatus === 'PROCESSING';
  const isFailed = order.paymentStatus === 'FAILED' || order.paymentStatus === 'CANCELLED';
  const isReviewRequired = order.paymentStatus === 'REVIEW_REQUIRED';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Banner & Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#FAF2F0] p-4 sm:p-6 rounded-3xl border border-[#F4E2E0] no-print shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#8B3A4A] text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-[#2C1E21] font-serif">
                Facture Officielle Naja Rose
              </h1>
              <span
                className={`text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full ${
                  isPaid
                    ? 'bg-emerald-100 text-emerald-800'
                    : isPartiallyPaid
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : isReviewRequired
                    ? 'bg-orange-100 text-orange-900 border border-orange-300'
                    : isFailed
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-[#8B3A4A] text-white'
                }`}
              >
                {isPaid
                  ? 'Payée (Intégralement réglée)'
                  : isPartiallyPaid
                  ? 'Partiellement payée'
                  : isReviewRequired
                  ? 'Vérification requise'
                  : isFailed
                  ? 'Échec / Annulé'
                  : 'En attente de paiement'}
              </span>
            </div>
            <p className="text-xs text-[#7A6469] mt-0.5">
              Consultez et téléchargez votre facture avant de choisir votre moyen de paiement sécurisé.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 flex-wrap sm:flex-nowrap">
          {!isPaid && !codConfirmed && !isReviewRequired && (
            <button
              type="button"
              onClick={handleScrollToPayment}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-[#242020] hover:bg-[#382B2F] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#D8A7A7]" />
              <span>{isPartiallyPaid ? 'Régler le solde' : 'Choisir le paiement'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-2xl bg-white border border-[#F2E5E2] hover:border-[#8B3A4A] text-xs font-bold text-[#2C1E21] flex items-center justify-center gap-1.5 shadow-2xs hover:bg-[#FAF5F4] transition-colors"
          >
            <Printer className="w-4 h-4 text-[#8B3A4A]" />
            <span>Imprimer</span>
          </button>
          <button
            type="button"
            disabled={isDownloadingPdf}
            onClick={handleDownloadPdf}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-[#8B3A4A] hover:bg-[#722E3C] disabled:opacity-75 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            {isDownloadingPdf ? (
              <>
                <Spinner size="sm" />
                <span>Téléchargement...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Télécharger PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5. Dynamic Client Notification Banners (Requirement 5) */}

      {/* 5.1 Fully Paid Confirmation Banner */}
      {isPaid && (
        <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start sm:items-center gap-3.5 no-print shadow-xs">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1">
            <p className="font-bold text-sm text-emerald-950">
              Paiement confirmé. Votre facture est intégralement réglée.
            </p>
            <p className="mt-0.5 text-emerald-800">
              Merci pour votre achat chez Naja Rose Store ! Votre commande <strong>{order.orderNumber}</strong> est validée et en cours de préparation par notre atelier.
            </p>
          </div>
        </div>
      )}

      {/* 5.2 Partially Paid Banner */}
      {isPartiallyPaid && !isPaid && (
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print shadow-xs">
          <div className="flex items-start gap-3.5">
            <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-amber-950">Paiement partiel confirmé !</p>
              <p className="mt-1 text-amber-900 leading-relaxed">
                Montant reçu : <strong className="font-mono">{formatCFA(amountPaid)}</strong> • Solde restant :{' '}
                <strong className="font-mono text-amber-950 text-sm">{formatCFA(remainingBalance)}</strong> sur un total de {formatCFA(orderTotal)}.
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Vous pouvez régler ce solde dès maintenant pour débloquer la livraison immédiate.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleScrollToPayment}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shrink-0 transition-colors shadow-xs flex items-center justify-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Régler le solde ({formatCFA(remainingBalance)})</span>
          </button>
        </div>
      )}

      {/* 5.3 Pending Verification Banner */}
      {isPending && !isPaid && !isPartiallyPaid && (
        <div className="p-5 rounded-3xl bg-sky-50 border border-sky-200 text-xs text-sky-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print shadow-xs">
          <div className="flex items-start gap-3.5">
            <Spinner size="md" />
            <div>
              <p className="font-bold text-sm text-sky-950">Nous vérifions votre paiement.</p>
              <p className="mt-0.5 text-sky-800">
                La confirmation de votre transaction auprès de la passerelle est en cours. Cette page s'actualise automatiquement dès réception du signal.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3.5 py-2 rounded-xl bg-white border border-sky-300 hover:bg-sky-100 text-sky-900 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-700 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Actualiser le statut</span>
          </button>
        </div>
      )}

      {/* 5.4 Review Required Banner */}
      {isReviewRequired && (
        <div className="p-5 rounded-3xl bg-orange-50 border-2 border-orange-300 text-xs text-orange-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print shadow-xs">
          <div className="flex items-start gap-3.5">
            <AlertCircle className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-orange-950">
                Votre paiement nécessite une vérification. Veuillez contacter notre service client.
              </p>
              <p className="mt-0.5 text-orange-800 leading-relaxed">
                Une transaction a été enregistrée avec un montant ou une référence nécessitant une confirmation manuelle par notre équipe comptable avant validation.
              </p>
            </div>
          </div>
          <a
            href={`https://wa.me/221773817191?text=Bonjour%20Naja%20Store,%20je%20vous%20contacte%20concernant%20la%20vérification%20du%20paiement%20de%20ma%20commande%20${order.orderNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Service Client WhatsApp</span>
          </a>
        </div>
      )}

      {/* 5.5 Failed / Cancelled Banner */}
      {isFailed && (
        <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print shadow-xs">
          <div className="flex items-start gap-3.5">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-rose-950">Le paiement n'a pas pu être finalisé.</p>
              <p className="mt-0.5 text-rose-800">
                La tentative a été interrompue ou refusée. Votre commande <strong>#{order.orderNumber}</strong> reste conservée et vous pouvez retenter sans recréer de panier.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleScrollToPayment}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shrink-0 transition-colors shadow-xs"
          >
            Réessayer le paiement
          </button>
        </div>
      )}

      {paymentError && !isFailed && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-start gap-3 no-print">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Information de paiement</p>
            <p>{paymentError}</p>
          </div>
        </div>
      )}

      {codConfirmed && (
        <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start sm:items-center gap-3.5 no-print">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm text-emerald-950">Option Paiement à la Livraison confirmée !</p>
            <p className="mt-0.5 text-emerald-800">
              Votre commande <strong>{order.orderNumber}</strong> est en cours de traitement par notre atelier. Vous règlerez le montant de <strong>{formatCFA(remainingBalance > 0 ? remainingBalance : orderTotal)}</strong> en espèces ou par Wave auprès du livreur lors de la livraison.
            </p>
          </div>
        </div>
      )}

      {/* Luxury Printable Invoice Document */}
      <div className="bg-white rounded-3xl border border-[#F2E5E2] shadow-sm overflow-hidden p-6 sm:p-10 space-y-8 text-[#2C1E21] print:shadow-none print:border-none print:p-0">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-[#F4E2E0] pb-6 sm:pb-8">
          <div className="space-y-2">
            <BrandLogo size="md" />
            <p className="text-[10px] tracking-widest font-bold uppercase text-[#8B3A4A] pt-1">
              Élégance Style Garanties • Prêt-à-porter féminin de luxe
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
              FACTURE COMMERCIALE
            </span>
            <p className="text-lg sm:text-2xl font-mono font-black text-[#2C1E21]">{invoiceNumber}</p>
            <div className="text-xs text-[#7A6469] flex sm:justify-end items-center gap-1.5 pt-1">
              <Calendar className="w-3.5 h-3.5 text-[#8B3A4A]" />
              <span>Date d'émission : {formatDate(order.createdAt)}</span>
            </div>
            <p className="text-xs text-[#7A6469] font-mono">
              Réf. Commande : <strong>{order.orderNumber}</strong>
            </p>
          </div>
        </div>

        {/* Customer & Destination 2-Column Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Customer Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF5F4] border border-[#F4E2E0] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B3A4A] flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Client Facturé
            </span>
            <p className="font-bold text-sm text-[#2C1E21]">
              {order.customer?.firstName} {order.customer?.lastName}
            </p>
            <div className="space-y-1 text-xs text-[#644D52]">
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#8B3A4A]" />
                <span>{order.phone || order.customer?.phone}</span>
              </p>
              {(order.email || order.customer?.email) && (
                <p>Email : {order.email || order.customer?.email}</p>
              )}
            </div>
          </div>

          {/* Destination Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF5F4] border border-[#F4E2E0] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B3A4A] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Destination de Livraison
            </span>
            <p className="font-bold text-sm text-[#2C1E21]">
              Zone : {order.deliveryZone?.name || 'Dakar'}
            </p>
            <p className="text-xs text-[#644D52] leading-relaxed">
              Adresse : {order.deliveryAddress}
            </p>
            {order.notes && (
              <p className="text-[11px] text-[#8B3A4A] italic pt-0.5">
                Repères & Indications : {order.notes}
              </p>
            )}
          </div>
        </div>

        {/* Detailed Clothing Items Table */}
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-2xl border border-[#F2E5E2]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#242020] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Article / Vêtement</th>
                  <th className="py-3 px-3 text-center">Couleur</th>
                  <th className="py-3 px-3 text-center">Taille</th>
                  <th className="py-3 px-3 text-center">Qté</th>
                  <th className="py-3 px-3 text-right">Prix Unitaire</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2E5E2]">
                {order.items?.map((item: any, idx: number) => {
                  const imageUrl =
                    item.product?.images?.[0]?.url || item.imageUrl || null;
                  return (
                    <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF5F4]'}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.productName}
                              className="w-10 h-12 rounded-lg object-cover bg-slate-100 shrink-0 border border-[#F2E5E2]"
                            />
                          ) : (
                            <div className="w-10 h-12 rounded-lg bg-[#FAF2F0] text-[#8B3A4A] flex items-center justify-center shrink-0 border border-[#F4E2E0]">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-[#2C1E21] leading-snug">{item.productName}</p>
                            {item.variant?.sku && (
                              <p className="text-[10px] text-[#77706D] font-mono">
                                Réf : {item.variant.sku}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center text-[#644D52]">
                        {item.colorName ? <span className="font-medium">{item.colorName}</span> : '-'}
                      </td>
                      <td className="py-3.5 px-3 text-center text-[#644D52]">
                        {item.sizeName ? <span className="font-bold">{item.sizeName}</span> : '-'}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-[#2C1E21]">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-[#644D52]">
                        {formatCFA(item.unitPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#2C1E21] font-mono">
                        {formatCFA(item.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Breakdown & Statuses */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-2">
          {/* Status and Method Breakdown (Left) */}
          <div className="md:col-span-6 p-5 rounded-2xl bg-[#FFF9F8] border border-[#F5DCD8] space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B3A4A] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Statuts & Règlement
            </span>
            <div className="space-y-1.5 text-xs text-[#644D52]">
              <div className="flex justify-between items-center">
                <span>Statut de la commande :</span>
                <span className="font-bold text-[#2C1E21] px-2.5 py-0.5 rounded-full bg-[#FAF5F4] border border-[#F4E2E0]">
                  {order.status === 'NEW' ? 'En attente' : order.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Statut du paiement :</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800'
                      : isPartiallyPaid
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : isReviewRequired
                      ? 'bg-orange-100 text-orange-900 border border-orange-300'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isPaid
                    ? 'Payé avec succès'
                    : isPartiallyPaid
                    ? 'Partiellement payé'
                    : isReviewRequired
                    ? 'Vérification requise'
                    : 'Non payé / En attente'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span>Mode retenu :</span>
                <span className="font-bold text-[#2C1E21]">
                  {order.paymentMethod === 'PAYTECH'
                    ? 'Carte Bancaire (Visa / Mastercard)'
                    : order.paymentMethod === 'WAVE'
                    ? 'Wave Sénégal'
                    : order.paymentMethod === 'ORANGE_MONEY'
                    ? 'Orange Money'
                    : 'Paiement à la livraison'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 border-t border-[#F5DCD8]">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Garantie d'authenticité et de conformité Naja Rose Store</span>
            </div>
          </div>

          {/* Totals Summary with Balances (Right) */}
          <div className="md:col-span-6 space-y-2 bg-[#FAF5F4] p-5 rounded-2xl border border-[#F4E2E0] text-xs">
            <div className="flex justify-between items-center text-[#644D52]">
              <span>Sous-total articles :</span>
              <span className="font-bold text-[#2C1E21] font-mono">{formatCFA(order.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-[#644D52]">
              <span>Frais de livraison ({order.deliveryZone?.name || 'Dakar'}) :</span>
              <span className="font-bold text-[#2C1E21] font-mono">
                {order.deliveryFee > 0 ? `+ ${formatCFA(order.deliveryFee)}` : 'Gratuit'}
              </span>
            </div>
            <div className="pt-2 border-t border-[#E8CFCF] flex justify-between items-baseline">
              <div>
                <span className="font-bold text-xs text-[#2C1E21] block">TOTAL DE LA FACTURE :</span>
                <span className="text-[10px] text-[#7A6469]">Toutes taxes et frais inclus</span>
              </div>
              <span className="font-black text-xl text-[#2C1E21] font-mono">
                {formatCFA(orderTotal)}
              </span>
            </div>

            {/* Confirmed Paid & Remaining Balance Rows */}
            {amountPaid > 0 && (
              <div className="pt-2 border-t border-dashed border-[#E8CFCF] space-y-1.5">
                <div className="flex justify-between items-center text-emerald-800 font-medium">
                  <span>Paiements reçus et confirmés :</span>
                  <span className="font-bold font-mono text-xs">- {formatCFA(amountPaid)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <div>
                    <span className="font-bold text-sm text-[#8B3A4A] block">SOLDE RESTANT À PAYER :</span>
                  </div>
                  <span className="font-black text-2xl text-[#8B3A4A] font-serif">
                    {formatCFA(remainingBalance)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transaction History Section if available */}
        {order.payments && order.payments.length > 0 && (
          <div className="pt-4 border-t border-[#F2E5E2] space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#8B3A4A]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C1E21]">
                Historique des Transactions de Règlement
              </h4>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[#F2E5E2]">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#FAF5F4] text-[#7A6469] uppercase text-[9px] tracking-wider border-b border-[#F2E5E2]">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3">Référence / Token</th>
                    <th className="py-2.5 px-3 text-center">Statut</th>
                    <th className="py-2.5 px-3 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2E5E2]">
                  {order.payments.map((p: any, idx: number) => {
                    const isConfirmed = p.status === 'PAID';
                    return (
                      <tr key={p.id || idx} className="hover:bg-[#FAF9F7]/60">
                        <td className="py-2.5 px-3 text-[#7A6469] whitespace-nowrap">
                          {formatDate(p.createdAt)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#2C1E21]">
                          {p.provider === 'PAYTECH'
                            ? 'Carte Bancaire'
                            : p.provider === 'WAVE'
                            ? 'Wave Sénégal'
                            : p.provider === 'ORANGE_MONEY'
                            ? 'Orange Money'
                            : 'À la livraison'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-[#7A6469]">
                          {p.transactionId ? String(p.transactionId).slice(0, 24) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              isConfirmed
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'REVIEW_REQUIRED'
                                ? 'bg-orange-100 text-orange-900 border border-orange-300'
                                : p.status === 'CANCELLED' || p.status === 'FAILED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2C1E21]">
                          {formatCFA(p.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Legal Mention */}
        <div className="pt-4 border-t border-[#F2E5E2] text-center space-y-1 text-[11px] text-[#77706D]">
          <p className="font-semibold text-[#2C1E21]">
            Facture émise automatiquement par NAJA ROSE STORE • Dakar, Sénégal
          </p>
          <p>
            Pour toute question concernant cette facture, écrivez à <strong>contact@najarosestore.sn</strong> ou sur WhatsApp au <strong>+221 77 381 71 91</strong>
          </p>
        </div>
      </div>

      {/* Interactive Payment Choice Section for remaining balance */}
      {!isPaid && !codConfirmed && !isReviewRequired && (
        <div id="payment-section" className="bg-white rounded-3xl border-2 border-[#8B3A4A]/30 p-6 sm:p-8 space-y-6 shadow-md no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F4E2E0] pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B3A4A] block">
                {isPartiallyPaid ? 'Compléter le Règlement' : 'Étape Suivante'}
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2C1E21]">
                {isPartiallyPaid ? 'Régler le Solde Restant' : 'Choisir mon Mode de Paiement Sécurisé'}
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-[#7A6469] block">
                {isPartiallyPaid ? 'Solde restant à régler :' : 'Total à régler :'}
              </span>
              <span className="text-xl font-bold font-serif text-[#8B3A4A]">
                {formatCFA(remainingBalance > 0 ? remainingBalance : orderTotal)}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#7A6469]">
            Sélectionnez votre moyen de paiement sécurisé pour finaliser votre commande. Votre facture officielle reste accessible et téléchargeable à tout moment.
          </p>

          {/* Payment Method Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Wave Direct */}
            <label
              onClick={() => setSelectedMethod('WAVE')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                selectedMethod === 'WAVE'
                  ? 'border-[#8B3A4A] bg-[#FAF2F0] shadow-sm ring-1 ring-[#8B3A4A]/20'
                  : 'border-[#F2E5E2] hover:border-[#D8A7A7] bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="/images/payments/wave-logo.jpg"
                    alt="Logo Wave"
                    className="w-11 h-11 rounded-2xl object-cover shadow-xs shrink-0 border border-[#E0F2FE]"
                  />
                  <div>
                    <p className="font-bold text-sm text-[#2C1E21]">Wave Sénégal</p>
                    <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                      Paiement Mobile Direct
                    </span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={selectedMethod === 'WAVE'}
                  onChange={() => setSelectedMethod('WAVE')}
                  className="mt-1 text-[#8B3A4A] focus:ring-[#8B3A4A]"
                />
              </div>
              <p className="text-[11px] text-[#7A6469] leading-relaxed">
                Validation directe et instantanée avec votre application Wave.
              </p>
            </label>

            {/* 2. Orange Money Direct */}
            <label
              onClick={() => setSelectedMethod('ORANGE_MONEY')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                selectedMethod === 'ORANGE_MONEY'
                  ? 'border-[#8B3A4A] bg-[#FAF2F0] shadow-sm ring-1 ring-[#8B3A4A]/20'
                  : 'border-[#F2E5E2] hover:border-[#D8A7A7] bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center p-1 shadow-xs shrink-0 border border-[#FED7AA]">
                    <img
                      src="/images/payments/orange-money-logo.jpg"
                      alt="Logo Orange Money"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#2C1E21]">Orange Money</p>
                    <span className="text-[10px] font-semibold text-orange-800 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                      WebPay Sénégal
                    </span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={selectedMethod === 'ORANGE_MONEY'}
                  onChange={() => setSelectedMethod('ORANGE_MONEY')}
                  className="mt-1 text-[#8B3A4A] focus:ring-[#8B3A4A]"
                />
              </div>
              <p className="text-[11px] text-[#7A6469] leading-relaxed">
                Validation directe et 100% sécurisée via l'application officielle <strong>Orange Max it</strong>.
              </p>
            </label>

            {/* 3. Carte Bancaire (Visa / Mastercard) */}
            <label
              onClick={() => setSelectedMethod('PAYTECH')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 md:col-span-2 ${
                selectedMethod === 'PAYTECH'
                  ? 'border-[#8B3A4A] bg-[#FAF2F0] shadow-sm ring-1 ring-[#8B3A4A]/20'
                  : 'border-[#F2E5E2] hover:border-[#D8A7A7] bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#8B3A4A] text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-base text-[#2C1E21]">
                        Carte Bancaire (Visa / Mastercard)
                      </p>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        🔒 3D-Secure Sécurisé
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                      <div className="flex items-center gap-1 bg-[#1A1F71] text-white font-bold text-[11px] px-2.5 py-0.5 rounded tracking-wider shadow-2xs">
                        VISA
                      </div>
                      <div className="flex items-center gap-1 bg-[#EB001B] text-white font-bold text-[11px] px-2.5 py-0.5 rounded tracking-wider shadow-2xs">
                        Mastercard
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        Cartes Internationales & Locales
                      </span>
                    </div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={selectedMethod === 'PAYTECH'}
                  onChange={() => setSelectedMethod('PAYTECH')}
                  className="mt-1 text-[#8B3A4A] focus:ring-[#8B3A4A]"
                />
              </div>
              <p className="text-[11px] text-[#7A6469] leading-relaxed pt-1">
                Paiement en ligne instantané et 100% sécurisé par carte bancaire Visa, Mastercard ou carte prépayée avec protection 3D Secure.
              </p>
            </label>

            {/* 4. Cash on Delivery (only on initial unpaid state) */}
            {!isPartiallyPaid && (
              <label
                onClick={() => setSelectedMethod('CASH_ON_DELIVERY')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 md:col-span-2 ${
                  selectedMethod === 'CASH_ON_DELIVERY'
                    ? 'border-[#8B3A4A] bg-[#FAF2F0] shadow-sm ring-1 ring-[#8B3A4A]/20'
                    : 'border-[#F2E5E2] hover:border-[#D8A7A7] bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                      💵
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#2C1E21]">Paiement à la Livraison</p>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Espèces ou Wave auprès du coursier
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === 'CASH_ON_DELIVERY'}
                    onChange={() => setSelectedMethod('CASH_ON_DELIVERY')}
                    className="mt-1 text-[#8B3A4A] focus:ring-[#8B3A4A]"
                  />
                </div>
                <p className="text-[11px] text-[#7A6469] leading-relaxed">
                  Réglez en main propre à la réception de votre colis par notre coursier à Dakar (en espèces ou par Wave).
                </p>
              </label>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#F4E2E0]">
            <Link
              to="/cart"
              className="text-xs font-semibold text-[#7A6469] hover:text-[#2C1E21] flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Modifier ma commande</span>
            </Link>

            <Button
              variant="gold"
              size="lg"
              disabled={initiatePaymentMutation.isPending}
              onClick={() => initiatePaymentMutation.mutate(selectedMethod)}
              className="w-full sm:w-auto px-8 py-4 text-sm font-bold shadow-md hover:shadow-lg transition-all"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {initiatePaymentMutation.isPending ? (
                <span>Connexion sécurisée en cours...</span>
              ) : selectedMethod === 'PAYTECH' ? (
                <span>Payer par Carte Visa / Mastercard ({formatCFA(remainingBalance > 0 ? remainingBalance : orderTotal)})</span>
              ) : selectedMethod === 'WAVE' ? (
                <span>Payer avec Wave ({formatCFA(remainingBalance > 0 ? remainingBalance : orderTotal)})</span>
              ) : selectedMethod === 'ORANGE_MONEY' ? (
                <span>Payer avec Orange Money ({formatCFA(remainingBalance > 0 ? remainingBalance : orderTotal)})</span>
              ) : (
                <span>Confirmer le Paiement à la Livraison ({formatCFA(remainingBalance > 0 ? remainingBalance : orderTotal)})</span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Post-Payment or COD Status Confirmation Banner */}
      {(isPaid || codConfirmed) && (
        <div className="bg-[#FAF5F4] rounded-3xl border border-[#F4E2E0] p-6 text-center space-y-4 no-print">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-lg text-[#2C1E21]">
              {isPaid ? 'Paiement Confirmé avec Succès !' : 'Commande Enregistrée avec Succès !'}
            </h3>
            <p className="text-xs text-[#7A6469] max-w-lg mx-auto">
              Votre commande <strong>{order.orderNumber}</strong> est validée. Vous pouvez télécharger votre facture PDF et suivre l'acheminement de votre colis.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="gold"
              size="sm"
              disabled={isDownloadingPdf}
              onClick={handleDownloadPdf}
              leftIcon={isDownloadingPdf ? <Spinner size="sm" /> : <Download className="w-3.5 h-3.5" />}
            >
              {isDownloadingPdf ? 'Téléchargement...' : 'Télécharger ma Facture PDF'}
            </Button>
            <Link to={`/orders/${order.orderNumber}`}>
              <Button variant="outline" size="sm" leftIcon={<Clock className="w-3.5 h-3.5" />}>
                Suivre ma Livraison
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
