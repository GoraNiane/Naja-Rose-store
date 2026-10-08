import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { useCartStore } from '../stores/cartStore';
import { formatCFA } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { ShoppingBag, Truck, ShieldCheck, ArrowLeft, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getProductBySlug(slug!),
    enabled: !!slug,
  });

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Modèle Introuvable</h2>
        <p className="text-xs text-slate-500">L'article recherché n'existe pas ou n'est plus en ligne.</p>
        <Link to="/shop">
          <Button variant="primary">Retourner à la boutique</Button>
        </Link>
      </div>
    );
  }

  // Extract unique colors & sizes available for this product
  const uniqueColors = Array.from(
    new Map(
      product.variants
        .filter((v) => v.color)
        .map((v) => [v.color!.id, v.color!])
    ).values()
  );

  const uniqueSizes = Array.from(
    new Map(
      product.variants
        .filter((v) => v.size)
        .map((v) => [v.size!.id, v.size!])
    ).values()
  );

  // Find exact matching variant
  const selectedVariant = product.variants.find(
    (v) =>
      (uniqueColors.length === 0 || v.colorId === selectedColorId) &&
      (uniqueSizes.length === 0 || v.sizeId === selectedSizeId)
  );

  const isColorMissing = uniqueColors.length > 0 && !selectedColorId;
  const isSizeMissing = uniqueSizes.length > 0 && !selectedSizeId;
  const isSelectionIncomplete = isColorMissing || isSizeMissing;

  const currentPrice = Number(selectedVariant?.price || product.price);
  const availableStock = selectedVariant ? selectedVariant.stock : 0;
  const isOutOfStock = Boolean(selectedVariant && availableStock <= 0);

  // Discount percentage
  const discountPercent =
    product.oldPrice && Number(product.oldPrice) > currentPrice
      ? Math.round(((Number(product.oldPrice) - currentPrice) / Number(product.oldPrice)) * 100)
      : null;

  const handleAddToCart = () => {
    if (isColorMissing) {
      setSelectionError('Veuillez sélectionner une couleur');
      return;
    }
    if (isSizeMissing) {
      setSelectionError('Veuillez sélectionner une taille');
      return;
    }
    if (!selectedVariant || availableStock <= 0) {
      setSelectionError('Cette combinaison est actuellement en rupture de stock');
      return;
    }

    setSelectionError(null);
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: product.images[selectedImageIndex]?.url || product.images[0]?.url || '',
      colorName: selectedVariant.color?.name,
      sizeName: selectedVariant.size?.name,
      price: currentPrice,
      maxStock: availableStock,
      quantity,
    });

    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 4000);
  };

  const handleBuyNow = () => {
    if (isSelectionIncomplete || !selectedVariant || availableStock <= 0) {
      handleAddToCart();
      return;
    }
    handleAddToCart();
    navigate('/checkout');
  };

  const primaryImage =
    product.images[selectedImageIndex]?.url ||
    product.images[0]?.url ||
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=80';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb back */}
      <Link
        to="/shop"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la boutique
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Photo Gallery (Max 7 photos) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-[3/4] w-full rounded-3xl overflow-hidden bg-slate-100 border border-slate-100 shadow-sm relative group">
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-105"
            />
            {discountPercent && (
              <div className="absolute top-4 left-4 bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-md">
                -{discountPercent}%
              </div>
            )}
          </div>

          {/* Thumbnails (up to 7 images) */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.slice(0, 7).map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 aspect-square rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-amber-600 ring-2 ring-amber-500/30'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Purchase Form */}
        <div className="lg:col-span-6 space-y-8">
          <div>
            {product.category && (
              <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block mb-2">
                {product.category.name}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-slate-900 leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              SKU : {selectedVariant?.sku || 'Sélectionnez vos options'}
            </p>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-black font-display text-slate-950">
                {formatCFA(currentPrice)}
              </span>
              {product.oldPrice && Number(product.oldPrice) > currentPrice && (
                <span className="text-sm text-slate-400 line-through">
                  {formatCFA(product.oldPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Step 1: Color Selection */}
          {uniqueColors.length > 0 && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Choisissez votre Couleur :{' '}
                <span className="text-amber-800 font-semibold">
                  {uniqueColors.find((c) => c.id === selectedColorId)?.name || 'Non sélectionnée'}
                </span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {uniqueColors.map((color) => {
                  const isSelected = selectedColorId === color.id;
                  return (
                    <button
                      key={color.id}
                      onClick={() => {
                        setSelectedColorId(color.id);
                        setSelectionError(null);
                      }}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/60 text-amber-950 font-bold ring-1 ring-amber-600 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Size Selection */}
          {uniqueSizes.length > 0 && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Choisissez votre Taille :{' '}
                <span className="text-slate-900 font-semibold">
                  {uniqueSizes.find((s) => s.id === selectedSizeId)?.name || 'Non sélectionnée'}
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map((size) => {
                  const isSelected = selectedSizeId === size.id;
                  return (
                    <button
                      key={size.id}
                      onClick={() => {
                        setSelectedSizeId(size.id);
                        setSelectionError(null);
                      }}
                      className={`min-w-[48px] h-10 px-3.5 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400'
                      }`}
                    >
                      {size.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Real-Time Stock Availability Indicator */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            {selectedVariant ? (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  {selectedVariant.color?.name || 'Standard'} + {selectedVariant.size?.name || 'TU'} :
                </span>
                {availableStock > 5 ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    ✓ {availableStock} pièces disponibles
                  </span>
                ) : availableStock > 0 ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800">
                    ⚡ Dernières pièces : {availableStock} restante{availableStock > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800">
                    ✗ Épuisé pour cette combinaison
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                👉 Sélectionnez une couleur et une taille pour afficher la disponibilité exacte.
              </p>
            )}
          </div>

          {selectionError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{selectionError}</span>
            </div>
          )}

          {/* Added to Cart Success Toast Notice */}
          {addedNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Article ajouté au panier avec succès !</span>
              </div>
              <Link
                to="/cart"
                className="text-xs font-bold text-emerald-900 underline flex items-center gap-1"
              >
                Voir le panier <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Quantity & CTA Buttons */}
          <div className="space-y-3 pt-1">
            <div className="flex gap-4">
              <div className="flex items-center border border-slate-200 rounded-2xl bg-white px-3 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2 py-2 text-slate-600 hover:text-slate-900 font-bold text-base"
                >
                  -
                </button>
                <span className="px-4 text-sm font-bold text-slate-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      selectedVariant ? Math.min(availableStock, quantity + 1) : quantity + 1
                    )
                  }
                  disabled={selectedVariant ? quantity >= availableStock : false}
                  className="px-2 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-30 font-bold text-base"
                >
                  +
                </button>
              </div>

              <Button
                type="button"
                variant="gold"
                size="lg"
                className="flex-1"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                leftIcon={<ShoppingBag className="w-5 h-5" />}
              >
                {isOutOfStock ? 'Épuisé' : 'Ajouter au Panier'}
              </Button>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
            >
              Commander Immédiatement
            </Button>
          </div>

          {/* Senegal Reassurance */}
          <div className="rounded-2xl bg-slate-50 p-5 space-y-3 border border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2.5 text-slate-800 font-medium">
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Livraison express à Dakar en 24h & expédition partout au Sénégal</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-800 font-medium">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Paiement 100% sécurisé via Wave, Orange Money ou à la livraison</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Description & Détails de Confection
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
