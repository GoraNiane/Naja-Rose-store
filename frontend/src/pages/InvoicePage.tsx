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
      ? 'La tentative de paiement a été interrompue ou annulée sur PayTech. Vous pouvez réessayer ci-dessous ou choisir un autre mode de règlement.'
      : null
  );
  const [codConfirmed, setCodConfirmed] = useState(false);

  // Fetch Order and Invoice Data
  const {
    data: orderData,
    isLoading,
    isError,
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
        if (redirectUrl.includes(window.location.host) || redirectUrl.startsWith('/')) {
          const path = redirectUrl.replace(window.location.origin, '');
          navigate(path);
        } else {
          // Redirect to the official PayTech hosted secure payment checkout page
          window.location.href = redirectUrl;
        }
      } else {
        navigate(`/checkout/success?orderNumber=${order?.orderNumber}`);
      }
    },
    onError: (err: any) => {
      setPaymentError(
        err.message || 'Impossible de lancer la session PayTech. Veuillez réessayer ou contacter notre service client.'
      );
    },
  });

  const handleDownloadPdf = () => {
    if (!order) return;
    const pdfUrl = orderService.getInvoicePdfUrl(order.orderNumber || order.id);
    window.open(pdfUrl, '_blank');
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

  const isPaid = order.paymentStatus === 'PAID';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Banner & Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#FAF2F0] p-4 sm:p-6 rounded-3xl border border-[#F4E2E0] no-print shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#8B3A4A] text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[#2C1E21] font-serif">
                Facture Officielle Naja Rose
              </h1>
              <span
                className={`text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full ${
                  isPaid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-[#8B3A4A] text-white'
                }`}
              >
                {isPaid ? 'Payée' : 'En attente de paiement'}
              </span>
            </div>
            <p className="text-xs text-[#7A6469] mt-0.5">
              Consultez et téléchargez votre facture avant de choisir votre moyen de paiement sécurisé.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 flex-wrap sm:flex-nowrap">
          {!isPaid && !codConfirmed && (
            <button
              type="button"
              onClick={handleScrollToPayment}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-[#242020] hover:bg-[#382B2F] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#D8A7A7]" />
              <span>Choisir le paiement</span>
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
            onClick={handleDownloadPdf}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-[#8B3A4A] hover:bg-[#722E3C] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger PDF</span>
          </button>
        </div>
      </div>

      {paymentError && (
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
              Votre commande <strong>{order.orderNumber}</strong> est en cours de traitement par notre atelier. Vous règlerez le montant total de <strong>{formatCFA(order.total)}</strong> en espèces ou par Wave auprès du livreur lors de la livraison.
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
                  {order.status === 'NEW' ? 'En attente de paiement' : order.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Statut du paiement :</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isPaid ? 'Payé avec succès' : 'Non payé / En attente'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span>Mode retenu :</span>
                <span className="font-bold text-[#2C1E21]">
                  {order.paymentMethod === 'PAYTECH'
                    ? 'PayTech Sénégal (Wave, OM, Carte)'
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

          {/* Totals Summary (Right) */}
          <div className="md:col-span-6 space-y-2 bg-[#FAF5F4] p-5 rounded-2xl border border-[#F4E2E0] text-xs">
            <div className="flex justify-between items-center text-[#644D52]">
              <span>Sous-total vêtements :</span>
              <span className="font-bold text-[#2C1E21] font-mono">{formatCFA(order.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-[#644D52]">
              <span>Frais de livraison ({order.deliveryZone?.name || 'Dakar'}) :</span>
              <span className="font-bold text-[#2C1E21] font-mono">
                {order.deliveryFee > 0 ? `+ ${formatCFA(order.deliveryFee)}` : 'Gratuit'}
              </span>
            </div>
            <div className="pt-3 border-t border-[#E8CFCF] flex justify-between items-baseline">
              <div>
                <span className="font-bold text-sm text-[#2C1E21] block">MONTANT TOTAL À PAYER :</span>
                <span className="text-[10px] text-[#7A6469]">Toutes taxes et frais inclus</span>
              </div>
              <span className="font-black text-2xl text-[#8B3A4A] font-serif">
                {formatCFA(order.total)}
              </span>
            </div>
          </div>
        </div>

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

      {/* Interactive Payment Choice Section */}
      {!isPaid && !codConfirmed && (
        <div id="payment-section" className="bg-white rounded-3xl border-2 border-[#8B3A4A]/30 p-6 sm:p-8 space-y-6 shadow-md no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F4E2E0] pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B3A4A] block">
                Étape Suivante
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2C1E21]">
                Choisir mon Mode de Paiement Sécurisé
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-[#7A6469] block">Total à régler :</span>
              <span className="text-xl font-bold font-serif text-[#8B3A4A]">
                {formatCFA(order.total)}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#7A6469]">
            Sélectionnez votre moyen de paiement sécurisé pour finaliser votre commande. Votre facture officielle reste accessible et téléchargeable à tout moment.
          </p>

          {/* Payment Method Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. PayTech (Primary & Aggregator) */}
            <label
              onClick={() => setSelectedMethod('PAYTECH')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 md:col-span-2 ${
                selectedMethod === 'PAYTECH'
                  ? 'border-[#8B3A4A] bg-[#FAF2F0] shadow-sm ring-1 ring-[#8B3A4A]/20'
                  : 'border-[#F2E5E2] hover:border-[#D8A7A7] bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8B3A4A] text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                    💳
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-base text-[#2C1E21]">
                        Passerelle Officielle PayTech Sénégal
                      </p>
                      <span className="text-[10px] font-bold text-[#8B3A4A] bg-[#FAF2F0] border border-[#F4E2E0] px-2.5 py-0.5 rounded-full">
                        ✨ Recommandé (Multi-moyens)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                        🌊 Wave
                      </span>
                      <span className="text-[10px] font-semibold text-orange-800 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                        🍊 Orange Money
                      </span>
                      <span className="text-[10px] font-semibold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                        🟣 Free Money
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        💳 Carte Bancaire Visa / Mastercard
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
                Règlement immédiat et sécurisé via la page hébergée PayTech. Vous pourrez choisir librement Wave, Orange Money, Free Money ou Carte Bancaire avec confirmation automatique instantanée.
              </p>
            </label>

            {/* 2. Wave Direct */}
            <label
              onClick={() => setSelectedMethod('WAVE')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                selectedMethod === 'WAVE'
                  ? 'border-[#8B3A4A] bg-[#FAF2F0] shadow-sm'
                  : 'border-[#F2E5E2] hover:border-[#D8A7A7] bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                    🌊
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#2C1E21]">Wave Sénégal</p>
                    <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full">
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
                Validation directe via votre application Wave avec scan QR ou numéro de mobile.
              </p>
            </label>

            {/* 3. Cash on Delivery */}
            <label
              onClick={() => setSelectedMethod('CASH_ON_DELIVERY')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                selectedMethod === 'CASH_ON_DELIVERY'
                  ? 'border-[#8B3A4A] bg-[#FAF2F0] shadow-sm'
                  : 'border-[#F2E5E2] hover:border-[#D8A7A7] bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                    💵
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#2C1E21]">Paiement Livraison</p>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Espèces ou Wave au coursier
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
                Réglez en main propre lors de la réception de votre colis à Dakar.
              </p>
            </label>
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
                <span>Payer maintenant avec PayTech ({formatCFA(order.total)})</span>
              ) : selectedMethod === 'WAVE' ? (
                <span>Payer avec Wave ({formatCFA(order.total)})</span>
              ) : selectedMethod === 'ORANGE_MONEY' ? (
                <span>Payer avec Orange Money ({formatCFA(order.total)})</span>
              ) : (
                <span>Confirmer le Paiement à la Livraison ({formatCFA(order.total)})</span>
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
            <Button variant="gold" size="sm" onClick={handleDownloadPdf} leftIcon={<Download className="w-3.5 h-3.5" />}>
              Télécharger ma Facture PDF
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
