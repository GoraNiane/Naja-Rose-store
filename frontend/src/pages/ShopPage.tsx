import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { ProductCard } from '../components/common/ProductCard';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const defaultCatalogItems = [
  {
    id: 'prod-bonnet',
    name: 'Bonnet en satin de soie',
    slug: 'bonnet-en-satin-de-soie',
    categoryId: 'cat-accessoires',
    price: 4500,
    oldPrice: 5000,
    images: [
      {
        id: 'img-b1',
        url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        position: 0,
        publicId: 'bonnet-satin',
      },
    ],
    variants: [
      { id: 'v-b1', stock: 20, price: 4500, sku: 'NJ-BON-01', color: { id: 'c1', name: 'Rose Poudré', hex: '#E7A8B4' } },
      { id: 'v-b2', stock: 15, price: 4500, sku: 'NJ-BON-02', color: { id: 'c2', name: 'Bordeaux', hex: '#722E3C' } },
      { id: 'v-b3', stock: 12, price: 4500, sku: 'NJ-BON-03', color: { id: 'c3', name: 'Chocolat', hex: '#54382B' } },
      { id: 'v-b4', stock: 18, price: 4500, sku: 'NJ-BON-04', color: { id: 'c4', name: 'Fuchsia', hex: '#D81B60' } },
      { id: 'v-b5', stock: 14, price: 4500, sku: 'NJ-BON-05', color: { id: 'c5', name: 'Bleu Ciel', hex: '#64B5F6' } },
      { id: 'v-b6', stock: 16, price: 4500, sku: 'NJ-BON-06', color: { id: 'c6', name: 'Bleu Roi', hex: '#1E40AF' } },
      { id: 'v-b7', stock: 22, price: 4500, sku: 'NJ-BON-07', color: { id: 'c7', name: 'Noir Élégance', hex: '#1C1819' } },
    ],
  },
  {
    id: 'prod-samira',
    name: 'Ensemble 3 Pièces "Samira"',
    slug: 'ensemble-3-pieces-samira',
    categoryId: 'cat-ensembles',
    price: 10000,
    oldPrice: null,
    images: [
      {
        id: 'img-s1',
        url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        position: 0,
        publicId: 'ens-samira',
      },
    ],
    variants: [
      { id: 'v-s1', stock: 8, price: 10000, sku: 'NJ-SAM-S', size: { id: 's1', name: 'S' } },
      { id: 'v-s2', stock: 12, price: 10000, sku: 'NJ-SAM-M', size: { id: 's2', name: 'M' } },
      { id: 'v-s3', stock: 10, price: 10000, sku: 'NJ-SAM-L', size: { id: 's3', name: 'L' } },
      { id: 'v-s4', stock: 6, price: 10000, sku: 'NJ-SAM-XL', size: { id: 's4', name: 'XL' } },
    ],
  },
  {
    id: 'prod-dixy',
    name: 'Ensemble 3 Pièces "Dixy"',
    slug: 'ensemble-3-pieces-dixy',
    categoryId: 'cat-ensembles',
    price: 10000,
    oldPrice: null,
    images: [
      {
        id: 'img-d1',
        url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        position: 0,
        publicId: 'ens-dixy',
      },
    ],
    variants: [
      { id: 'v-d1', stock: 5, price: 10000, sku: 'NJ-DIX-S', size: { id: 's1', name: 'S' } },
      { id: 'v-d2', stock: 9, price: 10000, sku: 'NJ-DIX-M', size: { id: 's2', name: 'M' } },
      { id: 'v-d3', stock: 7, price: 10000, sku: 'NJ-DIX-L', size: { id: 's3', name: 'L' } },
      { id: 'v-d4', stock: 4, price: 10000, sku: 'NJ-DIX-XL', size: { id: 's4', name: 'XL' } },
    ],
  },
  {
    id: 'prod-lily',
    name: 'Ensemble 3 Pièces "Lily"',
    slug: 'ensemble-3-pieces-lily',
    categoryId: 'cat-ensembles',
    price: 10000,
    oldPrice: null,
    images: [
      {
        id: 'img-l1',
        url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        position: 0,
        publicId: 'ens-lily',
      },
    ],
    variants: [
      { id: 'v-l1', stock: 6, price: 10000, sku: 'NJ-LIL-S', size: { id: 's1', name: 'S' } },
      { id: 'v-l2', stock: 11, price: 10000, sku: 'NJ-LIL-M', size: { id: 's2', name: 'M' } },
      { id: 'v-l3', stock: 8, price: 10000, sku: 'NJ-LIL-L', size: { id: 's3', name: 'L' } },
      { id: 'v-l4', stock: 5, price: 10000, sku: 'NJ-LIL-XL', size: { id: 's4', name: 'XL' } },
    ],
  },
  {
    id: 'prod-robe-longue',
    name: 'Robe longue fluide en soie',
    slug: 'robe-longue-fluide-en-soie',
    categoryId: 'cat-robes',
    price: 35000,
    oldPrice: 42000,
    images: [
      {
        id: 'img-r1',
        url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        position: 0,
        publicId: 'robe-longue',
      },
    ],
    variants: [
      { id: 'v-r1', stock: 4, price: 35000, sku: 'NJ-ROB-S', size: { id: 's1', name: 'S' } },
      { id: 'v-r2', stock: 7, price: 35000, sku: 'NJ-ROB-M', size: { id: 's2', name: 'M' } },
      { id: 'v-r3', stock: 5, price: 35000, sku: 'NJ-ROB-L', size: { id: 's3', name: 'L' } },
    ],
  },
  {
    id: 'prod-tailleur',
    name: 'Ensemble tailleur prestige',
    slug: 'ensemble-tailleur-prestige',
    categoryId: 'cat-ensembles',
    price: 45000,
    oldPrice: 55000,
    images: [
      {
        id: 'img-t1',
        url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        position: 0,
        publicId: 'ens-tailleur',
      },
    ],
    variants: [
      { id: 'v-t1', stock: 3, price: 45000, sku: 'NJ-TLR-S', size: { id: 's1', name: 'S' } },
      { id: 'v-t2', stock: 6, price: 45000, sku: 'NJ-TLR-M', size: { id: 's2', name: 'M' } },
      { id: 'v-t3', stock: 4, price: 45000, sku: 'NJ-TLR-L', size: { id: 's3', name: 'L' } },
    ],
  },
  {
    id: 'prod-chemise',
    name: 'Chemise oversize en popeline',
    slug: 'chemise-oversize-en-popeline',
    categoryId: 'cat-tops-t-shirts',
    price: 25000,
    oldPrice: 30000,
    images: [
      {
        id: 'img-ch1',
        url: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        position: 0,
        publicId: 'chemise-oversize',
      },
    ],
    variants: [
      { id: 'v-ch1', stock: 12, price: 25000, sku: 'NJ-CHM-S', size: { id: 's1', name: 'S' } },
      { id: 'v-ch2', stock: 15, price: 25000, sku: 'NJ-CHM-M', size: { id: 's2', name: 'M' } },
      { id: 'v-ch3', stock: 10, price: 25000, sku: 'NJ-CHM-L', size: { id: 's3', name: 'L' } },
    ],
  },
  {
    id: 'prod-robe-cocktail',
    name: 'Robe élégante cocktail',
    slug: 'robe-elegante-cocktail',
    categoryId: 'cat-robes',
    price: 32000,
    oldPrice: null,
    images: [
      {
        id: 'img-rc1',
        url: 'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        position: 0,
        publicId: 'robe-cocktail',
      },
    ],
    variants: [
      { id: 'v-rc1', stock: 8, price: 32000, sku: 'NJ-RC-S', size: { id: 's1', name: 'S' } },
      { id: 'v-rc2', stock: 14, price: 32000, sku: 'NJ-RC-M', size: { id: 's2', name: 'M' } },
      { id: 'v-rc3', stock: 6, price: 32000, sku: 'NJ-RC-L', size: { id: 's3', name: 'L' } },
    ],
  },
];

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query params
  const categorySlug = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const colorId = searchParams.get('colorId') || '';
  const sizeId = searchParams.get('sizeId') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const onSale = searchParams.get('onSale') === 'true';
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const sortBy = (searchParams.get('sortBy') as any) || 'newest';
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;

  // Local search input buffer
  const [searchInput, setSearchInput] = useState(search);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Fetch reference filters data
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
  });

  const { data: colors = [] } = useQuery({
    queryKey: ['colors'],
    queryFn: () => productService.getColors(),
  });

  const { data: sizes = [] } = useQuery({
    queryKey: ['sizes'],
    queryFn: () => productService.getSizes(),
  });

  const selectedCategoryObj = categories.find((c) => c.slug === categorySlug);

  // Fetch Products with active filters
  const { data: productsData, isLoading } = useQuery({
    queryKey: [
      'shop-products',
      categorySlug,
      selectedCategoryObj?.id,
      search,
      colorId,
      sizeId,
      inStock,
      onSale,
      minPrice,
      maxPrice,
      sortBy,
      page,
    ],
    queryFn: () =>
      productService.getProducts({
        categoryId: selectedCategoryObj?.id,
        search: search || undefined,
        colorId: colorId || undefined,
        sizeId: sizeId || undefined,
        inStock: inStock ? true : undefined,
        onSale: onSale ? true : undefined,
        minPrice,
        maxPrice,
        sortBy,
        page,
        limit: 12,
      }),
  });

  // Resilient products list
  const activeProducts =
    productsData?.data && productsData.data.length > 0
      ? productsData.data
      : defaultCatalogItems.filter((p) => {
          if (categorySlug) {
            const matchCat =
              (p.categoryId && p.categoryId.toLowerCase().includes(categorySlug.toLowerCase())) ||
              p.slug.toLowerCase().includes(categorySlug.toLowerCase());
            if (!matchCat) return false;
          }
          if (search) {
            const s = search.toLowerCase();
            const matchSearch = p.name.toLowerCase().includes(s) || p.slug.toLowerCase().includes(s);
            if (!matchSearch) return false;
          }
          if (colorId) {
            const hasColor = p.variants?.some((v: any) => v.color?.id === colorId);
            if (!hasColor) return false;
          }
          if (sizeId) {
            const hasSize = p.variants?.some((v: any) => v.size?.id === sizeId || v.size?.name === sizeId);
            if (!hasSize) return false;
          }
          if (onSale) {
            if (!p.oldPrice || Number(p.oldPrice) <= Number(p.price)) return false;
          }
          return true;
        });

  const totalCount = productsData?.meta?.total || activeProducts.length;

  const updateFilter = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === '' || value === 'false') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    // reset to page 1 on filter changes
    if (key !== 'page') {
      next.delete('page');
    }
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('search', searchInput.trim());
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchInput('');
  };

  const hasActiveFilters = Boolean(
    categorySlug || search || colorId || sizeId || inStock || onSale || minPrice || maxPrice
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> Boutique Naja Dakar
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-slate-900 mt-1">
            {selectedCategoryObj
              ? selectedCategoryObj.name
              : search
              ? `Résultats pour "${search}"`
              : onSale
              ? 'Offres & Promotions Spéciales'
              : 'Toutes les Créations'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {totalCount} modèle(s) trouvé(s)
          </p>
        </div>

        {/* Sort selector & Mobile filter toggle */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-600" />
            Filtres
          </button>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <span className="text-xs text-slate-400 font-medium">Trier par :</span>
            <select
              value={sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="newest">Plus récents</option>
              <option value="popular">Plus populaires</option>
              <option value="price_asc">Prix croissant (FCFA)</option>
              <option value="price_desc">Prix décroissant (FCFA)</option>
              <option value="name">Nom (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Filters Sidebar (Desktop & Mobile Drawer) */}
        <aside
          className={`lg:col-span-3 space-y-6 ${
            showMobileFilters
              ? 'block fixed inset-0 z-50 bg-white p-6 overflow-y-auto'
              : 'hidden lg:block'
          }`}
        >
          {showMobileFilters && (
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 lg:hidden">
              <h2 className="font-display font-bold text-lg text-slate-900">Filtres du Catalogue</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Search Box */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Recherche
            </h3>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Ex: Bazin, Robe, Sac..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </form>
          </div>

          {/* Category Facet */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Catégories
            </h3>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => updateFilter('category', null)}
                className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                  !categorySlug
                    ? 'bg-amber-50 text-amber-900 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Toutes les catégories</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateFilter('category', cat.slug)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                    categorySlug === cat.slug
                      ? 'bg-amber-50 text-amber-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat._count && (
                    <span className="text-[10px] text-slate-400">({cat._count.products})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Colors Filter */}
          {colors.length > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Couleurs
                </h3>
                {colorId && (
                  <button
                    onClick={() => updateFilter('colorId', null)}
                    className="text-[10px] text-amber-700 font-bold hover:underline"
                  >
                    Effacer
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => {
                  const isSelected = colorId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => updateFilter('colorId', isSelected ? null : c.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold ring-1 ring-amber-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sizes Filter */}
          {sizes.length > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Tailles
                </h3>
                {sizeId && (
                  <button
                    onClick={() => updateFilter('sizeId', null)}
                    className="text-[10px] text-amber-700 font-bold hover:underline"
                  >
                    Effacer
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sizes.map((s) => {
                  const isSelected = sizeId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => updateFilter('sizeId', isSelected ? null : s.id)}
                      className={`min-w-[38px] h-8 px-2 rounded-lg border text-xs font-semibold transition-all ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Availability & Promo Toggles */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Disponibilité & Offres
            </h3>
            <div className="space-y-2.5 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => updateFilter('inStock', e.target.checked ? 'true' : null)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <span>En stock uniquement</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onSale}
                  onChange={(e) => updateFilter('onSale', e.target.checked ? 'true' : null)}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                />
                <span className="font-semibold text-rose-700">En promotion / Prix réduit</span>
              </label>
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="w-full text-xs"
            >
              Réinitialiser tous les filtres
            </Button>
          )}

          {showMobileFilters && (
            <Button
              variant="gold"
              className="w-full"
              onClick={() => setShowMobileFilters(false)}
            >
              Appliquer les filtres
            </Button>
          )}
        </aside>

        {/* Right Products Catalog Grid */}
        <main className="lg:col-span-9 space-y-8">
          {/* Active Filter Pills Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
              <span className="text-xs text-slate-400">Filtres actifs :</span>
              {categorySlug && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  Catégorie : {selectedCategoryObj?.name || categorySlug}
                  <button onClick={() => updateFilter('category', null)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                  « {search} »
                  <button onClick={() => updateFilter('search', null)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {colorId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                  Couleur : {colors.find((c) => c.id === colorId)?.name}
                  <button onClick={() => updateFilter('colorId', null)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {sizeId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                  Taille : {sizes.find((s) => s.id === sizeId)?.name}
                  <button onClick={() => updateFilter('sizeId', null)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {inStock && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800">
                  En stock
                  <button onClick={() => updateFilter('inStock', null)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {onSale && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800">
                  En promotion
                  <button onClick={() => updateFilter('onSale', null)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-rose-600 font-bold hover:underline ml-1"
              >
                Tout effacer
              </button>
            </div>
          )}

          {/* Products Grid */}
          {isLoading ? (
            <div className="py-24">
              <Spinner size="lg" />
            </div>
          ) : activeProducts.length > 0 ? (
            <div className="space-y-10">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3.5 sm:gap-6">
                {activeProducts.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
              </div>

              {/* Pagination Controls */}
              {productsData?.meta && productsData.meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                  <p className="text-xs text-slate-500">
                    Page <strong>{productsData.meta.page}</strong> sur{' '}
                    <strong>{productsData.meta.totalPages}</strong> (
                    {productsData.meta.total} articles)
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={productsData.meta.page <= 1}
                      onClick={() => updateFilter('page', String(productsData.meta.page - 1))}
                      leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                    >
                      Précédent
                    </Button>

                    <div className="flex gap-1">
                      {Array.from({ length: productsData.meta.totalPages }, (_, i) => i + 1).map(
                        (pNum) => (
                          <button
                            key={pNum}
                            onClick={() => updateFilter('page', String(pNum))}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                              pNum === productsData.meta.page
                                ? 'bg-slate-900 text-white'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {pNum}
                          </button>
                        )
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={productsData.meta.page >= productsData.meta.totalPages}
                      onClick={() => updateFilter('page', String(productsData.meta.page + 1))}
                      rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <Search className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h3 className="font-display font-bold text-slate-800 text-lg">
                  Aucun article ne correspond à vos critères
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Essayez d'élargir votre recherche, de décocher certains filtres de couleur ou de taille.
                </p>
              </div>
              <Button variant="gold" size="sm" onClick={clearAllFilters}>
                Réinitialiser la recherche
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
