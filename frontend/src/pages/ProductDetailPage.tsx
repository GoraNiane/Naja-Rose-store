import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { useCartStore } from '../stores/cartStore';
import { formatCFA } from '../lib/utils';
import { Spinner } from '../components/ui/Spinner';
import { ScrollReveal } from '../components/common/ScrollReveal';
import { motion, AnimatePresence } from 'framer-motion';
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
  Layers,
  Plus,
  Minus,
  Trash2,
  Check,
} from 'lucide-react';
import { ProductVariant } from '../types';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, addItems, items: cartItems, updateQuantity, removeItem } = useCartStore();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getProductBySlug(slug!),
    enabled: !!slug,
  });

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [singleQty, setSingleQty] = useState(1);
  const [multiQuantities, setMultiQuantities] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'single' | 'matrix'>('single');
  const [addedNotice, setAddedNotice] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  // Extract unique colors available for this product
  const uniqueColors = useMemo(() => {
    if (!product?.variants) return [];
    const colorMap = new Map();
    product.variants.forEach((v) => {
      if (v.color && !colorMap.has(v.color.id)) {
        colorMap.set(v.color.id, v.color);
      }
    });
    return Array.from(colorMap.values());
  }, [product]);

  // Extract unique sizes available for this product
  const uniqueSizes = useMemo(() => {
    if (!product?.variants) return [];
    const sizeMap = new Map();
    product.variants.forEach((v) => {
      if (v.size && !sizeMap.has(v.size.id)) {
        sizeMap.set(v.size.id, v.size);
      }
    });
    return Array.from(sizeMap.values());
  }, [product]);

  // Auto-select first color on load
  useEffect(() => {
    if (uniqueColors.length > 0 && !selectedColorId) {
      setSelectedColorId(uniqueColors[0].id);
    }
  }, [uniqueColors, selectedColorId]);

  // When color changes, select the first available size with stock
  useEffect(() => {
    if (selectedColorId && product?.variants) {
      const colorVariants = product.variants.filter((v) => v.colorId === selectedColorId);
      const currentSizeStillValid = colorVariants.some(
        (v) => v.sizeId === selectedSizeId && v.stock > 0
      );
      if (!currentSizeStillValid) {
        const firstAvailable = colorVariants.find((v) => v.stock > 0);
        if (firstAvailable?.sizeId) {
          setSelectedSizeId(firstAvailable.sizeId);
        } else if (colorVariants[0]?.sizeId) {
          setSelectedSizeId(colorVariants[0].sizeId);
        }
      }
    }
  }, [selectedColorId, product, selectedSizeId]);

  // Find exact matching variant for single selection mode
  const selectedVariant = useMemo(() => {
    if (!product?.variants) return null;
    return (
      product.variants.find(
        (v) =>
          (uniqueColors.length === 0 || v.colorId === selectedColorId) &&
          (uniqueSizes.length === 0 || v.sizeId === selectedSizeId)
      ) || null
    );
  }, [product, selectedColorId, selectedSizeId, uniqueColors, uniqueSizes]);

  // Items for this product already in cart
  const productCartItems = useMemo(() => {
    if (!product) return [];
    return cartItems.filter((item) => item.productId === product.id);
  }, [cartItems, product]);

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

  const currentPrice = Number(selectedVariant?.price || product.price);
  const availableStock = selectedVariant ? selectedVariant.stock : product.variants?.[0]?.stock || 0;
  const isOutOfStock = Boolean(selectedVariant && availableStock <= 0);

  // Discount percentage
  const discountPercent =
    product.oldPrice && Number(product.oldPrice) > currentPrice
      ? Math.round(((Number(product.oldPrice) - currentPrice) / Number(product.oldPrice)) * 100)
      : null;

  // Single Combo Add to Cart
  const handleAddSingleToCart = () => {
    if (uniqueColors.length > 0 && !selectedColorId) {
      setSelectionError('Veuillez sélectionner une couleur');
      return;
    }
    if (uniqueSizes.length > 0 && !selectedSizeId) {
      setSelectionError('Veuillez sélectionner une taille');
      return;
    }
    if (!selectedVariant) {
      setSelectionError('Cette combinaison de couleur et taille n’est pas disponible');
      return;
    }
    if (selectedVariant.stock <= 0) {
      setSelectionError('Cette combinaison est actuellement en rupture de stock');
      return;
    }

    setSelectionError(null);

    const colorName = selectedVariant.color?.name;
    const sizeName = selectedVariant.size?.name;

    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: product.images?.[selectedImageIndex]?.url || product.images?.[0]?.url || '',
      colorName: colorName || null,
      colorHex: selectedVariant.color?.hex || null,
      sizeName: sizeName || null,
      sku: selectedVariant.sku || null,
      price: Number(selectedVariant.price || product.price),
      maxStock: selectedVariant.stock,
      quantity: singleQty,
    });

    setAddedNotice(
      `Ajouté : ${product.name} (${colorName ? colorName + ' / ' : ''}${sizeName || 'TU'}) × ${singleQty}`
    );
    setTimeout(() => setAddedNotice(null), 4000);
  };

  // Immediate Buy Now for Single Combo
  const handleBuyNowSingle = () => {
    if (!selectedVariant || selectedVariant.stock <= 0) {
      handleAddSingleToCart();
      return;
    }
    handleAddSingleToCart();
    navigate('/checkout');
  };

  // Multi-combination Matrix Actions
  const handleMultiQtyChange = (variantId: string, delta: number, max: number) => {
    const current = multiQuantities[variantId] || 0;
    const next = Math.max(0, Math.min(max, current + delta));
    setMultiQuantities((prev) => ({
      ...prev,
      [variantId]: next,
    }));
  };

  const handleAddMultiToCart = () => {
    const entries = Object.entries(multiQuantities).filter(([, qty]) => qty > 0);
    if (entries.length === 0) {
      setSelectionError('Veuillez indiquer au moins 1 quantité sur une variante.');
      return;
    }

    setSelectionError(null);
    const itemsToAdd = entries.map(([vId, qty]) => {
      const v = product.variants.find((variant) => variant.id === vId)!;
      return {
        variantId: v.id,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        imageUrl: product.images?.[0]?.url || '',
        colorName: v.color?.name || null,
        colorHex: v.color?.hex || null,
        sizeName: v.size?.name || null,
        sku: v.sku || null,
        price: Number(v.price || product.price),
        maxStock: v.stock,
        quantity: qty,
      };
    });

    addItems(itemsToAdd);
    const totalAdded = itemsToAdd.reduce((sum, item) => sum + item.quantity, 0);
    setAddedNotice(`${totalAdded} vêtement(s) ajouté(s) au panier !`);
    setMultiQuantities({});
    setTimeout(() => setAddedNotice(null), 4000);
  };

  const multiTotalQty = Object.values(multiQuantities).reduce((a, b) => a + b, 0);
  const multiTotalPrice = Object.entries(multiQuantities).reduce((acc, [vId, qty]) => {
    const v = product.variants?.find((variant) => variant.id === vId);
    const price = Number(v?.price || product.price);
    return acc + price * qty;
  }, 0);

  const primaryImage =
    product.images?.[selectedImageIndex]?.url ||
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=80';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 overflow-hidden">
      {/* Breadcrumb back */}
      <Link
        to="/shop"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#644D52] hover:text-[#8B3A4A] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la boutique
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Photo Gallery */}
        <ScrollReveal direction="left" distance={30} className="lg:col-span-6 space-y-3 sm:space-y-4">
          <div className="aspect-[4/5] sm:aspect-[3/4] w-full rounded-3xl overflow-hidden bg-[#FAF0EE] border border-[#F2E5E2] shadow-sm relative group flex items-center justify-center p-2 sm:p-4">
            <motion.img
              key={primaryImage}
              initial={{ opacity: 0.6, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
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
        </ScrollReveal>

        {/* Product Details & Purchase Controls */}
        <ScrollReveal direction="right" distance={30} className="lg:col-span-6 space-y-6 sm:space-y-8">
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

            <div className="mt-3.5 flex items-center gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold text-[#1A1816]">
                {formatCFA(currentPrice)}
              </span>
              {product.oldPrice && Number(product.oldPrice) > currentPrice && (
                <>
                  <span className="text-sm sm:text-base text-[#A0888E] line-through">
                    {formatCFA(product.oldPrice)}
                  </span>
                  {discountPercent && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1C1819] text-white shadow-2xs">
                      -{discountPercent}%
                    </span>
                  )}
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Économie : {formatCFA(Number(product.oldPrice) - currentPrice)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Mode Selector Tabs: Single Combination vs Multi-Variant Matrix */}
          <div className="flex rounded-2xl bg-[#FAF0EE] p-1.5 border border-[#F2E5E2]">
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'single'
                  ? 'bg-white text-[#8B3A4A] shadow-2xs ring-1 ring-[#8B3A4A]/20'
                  : 'text-[#644D52] hover:text-[#2C1E21]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Sélection Standard (Taille & Couleur)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'bg-white text-[#8B3A4A] shadow-2xs ring-1 ring-[#8B3A4A]/20'
                  : 'text-[#644D52] hover:text-[#2C1E21]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Multi-Tailles & Couleurs (1 Clic)</span>
            </button>
          </div>

          {/* TAB 1: SINGLE VARIANT SELECTION */}
          {activeTab === 'single' && (
            <div className="space-y-5">
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
                      const hasStockForColor = (product.variants || []).some(
                        (v) => v.colorId === color.id && v.stock > 0
                      );
                      return (
                        <button
                          key={color.id}
                          onClick={() => {
                            setSelectedColorId(color.id);
                            setSelectionError(null);
                          }}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#8B3A4A] bg-[#FAF0EE] text-[#54202B] font-bold ring-2 ring-[#8B3A4A]/30 shadow-2xs'
                              : 'border-[#F2E5E2] bg-white text-[#382B2F] hover:border-[#8B3A4A]/40'
                          } ${!hasStockForColor ? 'opacity-50' : ''}`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0 shadow-2xs"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span>{color.name}</span>
                          {isSelected && <Check className="w-3 h-3 text-[#8B3A4A]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Size Selection for the chosen color */}
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
                      // Find variant for selectedColor + this size
                      const matchingVar = (product.variants || []).find(
                        (v) =>
                          (uniqueColors.length === 0 || v.colorId === selectedColorId) &&
                          v.sizeId === size.id
                      );
                      const sizeStock = matchingVar ? matchingVar.stock : 0;
                      const isSizeOutOfStock = !matchingVar || sizeStock <= 0;

                      return (
                        <button
                          key={size.id}
                          disabled={isSizeOutOfStock}
                          onClick={() => {
                            setSelectedSizeId(size.id);
                            setSelectionError(null);
                          }}
                          className={`min-w-[54px] h-11 px-3.5 rounded-xl border text-xs transition-all flex flex-col items-center justify-center cursor-pointer ${
                            isSelected
                              ? 'border-[#2C1E21] bg-[#2C1E21] text-white font-bold shadow-xs'
                              : isSizeOutOfStock
                              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed line-through opacity-60'
                              : 'border-[#F2E5E2] bg-white text-[#382B2F] hover:border-[#8B3A4A]/40 font-semibold'
                          }`}
                        >
                          <span className="text-xs font-bold">{size.name}</span>
                          <span
                            className={`text-[9px] ${
                              isSelected
                                ? 'text-rose-200'
                                : isSizeOutOfStock
                                ? 'text-gray-400'
                                : sizeStock <= 3
                                ? 'text-[#8B3A4A] font-bold'
                                : 'text-emerald-700'
                            }`}
                          >
                            {isSizeOutOfStock ? 'Épuisé' : `${sizeStock} dispo`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Stock Status Preview */}
              <div className="p-3.5 rounded-2xl bg-[#FAF5F4] border border-[#F4E2E0] space-y-1">
                {selectedVariant ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#382B2F]">
                      {selectedVariant.color?.name || 'Standard'} + {selectedVariant.size?.name || 'TU'} :
                    </span>
                    {availableStock > 5 ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        ✓ En stock ({availableStock} pcs)
                      </span>
                    ) : availableStock > 0 ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FAF0EE] text-[#8B3A4A] border border-[#F2E5E2]">
                        ⚡ Plus que {availableStock} disponible{availableStock > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800">
                        ✗ Rupture de stock
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#644D52] italic flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#8B3A4A]" />
                    Sélectionnez vos options pour vérifier la disponibilité en direct.
                  </p>
                )}
              </div>

              {/* Quantity & CTA Buttons (Single) */}
              <div className="space-y-3 pt-1">
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex items-center border border-[#F2E5E2] rounded-2xl bg-white px-3 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setSingleQty(Math.max(1, singleQty - 1))}
                      className="px-2 py-2 text-[#382B2F] hover:text-[#8B3A4A] font-bold text-base cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 text-sm font-bold text-[#1A1816]">{singleQty}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSingleQty(
                          selectedVariant ? Math.min(availableStock, singleQty + 1) : singleQty + 1
                        )
                      }
                      disabled={selectedVariant ? singleQty >= availableStock : false}
                      className="px-2 py-2 text-[#382B2F] hover:text-[#8B3A4A] disabled:opacity-30 font-bold text-base cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isOutOfStock || !selectedVariant}
                    onClick={handleAddSingleToCart}
                    className="flex-1 bg-[#E7A8B4] hover:bg-[#D48B99] text-white font-bold text-xs sm:text-sm py-3.5 px-5 rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isOutOfStock ? 'Épuisé' : 'Ajouter cette combinaison'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isOutOfStock || !selectedVariant}
                  onClick={handleBuyNowSingle}
                  className="w-full bg-[#8B3A4A] hover:bg-[#722E3C] text-white font-bold text-xs sm:text-sm py-3.5 px-5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Commander Immédiatement</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MULTI-VARIANT MATRIX (Combiner plusieurs tailles & couleurs en 1 clic) */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#FAF5F4] rounded-2xl border border-[#F4E2E0] text-xs text-[#644D52]">
                <p className="font-bold text-[#2C1E21] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#8B3A4A]" />
                  Commandez plusieurs tailles et couleurs en une seule fois :
                </p>
                <p className="text-[11px] mt-0.5 text-[#7A6469]">
                  Indiquez les quantités souhaitées pour chaque variante. Toutes les combinaisons sélectionnées seront ajoutées au panier sur des lignes distinctes.
                </p>
              </div>

              {/* Matrix Table */}
              <div className="border border-[#F2E5E2] rounded-2xl overflow-hidden bg-white shadow-2xs divide-y divide-[#FAF0EE]">
                {(product.variants || []).map((variant: ProductVariant) => {
                  const qty = multiQuantities[variant.id] || 0;
                  const varPrice = Number(variant.price || product.price);
                  const isVarOutOfStock = variant.stock <= 0;

                  return (
                    <div
                      key={variant.id}
                      className={`p-3 sm:p-4 flex items-center justify-between gap-3 ${
                        isVarOutOfStock ? 'bg-gray-50/70 opacity-60' : qty > 0 ? 'bg-[#FFF9F8]' : 'hover:bg-[#FAF9F7]'
                      } transition-colors`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {variant.color && (
                          <span
                            className="w-5 h-5 rounded-full border border-black/10 shrink-0 shadow-2xs"
                            style={{ backgroundColor: variant.color.hex }}
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#2C1E21] truncate">
                            {variant.color?.name || 'Standard'} • Taille {variant.size?.name || 'TU'}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-[#7A6469]">
                            <span>{formatCFA(varPrice)}</span>
                            <span>•</span>
                            <span
                              className={`font-semibold ${
                                isVarOutOfStock
                                  ? 'text-rose-600'
                                  : variant.stock <= 3
                                  ? 'text-[#8B3A4A]'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {isVarOutOfStock ? 'Épuisé' : `${variant.stock} en stock`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center border border-[#F2E5E2] rounded-xl bg-white shadow-2xs">
                        <button
                          type="button"
                          disabled={qty <= 0 || isVarOutOfStock}
                          onClick={() => handleMultiQtyChange(variant.id, -1, variant.stock)}
                          className="p-1.5 text-[#644D52] hover:text-[#2C1E21] disabled:opacity-20 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-[#2C1E21] min-w-[24px] text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          disabled={isVarOutOfStock || qty >= variant.stock}
                          onClick={() => handleMultiQtyChange(variant.id, 1, variant.stock)}
                          className="p-1.5 text-[#644D52] hover:text-[#8B3A4A] disabled:opacity-20 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Multi-add CTA */}
              <div className="p-4 rounded-2xl bg-[#FAF0EE] border border-[#F2E5E2] space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#644D52]">
                    Total sélectionné : <strong>{multiTotalQty} article{multiTotalQty > 1 ? 's' : ''}</strong>
                  </span>
                  <span className="font-bold text-base text-[#1A1816] font-mono">
                    {formatCFA(multiTotalPrice)}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={multiTotalQty === 0}
                  onClick={handleAddMultiToCart}
                  className="w-full bg-[#8B3A4A] hover:bg-[#722E3C] text-white font-bold text-xs sm:text-sm py-3.5 px-5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {multiTotalQty > 0
                      ? `Ajouter les ${multiTotalQty} articles au panier (${formatCFA(multiTotalPrice)})`
                      : 'Sélectionnez des quantités ci-dessus'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Feedback Notices */}
          <AnimatePresence>
            {selectionError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold rounded-2xl flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{selectionError}</span>
              </motion.div>
            )}

            {addedNotice && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{addedNotice}</span>
                </div>
                <Link
                  to="/cart"
                  className="text-xs font-bold text-emerald-900 underline flex items-center gap-1 shrink-0"
                >
                  Voir le panier <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LIVE CART PREVIEW FOR THIS MODEL */}
          {productCartItems.length > 0 && (
            <div className="p-4 sm:p-5 rounded-3xl bg-[#FAF9F8] border border-[#F2E5E2] space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#F4E2E0] pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2C1E21]">
                  <ShoppingBag className="w-4 h-4 text-[#8B3A4A]" />
                  <span>Articles de ce modèle dans votre panier ({productCartItems.length})</span>
                </div>
                <Link to="/cart" className="text-xs font-bold text-[#8B3A4A] hover:underline">
                  Voir tout
                </Link>
              </div>

              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {productCartItems.map((cItem) => (
                  <div
                    key={cItem.variantId}
                    className="flex items-center justify-between gap-3 p-2.5 bg-white rounded-xl border border-[#F2E5E2] text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[#2C1E21] truncate">{cItem.productName}</p>
                      <p className="text-[11px] text-[#7A6469]">
                        {cItem.colorName ? `Couleur : ${cItem.colorName}` : ''}{' '}
                        {cItem.sizeName ? `• Taille : ${cItem.sizeName}` : ''}
                      </p>
                      <p className="text-xs font-bold text-[#8B3A4A] font-mono mt-0.5">
                        {formatCFA(cItem.price * cItem.quantity)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-[#F2E5E2] rounded-lg bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(cItem.variantId, cItem.quantity - 1)}
                          className="p-1 text-[#644D52] hover:text-[#2C1E21]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-bold text-xs">{cItem.quantity}</span>
                        <button
                          type="button"
                          disabled={cItem.quantity >= cItem.maxStock}
                          onClick={() => updateQuantity(cItem.variantId, cItem.quantity + 1)}
                          className="p-1 text-[#644D52] hover:text-[#8B3A4A] disabled:opacity-20"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(cItem.variantId)}
                        className="p-1 text-[#A0888E] hover:text-rose-600 rounded"
                        title="Supprimer cette combinaison"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#F4E2E0]">
                <Link
                  to="/cart"
                  className="text-xs font-semibold text-[#644D52] hover:text-[#8B3A4A] flex items-center gap-1"
                >
                  Ouvrir le panier <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="px-4 py-2 bg-[#8B3A4A] hover:bg-[#722E3C] text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  Finaliser ma commande
                </button>
              </div>
            </div>
          )}

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
        </ScrollReveal>
      </div>

      {/* Sticky Mobile Bottom Purchase Bar */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-35 bg-white/95 backdrop-blur-md border-t border-[#F4E2E0] p-3 shadow-lg flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#644D52] truncate">{product.name}</p>
          <p className="text-sm font-bold text-[#1A1816] leading-none mt-0.5">{formatCFA(currentPrice)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAddSingleToCart}
            disabled={isOutOfStock}
            className="bg-[#E7A8B4] hover:bg-[#D48B99] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Panier</span>
          </button>
          <button
            onClick={handleBuyNowSingle}
            disabled={isOutOfStock}
            className="bg-[#8B3A4A] hover:bg-[#722E3C] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            <span>Acheter</span>
          </button>
        </div>
      </div>
    </div>
  );
}
