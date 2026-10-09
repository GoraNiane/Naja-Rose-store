import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { Spinner } from '../components/ui/Spinner';
import { ArrowRight, Layers } from 'lucide-react';

export function CategoriesPage() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories-page'],
    queryFn: () => productService.getCategories(),
  });

  const staticCategories = [
    {
      id: 'cat-tops',
      name: 'Tops & T-shirts',
      slug: 'tops-t-shirts',
      imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
      description: 'Hauts tendance, coupes ajustées et tissus légers pour toutes vos sorties.',
    },
    {
      id: 'cat-robes',
      name: 'Robes',
      slug: 'robes',
      imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
      description: 'Robes longues fluides, coupes sirènes et modèles chics pour vos événements.',
    },
    {
      id: 'cat-ensembles',
      name: 'Ensembles',
      slug: 'ensembles',
      imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
      description: 'Ensembles 3 pièces harmonieux, tailleurs modernes et tenues coordonnées.',
    },
    {
      id: 'cat-pantalons',
      name: 'Pantalons',
      slug: 'pantalons',
      imageUrl: 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&w=600&q=80',
      description: 'Pantalons palazzo, coupes droites et modèles taille haute confortables.',
    },
    {
      id: 'cat-vestes',
      name: 'Vestes & Manteaux',
      slug: 'vestes-manteaux',
      imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80',
      description: 'Blazers cintrés, vestes de tailleur et pièces élégantes de mi-saison.',
    },
    {
      id: 'cat-jupes',
      name: 'Jupes',
      slug: 'jupes',
      imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80',
      description: 'Jupes plissées, jupes crayons et coupes évasées ultra féminines.',
    },
  ];

  const categoryList = categories && categories.length > 0 ? categories : staticCategories;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-2.5">
        <span className="text-[11px] sm:text-xs font-bold text-[#8B3A4A] uppercase tracking-widest">
          COLLECTIONS & UNIVERS
        </span>
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-serif italic text-[#2C1E21]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Toutes nos Catégories
        </h1>
        <p className="text-xs sm:text-sm text-[#644D52] leading-relaxed">
          Découvrez nos sélections de prêt-à-porter et créations raffinées à Dakar. Des coupes impeccables pensées pour sublimer votre allure.
        </p>
      </div>

      {isLoading ? (
        <div className="py-16">
          <Spinner size="lg" />
        </div>
      ) : categoryList && categoryList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
          {categoryList.map((cat: any) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group relative h-64 sm:h-80 md:h-96 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xs hover:shadow-luxury-hover transition-all duration-500 block border border-[#F2E5E2]"
            >
              <img
                src={
                  cat.imageUrl ||
                  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80'
                }
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1819]/85 via-[#1C1819]/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white space-y-1 sm:space-y-2">
                <span className="inline-block text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-widest bg-white/20 backdrop-blur-xs px-2 sm:px-2.5 py-0.5 rounded-full border border-white/20">
                  {cat._count?.products || 'Collection'}
                </span>
                <h2
                  className="font-serif italic text-lg sm:text-2xl text-white group-hover:text-[#F2C7C4] transition-colors leading-tight"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="text-[11px] sm:text-xs text-white/80 line-clamp-2 leading-relaxed hidden sm:block">
                    {cat.description}
                  </p>
                )}
                <div className="pt-1 flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#F2C7C4] group-hover:translate-x-1 transition-transform">
                  <span>Explorer</span>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#F2E5E2] space-y-3">
          <Layers className="w-12 h-12 text-[#A0888E] mx-auto" />
          <h3 className="font-bold text-[#2C1E21] text-base">Aucune catégorie répertoriée</h3>
        </div>
      )}
    </div>
  );
}
