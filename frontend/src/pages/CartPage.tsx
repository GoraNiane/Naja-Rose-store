import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { formatCFA } from '../lib/utils';
import { Button } from '../components/ui/Button';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { PAYMENT_METHODS } from '../lib/constants';

export function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCartStore();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900">
            Votre Panier est Actuellement Vide
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2">
            Laissez-vous séduire par nos dernières créations en Bazin riche, prêt-à-porter wax et accessoires confectionnés à Dakar.
          </p>
        </div>
        <Link to="/shop">
          <Button variant="gold" size="lg" leftIcon={<ShoppingBag className="w-4 h-4" />}>
            Explorer la Boutique
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-3xl font-black font-display text-slate-900">
            Mon Panier ({items.length} article{items.length > 1 ? 's' : ''})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Vérifiez vos articles avant de procéder au paiement sécurisé Wave ou Orange Money
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Vider le panier
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Items list */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {items.map((item) => (
              <div
                key={item.variantId}
                className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:bg-slate-50/50 transition-colors"
              >
                {/* Thumbnail */}
                <Link
                  to={`/product/${item.productSlug}`}
                  className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100 shadow-xs block"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <Link
                    to={`/product/${item.productSlug}`}
                    className="font-display font-bold text-sm sm:text-base text-slate-900 hover:text-amber-700 transition-colors line-clamp-1"
                  >
                    {item.productName}
                  </Link>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {item.colorName && (
                      <span className="font-medium text-slate-700">
                        Couleur : {item.colorName}
                      </span>
                    )}
                    {item.sizeName && (
                      <span>• Taille : <strong className="text-slate-800">{item.sizeName}</strong></span>
                    )}
                  </div>

                  <p className="font-mono text-xs font-bold text-amber-800 pt-1">
                    Prix unitaire : {formatCFA(item.price)}
                  </p>
                </div>

                {/* Quantity Controls & Line total */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="p-2 text-slate-500 hover:text-slate-900"
                      title="Diminuer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="p-2 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                      title="Augmenter"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-base text-slate-950">
                      {formatCFA(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Supprimer l'article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-amber-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Continuer mes achats
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout CTA */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 sticky top-28">
            <h2 className="font-display font-bold text-lg text-slate-900 border-b border-slate-100 pb-4">
              Total de votre Commande
            </h2>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Sous-total articles</span>
                <span className="font-semibold text-slate-800">{formatCFA(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  Frais de livraison
                </span>
                <span className="font-semibold text-slate-800">Calculés au checkout</span>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl text-[11px] text-amber-900 border border-amber-200/60">
                ✨ <strong>Livraison Express 24h</strong> disponible sur Dakar Plateau, Almadies, Mermoz, et Banlieue.
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="font-bold text-base text-slate-900">Total estimé</span>
                <span className="font-display font-black text-2xl text-slate-950">
                  {formatCFA(subtotal)}
                </span>
              </div>
            </div>

            <Button
              variant="gold"
              size="lg"
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/checkout')}
            >
              Passer la Commande
            </Button>

            {/* Accepted Payments in Senegal */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center">
                Moyens de Paiement Sécurisés
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                {PAYMENT_METHODS.map((pm) => (
                  <div
                    key={pm.id}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center"
                  >
                    <span className="text-base">{pm.icon}</span>
                    <span className="text-[10px] font-bold text-slate-700 mt-1 leading-tight">
                      {pm.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Garantie d'authenticité et protection acheteur</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
