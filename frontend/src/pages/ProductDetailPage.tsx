import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { useCartStore } from '../stores/cartStore';
import { formatCFA } from '../lib/utils';
import { Spinner } from '../components/ui/Spinner';
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Zap,
} from 'lucide-react';

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
      <div className="max-w-md mx-auto py-24 text-center space-y-4 px-4">
        <h2 className="text-xl font-bold text-[#2C1E21] font-serif">Modèle Introuvable</h2>
        <p className="text-xs text-[#644D52]">L'article recherché n'existe pas ou n'est plus en ligne.</p>
        <Link to="/shop">
          <button className="bg-[#8B3A4A] text-white px-5 py-2.5 rounded-full font-medium text-xs hover:bg-[#722E3C] transition-all">
            Retourner à la boutique
          </button>
        </Link>
      </div>
    );
  }

  // Extract unique colors & sizes available for this product
  const uniqueColors = Array.from(
    new Map(
      (product.variants || [])
        .filter((v) => v.color)
        .map((v) => [v.color!.id, v.color!])
    ).values()
  );

  const uniqueSizes = Array.from(
    new Map(
      (product.variants || [])
        .filter((v) => v.size)
        .map((v) => [v.size!.id, v.size!])
    ).values()
  );

  // Find exact matching variant
  const selectedVariant = product.variants?.find(
    (v) =>
      (uniqueColors.length === 0 || v.colorId === selectedColorId) &&
      (uniqueSizes.length === 0 || v.sizeId === selectedSizeId)
  );

  const isColorMissing = uniqueColors.length > 0 && !selectedColorId;
  const isSizeMissing = uniqueSizes.length > 0 && !selectedSizeId;
  const isSelectionIncomplete = isColorMissing || isSizeMissing;

  const currentPrice = Number(selectedVariant?.price || product.price);
  const availableStock = selectedVariant ? selectedVariant.stock : (product.variants?.length ? product.variants[0]?.stock : 10);
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
    if (isOutOfStock) {
      setSelectionError('Cette combinaison est actuellement en rupture de stock');
      return;
    }

    setSelectionError(null);
    const targetVariant = selectedVariant || product.variants?.[0];

    addItem({
      variantId: targetVariant?.id || `v-${product.id}`,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: product.images?.[selectedImageIndex]?.url || product.images?.[0]?.url || '',
      colorName: targetVariant?.color?.name,
      sizeName: targetVariant?.size?.name,
      price: currentPrice,
      maxStock: availableStock || 10,
      quantity,
    });

    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 4000);
  };

  const handleBuyNow = () => {
    if (isSelectionIncomplete || isOutOfStock) {
      handleAddToCart();
      return;
    }
    handleAddToCart();
    navigate('/checkout');
  };

  const primaryImage =
    product.images?.[selectedImageIndex]?.url ||
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=80';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Breadcrumb back */}
      <Link
        to="/shop"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#644D52] hover:text-[#8B3A4A] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la boutique
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Photo Gallery (Max 7 photos) */}
        <div className="lg:col-span-6 space-y-3 sm:space-y-4">
          <div className="aspect-[4/5] sm:aspect-[3/4] w-full rounded-3xl overflow-hidden bg-[#FAF0EE] border border-[#F2E5E2] shadow-sm relative group flex items-center justify-center p-2 sm:p-4">
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full h-full object-contain sm:object-cover object-center transition-all duration-300 group-hover:scale-105"
            />
            {discountPercent && (
              <div className="absolute top-4 left-4 bg-[#1C1819] text-white font-bold text-xs px-3 py-1 rounded-full shadow-md">
                -{discountPercent}%
              </div>
            )}
          </div>

          {/* Thumbnails (up to 7 images) */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
              {product.images.slice(0, 7).map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-16 sm:w-20 aspect-square rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-[#8B3A4A] ring-2 ring-[#8B3A4A]/20'
                      : 'border-[#F2E5E2] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Purchase Form */}
        <div className="lg:col-span-6 space-y-6 sm:space-y-8">
          <div>
            {product.category && (
              <span className="text-[11px] sm:text-xs font-bold text-[#8B3A4A] uppercase tracking-widest block mb-1.5">
                {product.category.name}
              </span>
            )}
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-serif italic text-[#2C1E21] leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {product.name}
            </h1>
            <p className="text-xs text-[#A0888E] mt-1 font-mono">
              Réf : {selectedVariant?.sku || 'Collection Naja Rose'}
            </p>

            <div className="mt-3.5 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-[#1A1816]">
                {formatCFA(currentPrice)}
              </span>
              {product.oldPrice && Number(product.oldPrice) > currentPrice && (
                <span className="text-xs sm:text-sm text-[#A0888E] line-through">
                  {formatCFA(product.oldPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Step 1: Color Selection */}
          {uniqueColors.length > 0 && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#382B2F]">
                1. Couleur :{' '}
                <span className="text-[#8B3A4A] font-semibold">
                  {uniqueColors.find((c) => c.id === selectedColorId)?.name || 'Sélectionnez une couleur'}
                </span>
              </label>
              <div className="flex flex-wrap gap-2 sm:gap-2.5">
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
                          ? 'border-[#8B3A4A] bg-[#FAF0EE] text-[#54202B] font-bold ring-1 ring-[#8B3A4A] shadow-2xs'
                          : 'border-[#F2E5E2] bg-white text-[#382B2F] hover:border-[#8B3A4A]/40'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0 shadow-2xs"
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
              <label className="block text-xs font-bold uppercase tracking-wider text-[#382B2F]">
                2. Taille :{' '}
                <span className="text-[#2C1E21] font-semibold">
                  {uniqueSizes.find((s) => s.id === selectedSizeId)?.name || 'Sélectionnez une taille'}
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
                          ? 'border-[#2C1E21] bg-[#2C1E21] text-white font-bold shadow-xs'
                          : 'border-[#F2E5E2] bg-white text-[#382B2F] hover:border-[#8B3A4A]/40'
                      }`}
                    >
                      {size.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Stock Status */}
          <div className="p-3.5 rounded-2xl bg-[#FAF5F4] border border-[#F4E2E0] space-y-1">
            {selectedVariant ? (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#382B2F]">
                  {selectedVariant.color?.name || 'Standard'} + {selectedVariant.size?.name || 'TU'} :
                </span>
                {availableStock > 5 ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    ✓ En stock disponible ({availableStock} pcs)
                  </span>
                ) : availableStock > 0 ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FAF0EE] text-[#8B3A4A] border border-[#F2E5E2]">
                    ⚡ Dernières pièces : {availableStock} restante{availableStock > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800">
                    ✗ Épuisé pour cette combinaison
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#644D52] italic flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#8B3A4A]" />
                Sélectionnez vos options pour voir la disponibilité en direct.
              </p>
            )}
          </div>

          {selectionError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{selectionError}</span>
            </div>
          )}

          {/* Added Notice */}
          {addedNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Article ajouté au panier !</span>
              </div>
              <Link
                to="/cart"
                className="text-xs font-bold text-emerald-900 underline flex items-center gap-1"
              >
                Voir le panier <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Quantity & CTA Buttons (Desktop) */}
          <div className="space-y-3 pt-1">
            <div className="flex gap-3 sm:gap-4">
              <div className="flex items-center border border-[#F2E5E2] rounded-2xl bg-white px-3 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2 py-2 text-[#382B2F] hover:text-[#8B3A4A] font-bold text-base"
                >
                  -
                </button>
                <span className="px-4 text-sm font-bold text-[#1A1816]">{quantity}</span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      selectedVariant ? Math.min(availableStock, quantity + 1) : quantity + 1
                    )
                  }
                  disabled={selectedVariant ? quantity >= availableStock : false}
                  className="px-2 py-2 text-[#382B2F] hover:text-[#8B3A4A] disabled:opacity-30 font-bold text-base"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="flex-1 bg-[#E7A8B4] hover:bg-[#D48B99] text-white font-bold text-xs sm:text-sm py-3.5 px-5 rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isOutOfStock ? 'Épuisé' : 'Ajouter au Panier'}</span>
              </button>
            </div>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className="w-full bg-[#8B3A4A] hover:bg-[#722E3C] text-white font-bold text-xs sm:text-sm py-3.5 px-5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4" />
              <span>Commander Immédiatement</span>
            </button>
          </div>

          {/* Senegal Reassurance */}
          <div className="rounded-2xl bg-[#FAF5F4] p-4 sm:p-5 space-y-3 border border-[#F4E2E0] text-xs text-[#54382B]">
            <div className="flex items-center gap-2.5 font-medium">
              <Truck className="w-4 h-4 text-[#8B3A4A] shrink-0" />
              <span>Livraison express à Dakar sous 24h & expédition rapide partout au Sénégal</span>
            </div>
            <div className="flex items-center gap-2.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#8B3A4A] shrink-0" />
              <span>Paiement sécurisé par Wave, Orange Money ou en Espèces à la livraison</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="pt-4 border-t border-[#F2E5E2] space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#382B2F]">
                Détails & Conseils de Style
              </h3>
              <p className="text-xs sm:text-sm text-[#644D52] leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Mobile Bottom Purchase Bar (Pins above bottom nav on mobile) */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-35 bg-white/95 backdrop-blur-md border-t border-[#F4E2E0] p-3 shadow-lg flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#644D52] truncate">{product.name}</p>
          <p className="text-sm font-bold text-[#1A1816] leading-none mt-0.5">{formatCFA(currentPrice)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="bg-[#E7A8B4] hover:bg-[#D48B99] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 disabled:opacity-40"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Panier</span>
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="bg-[#8B3A4A] hover:bg-[#722E3C] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 disabled:opacity-40"
          >
            <span>Acheter</span>
          </button>
        </div>
      </div>
    </div>
  );
}
