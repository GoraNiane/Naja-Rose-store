import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { ProductCard } from '../components/common/ProductCard';
import { Spinner } from '../components/ui/Spinner';
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Headphones,
  Sparkles,
  Heart,
} from 'lucide-react';

export function HomePage() {
  // Query popular products from API
  const { data: popularData, isLoading: isPopularLoading } = useQuery({
    queryKey: ['popular-products'],
    queryFn: () => productService.getProducts({ sortBy: 'popular', limit: 10 }),
  });

  // Static 6 Categories from the Reference Design
  const collections = [
    {
      id: 'tops-t-shirts',
      name: 'Tops & T-shirts',
      slug: 'tops-t-shirts',
      imageUrl:
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'robes',
      name: 'Robes',
      slug: 'robes',
      imageUrl:
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'ensembles',
      name: 'Ensembles',
      slug: 'ensembles',
      imageUrl:
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'pantalons',
      name: 'Pantalons',
      slug: 'pantalons',
      imageUrl:
        'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'vestes-manteaux',
      name: 'Vestes & Manteaux',
      slug: 'vestes-manteaux',
      imageUrl:
        'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'jupes',
      name: 'Jupes',
      slug: 'jupes',
      imageUrl:
        'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80',
    },
  ];

  // Reference fallback popular items matching exact boutique aesthetics from reference
  const referencePopularItems = [
    {
      id: 'prod-bonnet',
      name: 'Bonnet en satin de soie',
      slug: 'bonnet-en-satin-de-soie',
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
      price: 10000,
      oldPrice: null,
      images: [
        {
          id: 'img-s1',
          url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
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
      price: 10000,
      oldPrice: null,
      images: [
        {
          id: 'img-d1',
          url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
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
      price: 10000,
      oldPrice: null,
      images: [
        {
          id: 'img-l1',
          url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80',
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
      price: 35000,
      oldPrice: 42000,
      images: [
        {
          id: 'img-r1',
          url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
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
      price: 45000,
      oldPrice: 55000,
      images: [
        {
          id: 'img-t1',
          url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
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
  ];

  const popularList =
    popularData?.data && popularData.data.length >= 4
      ? popularData.data
      : referencePopularItems;

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* --------------------------------------------------------------------- */}
      {/* 1. HERO SECTION (Exact reproduction from reference design)             */}
      {/* --------------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-[#FAF2F0] border-b border-[#F4E2E0] min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] flex items-center">
        {/* Right side exact boutique interior photograph */}
        <div className="absolute inset-y-0 right-0 w-full md:w-3/5 lg:w-7/12 z-0">
          <img
            src="/images/hero-boutique.jpg"
            alt="Naja Rose Store Boutique Intérieur Dakar"
            className="w-full h-full object-cover object-center md:object-right"
          />
          {/* Seamless gradient fade from left blush pink to boutique photo */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF2F0] via-[#FAF2F0]/85 to-transparent sm:w-1/2" />
        </div>

        {/* Hero Left Content Overlay */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
          <div className="max-w-lg lg:max-w-xl space-y-4 sm:space-y-6">
            {/* Tagline Small Caps */}
            <p className="text-[11px] sm:text-xs font-bold tracking-[0.25em] text-[#644D52] uppercase">
              MODE &nbsp;•&nbsp; ÉLÉGANCE &nbsp;•&nbsp; STYLE
            </p>

            {/* Main Brand Title & Pill */}
            <div className="space-y-2">
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-serif italic text-[#2C1E21] tracking-tight leading-none"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Naja Rose Store
              </h1>
              <div className="inline-block">
                <span className="bg-[#382B2F] text-white text-[10px] sm:text-xs font-medium px-3.5 py-1 rounded-full tracking-wide shadow-sm">
                  Elegance Style Garanties
                </span>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#3F2B30] font-normal leading-relaxed max-w-md">
              Des vêtements qui révèlent la meilleure version de vous.
            </p>

            {/* Hero CTA Button (Exact Dusty Rose / Terracotta Pill) */}
            <div className="pt-2">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-[#8B3A4A] hover:bg-[#772F3E] text-white px-7 py-3.5 rounded-full text-xs sm:text-sm font-medium shadow-md hover:shadow-lg transition-all transform active:scale-95"
              >
                <span>Découvrir la boutique</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 2. VALUE PROPOSITIONS BAR (4 Features from Reference)                 */}
      {/* --------------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-[#F4E2E0] shadow-sm py-6 px-6 sm:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FAF5F4] flex items-center justify-center text-[#8B3A4A] shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#2C1E21]">Livraison rapide</p>
              <p className="text-[11px] text-[#A0888E]">Partout au Sénégal</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FAF5F4] flex items-center justify-center text-[#8B3A4A] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#2C1E21]">Paiement sécurisé</p>
              <p className="text-[11px] text-[#A0888E]">Wave & Orange Money</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FAF5F4] flex items-center justify-center text-[#8B3A4A] shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#2C1E21]">Service client</p>
              <p className="text-[11px] text-[#A0888E]">À votre écoute</p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FAF5F4] flex items-center justify-center text-[#8B3A4A] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#2C1E21]">Qualité garantie</p>
              <p className="text-[11px] text-[#A0888E]">Des articles sélectionnés</p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 3. NOS CATÉGORIES — EXPLOREZ NOS COLLECTIONS (6 Cards)                */}
      {/* --------------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <span className="text-[11px] font-medium text-[#A0888E] uppercase tracking-wider block">
              —— Nos Catégories
            </span>
            <h2
              className="text-2xl sm:text-3xl font-serif font-bold text-[#2C1E21] mt-1"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Explorez nos collections
            </h2>
          </div>
          <Link
            to="/categories"
            className="text-xs font-medium text-[#644D52] hover:text-[#8B3A4A] flex items-center gap-1 group"
          >
            <span>Voir toutes les catégories</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 6 Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {collections.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#FAF5F4] border border-[#F4E2E0] shadow-sm hover:shadow-luxury-hover hover:-translate-y-1 transition-all duration-300 block"
            >
              <img
                src={cat.imageUrl}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

              {/* Bottom White Capsule CTA Button */}
              <div className="absolute bottom-3 left-3 right-3">
                <div className="w-full bg-white/95 backdrop-blur-sm group-hover:bg-white text-[#2C1E21] group-hover:text-[#8B3A4A] text-[11px] sm:text-xs font-medium py-1.5 px-2.5 rounded-full shadow-sm flex items-center justify-between transition-colors">
                  <span className="truncate">{cat.name}</span>
                  <ArrowRight className="w-3 h-3 shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 4. NOS COUPS DE CŒUR — PRODUITS POPULAIRES (Soft Pink Gradient Box)    */}
      {/* --------------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FDF0EE] rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#F5DCD8]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <span
                className="text-xs sm:text-sm font-serif italic text-[#8B3A4A] flex items-center gap-1.5"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                ✨ Nos coups de cœur
              </span>
              <h2
                className="text-2xl sm:text-3xl font-serif italic font-bold text-[#2C1E21] mt-0.5"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Produits populaires
              </h2>
              <p className="text-xs sm:text-sm text-[#644D52] mt-1">
                Les pièces préférées de nos clientes
              </p>
            </div>

            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 bg-white border border-[#F4E2E0] hover:border-[#8B3A4A] text-[#2C1E21] hover:text-[#8B3A4A] text-xs font-medium px-4 py-2 rounded-full shadow-sm transition-colors self-start sm:self-auto"
            >
              <span>Voir tout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 5 Product Cards Grid */}
          {isPopularLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4.5">
              {popularList.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 5. SIGNATURE & SLOGAN BANNER (From Bottom of Screenshot)              */}
      {/* --------------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FAF0EE] via-[#FDF5F4] to-[#F5DCD8] border border-[#F4E2E0] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          {/* Left: Brand name */}
          <div className="text-center md:text-left">
            <span
              className="text-3xl sm:text-4xl lg:text-5xl font-serif italic text-[#2C1E21]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Naja Rose Store
            </span>
          </div>

          {/* Center/Right: Handwritten Calligraphic Quote */}
          <div className="text-center md:text-right space-y-1">
            <p
              className="text-2xl sm:text-3xl lg:text-4xl text-[#382B2F] leading-tight"
              style={{ fontFamily: "'Caveat', 'Alex Brush', cursive" }}
            >
              Le style n'est pas un luxe,
              <br />
              c'est une attitude !
            </p>
            <div className="flex justify-center md:justify-end text-[#8B3A4A] pt-1">
              <Heart className="w-5 h-5 fill-current opacity-80" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
