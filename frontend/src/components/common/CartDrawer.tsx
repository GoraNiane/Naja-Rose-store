import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { formatCFA } from '../../lib/utils';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, subtotal, updateQuantity, removeItem } = useCartStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              <h2 className="font-display font-bold text-lg text-slate-900">
                Mon Panier ({items.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-base">Votre panier est vide</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Découvrez nos créations exclusives en Bazin riche, robes wax et maroquinerie d'art.
                  </p>
                </div>
                <Button variant="gold" size="sm" onClick={onClose}>
                  Découvrir le catalogue
                </Button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-4 p-3 rounded-xl border border-slate-100 hover:border-amber-200 transition-colors bg-white"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-20 h-24 rounded-lg object-cover bg-slate-50 flex-shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 line-clamp-2">
                        {item.productName}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        {item.colorName && <span>Couleur : {item.colorName}</span>}
                        {item.sizeName && <span>• Taille : {item.sizeName}</span>}
                      </div>
                      <p className="text-xs font-bold text-amber-800 mt-1">
                        {formatCFA(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1 hover:bg-white rounded-l text-slate-600"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="p-1 hover:bg-white rounded-r text-slate-600"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Checkout CTA */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Sous-total</span>
                <span className="font-bold text-lg text-slate-900 font-display">
                  {formatCFA(subtotal)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Frais de livraison calculés à l'étape suivante selon votre commune.
              </p>
              <div className="space-y-2">
                <Button
                  variant="gold"
                  className="w-full"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={handleCheckout}
                >
                  Passer la commande
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/cart');
                  }}
                  className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-amber-800 transition-colors text-center block"
                >
                  Afficher le panier détaillé ({items.length})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
