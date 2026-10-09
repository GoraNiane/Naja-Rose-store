import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { formatCFA } from '../../lib/utils';
import { ShoppingBag, Heart } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartStore();
  const [isLiked, setIsLiked] = useState(false);

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80';

  const defaultVariant = product.variants?.[0];
  const hasDiscount = Boolean(product.oldPrice && Number(product.oldPrice) > Number(product.price));
  const discountPercent = hasDiscount
    ? Math.round(((Number(product.oldPrice) - Number(product.price)) / Number(product.oldPrice)) * 100)
    : null;

  const totalStock = product.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) ?? 10;

  // Extract unique colors
  const uniqueColors = Array.from(
    new Map(
      (product.variants || [])
        .filter((v) => v.color && v.color.hex)
        .map((v) => [v.color!.id || v.color!.name, v.color!])
    ).values()
  );

  // Extract unique sizes
  const uniqueSizes = Array.from(
    new Map(
      (product.variants || [])
        .filter((v) => v.size && v.size.name)
        .map((v) => [v.size!.id || v.size!.name, v.size!])
    ).values()
  );

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!defaultVariant || (defaultVariant.stock !== undefined && defaultVariant.stock <= 0)) {
      // Fallback add if stock not tracked rigidly
      addItem({
        variantId: defaultVariant?.id || `v-${product.id}`,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        imageUrl: primaryImage,
        colorName: defaultVariant?.color?.name,
        sizeName: defaultVariant?.size?.name,
        price: Number(defaultVariant?.price || product.price),
        maxStock: defaultVariant?.stock || 10,
        quantity: 1,
      });
      return;
    }

    addItem({
      variantId: defaultVariant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: primaryImage,
      colorName: defaultVariant.color?.name,
      sizeName: defaultVariant.size?.name,
      price: Number(defaultVariant.price || product.price),
      maxStock: defaultVariant.stock,
      quantity: 1,
    });
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <div className="group relative flex flex-col rounded-[22px] sm:rounded-[26px] bg-white border border-[#F2E5E2] shadow-2xs hover:shadow-luxury-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Image Container with Soft Pastel Tint Background */}
      <div className="relative aspect-[4/5] w-full bg-[#FAF0EE] rounded-t-[22px] sm:rounded-t-[26px] overflow-hidden flex items-center justify-center p-3 sm:p-4">
        <Link
          to={`/product/${product.slug}`}
          className="w-full h-full flex items-center justify-center overflow-hidden"
        >
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-contain sm:object-cover group-hover:scale-105 transition-transform duration-300 ease-out transform-gpu"
            loading="lazy"
            decoding="async"
          />
        </Link>

        {/* Discount Badge Pill (Dark Charcoal/Black from screenshot: -10%) */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 pointer-events-none">
            <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#1C1819] text-white shadow-xs">
              -{discountPercent}%
            </span>
          </div>
        )}

        {/* Top Right Wishlist Heart */}
        <button
          onClick={handleToggleLike}
          aria-label="Ajouter aux favoris"
          className="absolute top-3 right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-xs hover:bg-white text-[#54202B] hover:text-[#8B3A4A] flex items-center justify-center shadow-xs transition-all duration-200"
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
              isLiked ? 'fill-[#8B3A4A] text-[#8B3A4A]' : 'text-[#7A6469]'
            }`}
          />
        </button>
      </div>

      {/* Product Info Section */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2 bg-white">
        <div className="space-y-1">
          {/* Title in Elegant Chic Typography */}
          <Link
            to={`/product/${product.slug}`}
            className="font-serif text-xs sm:text-sm text-[#2C1E21] hover:text-[#8B3A4A] transition-colors line-clamp-1 block leading-snug"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {product.name}
          </Link>

          {/* Price with strikethrough if discounted */}
          <div className="flex items-baseline gap-1.5 pt-0.5 flex-wrap">
            <span className="font-bold text-xs sm:text-sm md:text-base text-[#1A1816]">
              {formatCFA(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-[10px] sm:text-xs text-[#A0888E] line-through font-normal">
                {formatCFA(product.oldPrice!)}
              </span>
            )}
          </div>
        </div>

        {/* Variants Indicators Row: Color stripes or Size chips (Faithfully reproduced from screenshot) */}
        <div className="pt-1 flex items-center justify-between min-h-[26px]">
          {/* Color swatches vertical bars if available */}
          {uniqueColors.length > 0 ? (
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-[75%] no-scrollbar">
              {uniqueColors.map((c) => (
                <span
                  key={c.id}
                  className="w-1.5 sm:w-2 h-3.5 sm:h-4 rounded-full border border-black/10 shrink-0 shadow-2xs"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          ) : uniqueSizes.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1">
              {uniqueSizes.slice(0, 4).map((s) => (
                <span
                  key={s.id}
                  className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold bg-[#FAF5F4] border border-[#EBE1DF] text-[#5A464A] rounded-md leading-none"
                >
                  {s.name}
                </span>
              ))}
              {uniqueSizes.length > 4 && (
                <span className="text-[9px] text-[#A0888E] font-medium">+{uniqueSizes.length - 4}</span>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-[#A0888E] font-medium">Collection Naja</span>
          )}

          {/* Quick Add Round Button */}
          <button
            onClick={handleQuickAdd}
            disabled={totalStock <= 0}
            aria-label="Ajouter au panier"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E7A8B4] hover:bg-[#D48B99] text-white flex items-center justify-center shadow-xs transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-95 shrink-0"
            title="Ajouter au panier"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
