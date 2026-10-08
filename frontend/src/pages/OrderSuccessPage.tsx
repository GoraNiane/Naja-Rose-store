import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { formatCFA, formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';
import { APP_CONFIG } from '../lib/constants';

export function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || '';

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-success', orderNumber],
    queryFn: () => orderService.getOrderByNumber(orderNumber),
    enabled: !!orderNumber,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center space-y-8">
      <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
          Jërëjëf ! Merci pour votre confiance
        </span>
        <h1 className="text-3xl font-black font-display text-slate-900">
          Commande Validée avec Succès
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Votre commande a bien été enregistrée par notre atelier à Dakar. Nous préparons votre colis avec le plus grand soin.
        </p>
      </div>

      {isLoading ? (
        <Spinner size="md" />
      ) : order ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 text-left shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
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
          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>{formatCFA(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Frais de livraison ({order.deliveryZone?.name || 'Dakar'})</span>
              <span>{formatCFA(order.deliveryFee)}</span>
            </div>
            <div className="pt-2 flex justify-between font-bold text-base text-slate-950">
              <span>Total Réglé</span>
              <span className="font-display font-black text-amber-800">
                {formatCFA(order.total)}
              </span>
            </div>
          </div>

          {/* Delivery destination */}
          <div className="p-4 rounded-2xl bg-slate-50 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Adresse de livraison :</p>
            <p>
              {order.customer?.firstName} {order.customer?.lastName} • {order.phone}
            </p>
            <p>{order.deliveryAddress}</p>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-amber-50 rounded-2xl text-xs text-amber-800">
          Votre référence de commande est : <strong>{orderNumber || 'Enregistrée'}</strong>. Un SMS / Email de confirmation vous a été adressé.
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-4 justify-center items-center pt-4">
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
