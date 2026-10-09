import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { formatCFA } from '../lib/utils';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PAYMENT_METHODS } from '../lib/constants';

export function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCartStore();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-[#FAF0EE] text-[#8B3A4A] flex items-center justify-center mx-auto shadow-2xs">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div>
          <h1
            className="text-2xl sm:text-3xl font-serif italic text-[#2C1E21]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Votre Panier est Actuellement Vide
          </h1>
          <p className="text-xs sm:text-sm text-[#644D52] max-w-md mx-auto mt-2">
            Laissez-vous séduire par nos dernières créations, ensembles 3 pièces, robes et tops confectionnés avec soin à Dakar.
          </p>
        </div>
        <Link to="/shop">
          <button className="bg-[#8B3A4A] hover:bg-[#722E3C] text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-full shadow-md transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer">
            <ShoppingBag className="w-4 h-4" />
            <span>Explorer la Boutique</span>
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F4E2E0] pb-5">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-serif italic text-[#2C1E21]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Mon Panier ({items.length} article{items.length > 1 ? 's' : ''})
          </h1>
          <p className="text-xs text-[#644D52] mt-1">
            Vérifiez vos articles avant de procéder au paiement sécurisé Wave ou Orange Money
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-[#8B3A4A] font-bold hover:underline flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Vider le panier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Column: Items list */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-[#F2E5E2] shadow-2xs divide-y divide-[#FAF0EE] overflow-hidden">
            {items.map((item) => (
              <div
                key={item.variantId}
                className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 hover:bg-[#FAF9F8] transition-colors"
              >
                {/* Thumbnail */}
                <Link
                  to={`/product/${item.productSlug}`}
                  className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden bg-[#FAF0EE] flex-shrink-0 border border-[#F2E5E2] shadow-2xs block"
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
                    className="font-serif italic font-bold text-sm sm:text-base text-[#2C1E21] hover:text-[#8B3A4A] transition-colors line-clamp-1"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {item.productName}
                  </Link>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#644D52]">
                    {item.colorName && (
                      <span className="font-medium text-[#2C1E21]">
                        Couleur : {item.colorName}
                      </span>
                    )}
                    {item.sizeName && (
                      <span>• Taille : <strong className="text-[#2C1E21]">{item.sizeName}</strong></span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-[#8B3A4A] pt-0.5">
                    {formatCFA(item.price)}
                  </p>
                </div>

                {/* Quantity Controls & Line total */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#FAF0EE]">
                  <div className="flex items-center border border-[#F2E5E2] rounded-xl bg-white shadow-2xs">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="p-2 text-[#644D52] hover:text-[#2C1E21] cursor-pointer"
                      title="Diminuer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-[#2C1E21]">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="p-2 text-[#644D52] hover:text-[#2C1E21] disabled:opacity-30 cursor-pointer"
                      title="Augmenter"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm sm:text-base text-[#1A1816]">
                      {formatCFA(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="p-1.5 text-[#A0888E] hover:text-[#8B3A4A] rounded-lg hover:bg-[#FAF0EE] transition-colors cursor-pointer"
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
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#644D52] hover:text-[#8B3A4A] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continuer mes achats</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout CTA */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 sm:p-7 rounded-3xl border border-[#F2E5E2] shadow-sm space-y-5 sticky top-28">
            <h2
              className="font-serif italic font-bold text-lg text-[#2C1E21] border-b border-[#FAF0EE] pb-3"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Récapitulatif
            </h2>

            <div className="space-y-3 text-xs text-[#644D52]">
              <div className="flex justify-between">
                <span>Sous-total articles</span>
                <span className="font-semibold text-[#2C1E21]">{formatCFA(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-[#644D52]">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#8B3A4A]" />
                  Livraison Dakar & Régions
                </span>
                <span className="font-semibold text-[#2C1E21]">Calculés à l'étape suivante</span>
              </div>

              <div className="p-3 bg-[#FAF0EE] rounded-2xl text-[11px] text-[#54202B] border border-[#F2E5E2] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8B3A4A] shrink-0" />
                <span>
                  <strong>Livraison Express 24h</strong> partout à Dakar (Plateau, Almadies, Mermoz, Maristes, etc.)
                </span>
              </div>

              <div className="pt-3 border-t border-[#FAF0EE] flex justify-between items-baseline">
                <span className="font-bold text-base text-[#2C1E21]">Total estimé</span>
                <span className="font-bold text-xl sm:text-2xl text-[#1A1816]">
                  {formatCFA(subtotal)}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-[#8B3A4A] hover:bg-[#722E3C] text-white font-bold text-xs sm:text-sm py-3.5 px-5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              <span>Passer la Commande</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Accepted Payments in Senegal */}
            <div className="pt-3 border-t border-[#FAF0EE] space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A0888E] block text-center">
                Paiements Sécurisés au Sénégal
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                {PAYMENT_METHODS.map((pm) => (
                  <div
                    key={pm.id}
                    className="p-2 rounded-xl bg-[#FAF9F8] border border-[#F2E5E2] flex flex-col items-center justify-center text-center"
                  >
                    <span className="text-base">{pm.icon}</span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-[#382B2F] mt-1 leading-tight">
                      {pm.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-[#644D52] text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Garantie d'authenticité et satisfaction</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
