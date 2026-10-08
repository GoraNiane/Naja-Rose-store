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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
          Collections Haute Couture
        </span>
        <h1 className="text-3xl sm:text-4xl font-black font-display text-slate-900">
          Nos Univers & Catégories
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Explorez l'artisanat et la création sénégalaise à travers nos lignes exclusives de grands boubous, prêt-à-porter wax et maroquinerie d'art.
        </p>
      </div>

      {isLoading ? (
        <Spinner size="lg" />
      ) : categories && categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group relative h-96 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 block border border-slate-100"
            >
              <img
                src={
                  cat.imageUrl ||
                  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80'
                }
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-400/30">
                  {cat._count?.products || 0} modèles disponibles
                </span>
                <h2 className="font-display font-black text-2xl text-white group-hover:text-amber-300 transition-colors">
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                )}
                <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                  <span>Découvrir la collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 space-y-3">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-base">Aucune catégorie répertoriée</h3>
        </div>
      )}
    </div>
  );
}
