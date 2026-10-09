import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { formatCFA, formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Check,
  XCircle,
  FileText,
  ArrowLeft,
  AlertTriangle,
  Phone,
  MapPin,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { APP_CONFIG } from '../lib/constants';

const ORDER_STEPS = [
  { key: 'NEW', label: 'Commande reçue', desc: 'Enregistrée par notre système', icon: Clock },
  { key: 'CONFIRMED', label: 'Confirmée', desc: 'Validée par l’atelier', icon: CheckCircle2 },
  { key: 'PREPARING', label: 'En préparation', desc: 'Confection & emballage soigné', icon: Package },
  { key: 'SHIPPED', label: 'En livraison', desc: 'Prise en charge par le coursier', icon: Truck },
  { key: 'DELIVERED', label: 'Livrée', desc: 'Remise en main propre', icon: Check },
];

function getStepIndex(status: string): number {
  switch (status) {
    case 'NEW':
      return 0;
    case 'CONFIRMED':
      return 1;
    case 'PREPARING':
      return 2;
    case 'SHIPPED':
      return 3;
    case 'DELIVERED':
      return 4;
    default:
      return 0;
  }
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        if (id.startsWith('CMD-')) {
          return await orderService.getOrderByNumber(id);
        }
        return await orderService.getOrderById(id);
      } catch {
        return await orderService.getOrderByNumber(id);
      }
    },
    enabled: !!id,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/orders/${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;
    const invoiceUrl = orderService.getInvoiceUrl(order.orderNumber || order.id);
    window.open(invoiceUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black font-display text-slate-900">Commande Introuvable</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Aucune commande ne correspond à la référence <strong>« {id} »</strong>.
          </p>
        </div>

        {/* Search by reference */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-sm mx-auto">
          <input
            type="text"
            placeholder="Ex: CMD-2026-000001"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
          />
          <Button variant="gold" size="sm" type="submit">
            Rechercher
          </Button>
        </form>

        <div className="pt-4">
          <Link to="/shop">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Retourner à la boutique
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/shop"
              className="p-1 text-slate-400 hover:text-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
                Suivi de Commande Naja Dakar
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900">
                Commande N° {order.orderNumber}
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-7">
            Passée le {formatDate(order.createdAt)} • Facture : {order.invoice?.invoiceNumber || 'Générée'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadInvoice}
            leftIcon={<FileText className="w-4 h-4 text-amber-700" />}
          >
            Télécharger Facture PDF
          </Button>
          <a
            href={`https://wa.me/${APP_CONFIG.whatsapp.replace(/\+/g, '')}?text=Bonjour%20Naja%20Store,%20je%20souhaite%20des%20informations%20sur%20ma%20commande%20${order.orderNumber}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="gold" size="sm" leftIcon={<Phone className="w-4 h-4" />}>
              Support WhatsApp
            </Button>
          </a>
        </div>
      </div>

      {/* Cash on Delivery Notice Banner */}
      {order.paymentMethod === 'CASH_ON_DELIVERY' && order.paymentStatus !== 'PAID' && !isCancelled && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border border-amber-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-sm">
              💵
            </div>
            <div>
              <h2 className="font-display font-black text-amber-950 text-base sm:text-lg">
                À Payer à la Livraison : {formatCFA(order.total)}
              </h2>
              <p className="text-xs text-amber-900/90 mt-0.5">
                Veuillez préparer le montant exact ou votre application Wave/Orange Money lors du passage du livreur.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-amber-200 text-amber-900 uppercase tracking-wider self-start sm:self-auto">
            Règlement coursier
          </span>
        </div>
      )}

      {/* Timeline Tracking Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <h2 className="text-base font-bold font-display text-slate-900 flex items-center justify-between">
          <span>Progression de la Commande</span>
          {isCancelled ? (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800">
              Commande Annulée
            </span>
          ) : (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
              Statut : {order.status}
            </span>
          )}
        </h2>

        {isCancelled ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>
              Cette commande a été annulée. Les articles ont été réintégrés dans l'inventaire et aucun prélèvement n'a été effectué.
            </span>
          </div>
        ) : (
          <div className="pt-4 pb-2">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
              {ORDER_STEPS.map((step, idx) => {
                const IconComponent = step.icon;
                const isDone = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div
                    key={step.key}
                    className={`relative flex flex-row md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-3 ${
                      isDone ? 'opacity-100' : 'opacity-40'
                    }`}
                  >
                    {/* Circle badge */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 shadow-sm ${
                        isCurrent
                          ? 'bg-amber-600 text-white ring-4 ring-amber-500/20 shadow-lg scale-105'
                          : isDone
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <p
                        className={`text-xs font-bold ${
                          isCurrent ? 'text-amber-800' : isDone ? 'text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-tight">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Order Items & Delivery Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Items */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
            <div className="p-5 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Articles commandés ({order.items?.length || 0})
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                Total articles : {formatCFA(order.subtotal)}
              </span>
            </div>

            {order.items?.map((item: any) => (
              <div key={item.id} className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {item.product?.images?.[0]?.url ? (
                    <img
                      src={item.product.images[0].url}
                      alt={item.productName}
                      className="w-16 h-20 rounded-xl object-cover bg-slate-100 border border-slate-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-20 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-sm text-slate-900">
                      {item.productName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {item.colorName && <span>Couleur : <strong>{item.colorName}</strong></span>}
                      {item.sizeName && <span>• Taille : <strong>{item.sizeName}</strong></span>}
                      <span>• Qté : <strong>{item.quantity}</strong></span>
                    </div>
                    <p className="font-mono text-xs font-bold text-amber-800">
                      {formatCFA(item.unitPrice)} / unité
                    </p>
                  </div>
                </div>

                <span className="font-display font-black text-base text-slate-950">
                  {formatCFA(item.total)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Financial Breakdown & Delivery Details */}
        <div className="lg:col-span-5 space-y-6">
          {/* Totals Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
              Décompte de Facturation
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Sous-total articles</span>
                <span className="font-semibold text-slate-900 font-mono">{formatCFA(order.subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  Livraison ({order.deliveryZone?.name || 'Dakar'})
                </span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatCFA(order.deliveryFee)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="font-black text-sm text-slate-900">Total Général TTC</span>
                <span className="font-black text-xl font-display text-slate-950">
                  {formatCFA(order.total)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Moyen de règlement :</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                {order.paymentMethod === 'WAVE' ? (
                  <>
                    <img
                      src="/images/payments/wave-logo.jpg"
                      alt="Wave"
                      className="w-4 h-4 rounded-full object-cover shadow-2xs"
                    />
                    <span>Wave Sénégal</span>
                  </>
                ) : order.paymentMethod === 'ORANGE_MONEY' ? (
                  <>
                    <img
                      src="/images/payments/orange-money-logo.jpg"
                      alt="Orange Money"
                      className="w-4 h-4 rounded object-contain shadow-2xs"
                    />
                    <span>Orange Money</span>
                  </>
                ) : order.paymentMethod === 'PAYTECH' ? (
                  <>
                    <span className="text-xs">💳</span>
                    <span>PayTech Sénégal</span>
                  </>
                ) : (
                  <span>💵 Paiement à la livraison</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Statut du paiement :</span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                  order.paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {order.paymentStatus === 'PAID' ? 'Payé' : 'En attente'}
              </span>
            </div>
          </div>

          {/* Delivery destination card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              Coordonnées de Livraison
            </h3>

            <div className="text-xs text-slate-600 space-y-1.5">
              <p className="font-bold text-slate-900">
                {order.customer?.firstName} {order.customer?.lastName}
              </p>
              <p className="flex items-center gap-1.5 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {order.phone}
              </p>
              <p className="text-slate-700">
                <strong>Zone :</strong> {order.deliveryZone?.name || 'Dakar'}
              </p>
              <p className="text-slate-700">
                <strong>Adresse :</strong> {order.deliveryAddress}
              </p>
              {order.notes && (
                <p className="p-2.5 rounded-xl bg-amber-50 text-amber-900 text-[11px] border border-amber-200/60 mt-2">
                  <strong>Indication :</strong> {order.notes}
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400 border-t border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Colis assuré par la logistique Naja Store</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
