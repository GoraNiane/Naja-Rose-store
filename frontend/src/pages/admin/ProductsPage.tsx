import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../services/product.service';
import { formatCFA } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Package,
  AlertTriangle,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Product } from '../../types';

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-products-list', search, selectedCategory],
    queryFn: () =>
      productService.getProducts({
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        limit: 100,
      }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-list'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stock'] });
      setFeedbackNotice({
        type: 'success',
        message: `Le produit "${productToDelete?.name}" a été supprimé avec succès.`,
      });
      setProductToDelete(null);
      setTimeout(() => setFeedbackNotice(null), 4000);
    },
    onError: (err: any) => {
      setFeedbackNotice({
        type: 'error',
        message: err.message || 'Impossible de supprimer ce produit. Veuillez réessayer.',
      });
      setProductToDelete(null);
      setTimeout(() => setFeedbackNotice(null), 5000);
    },
  });

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E9E2DF] pb-6">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-serif italic font-bold text-[#171717]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Gestion des Produits & Modèles
          </h1>
          <p className="text-xs text-[#77706D] mt-1">
            Gérez votre catalogue Naja Rose Store : création, modification, suppression et variantes de couleurs/tailles
          </p>
        </div>
        <Link to="/admin/products/new">
          <Button
            variant="gold"
            className="bg-[#8B3A4A] hover:bg-[#772F3E] text-white rounded-full px-5 py-2.5 text-xs font-semibold shadow-xs flex items-center gap-1.5"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nouveau Produit
          </Button>
        </Link>
      </div>

      {/* Feedback Toast Notice */}
      {feedbackNotice && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium ${
            feedbackNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="p-1 hover:opacity-70 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E9E2DF] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-[#77706D] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom, couleur, taille ou slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-[#FAF9F7] border border-[#E9E2DF] rounded-2xl text-xs text-[#171717] focus:bg-white focus:outline-none focus:border-[#8B3A4A] focus:ring-2 focus:ring-[#8B3A4A]/10 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-[#77706D] hover:text-[#171717] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto bg-[#FAF9F7] border border-[#E9E2DF] rounded-2xl px-4 py-2.5 text-xs text-[#171717] font-medium focus:outline-none focus:border-[#8B3A4A] cursor-pointer"
          >
            <option value="">Toutes les catégories</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs text-[#77706D]">Chargement du catalogue...</p>
        </div>
      ) : productsData?.data && productsData.data.length > 0 ? (
        <div className="bg-white rounded-3xl border border-[#E9E2DF] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F7] border-b border-[#E9E2DF] text-[#77706D] font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-4 px-6">Modèle / Article</th>
                  <th className="py-4 px-6">Catégorie</th>
                  <th className="py-4 px-6">Prix de Vente</th>
                  <th className="py-4 px-6">Couleurs & Tailles</th>
                  <th className="py-4 px-6">Stock Global</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF5F4]">
                {productsData.data.map((product) => {
                  const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
                  const primaryImg =
                    product.images.find((img) => img.isPrimary)?.url ||
                    product.images[0]?.url ||
                    '';

                  // Extract unique colors & sizes for quick badge display
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

                  return (
                    <tr key={product.id} className="hover:bg-[#FAF9F7]/70 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={primaryImg}
                            alt=""
                            className="w-12 h-14 rounded-2xl object-cover bg-[#F4EEE8] border border-[#E9E2DF] shadow-2xs shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-[#171717] text-sm truncate max-w-xs">
                              {product.name}
                            </p>
                            <p className="text-[#77706D] text-[11px] font-mono">
                              /{product.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-[#77706D] font-medium">
                        <span className="px-2.5 py-1 rounded-lg bg-[#FAF0EE] text-[#8B3A4A] font-semibold text-[11px] border border-[#F2E5E2]">
                          {product.category?.name || 'Général'}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-serif font-bold text-[#171717] text-sm block">
                          {formatCFA(product.price)}
                        </span>
                        {product.oldPrice && (
                          <span className="text-[11px] text-[#77706D] line-through font-normal block">
                            {formatCFA(product.oldPrice)}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {/* Colors Swatches */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {uniqueColors.slice(0, 5).map((col) => (
                              <span
                                key={col.id}
                                className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs inline-block"
                                style={{ backgroundColor: col.hex }}
                                title={col.name}
                              />
                            ))}
                            {uniqueColors.length > 5 && (
                              <span className="text-[10px] text-[#77706D] font-bold">
                                +{uniqueColors.length - 5}
                              </span>
                            )}
                          </div>

                          {/* Sizes Badges */}
                          <div className="flex items-center gap-1 flex-wrap text-[10px] text-[#644D52]">
                            {uniqueSizes.map((sz) => (
                              <span key={sz.id} className="px-1.5 py-0.5 rounded bg-slate-100 font-bold">
                                {sz.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              totalStock > 5
                                ? 'bg-[#ECFDF5] text-[#047857] border-[#D1FAE5]'
                                : totalStock > 0
                                ? 'bg-[#FAF5F5] text-[#8B3A4A] border-[#E8CFCF]'
                                : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                            }`}
                          >
                            {totalStock} pcs en stock
                          </span>
                          <p className="text-[10px] text-[#77706D]">
                            {product.variants.length} combinaison(s)
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/product/${product.slug}`}
                            target="_blank"
                            className="p-2 rounded-xl text-[#77706D] hover:text-[#171717] hover:bg-[#FAF0EE] transition-colors"
                            title="Voir la fiche en boutique"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/products/edit/${product.id}`}
                            className="p-2 rounded-xl text-[#8B3A4A] hover:bg-[#FAF0EE] transition-colors"
                            title="Modifier ce produit (Nom, Prix, Variantes, Photos)"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Supprimer définitivement ce produit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E9E2DF] space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FAF5F4] border border-[#E8CFCF] text-[#8B3A4A] flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#171717]">Aucun produit trouvé</h3>
            <p className="text-xs text-[#77706D] mt-1">
              Modifiez vos termes de recherche ou créez un nouveau modèle.
            </p>
          </div>
          <Link to="/admin/products/new">
            <Button
              variant="gold"
              size="sm"
              className="bg-[#8B3A4A] hover:bg-[#772F3E] text-white rounded-full px-4"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Ajouter un Produit
            </Button>
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl border border-[#F2E5E2]">
            <div className="flex items-center justify-between border-b border-[#F4E2E0] pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-serif italic font-bold text-base text-[#2C1E21]">
                  Confirmation de Suppression
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="p-1 rounded-full text-[#7A6469] hover:bg-[#FAF0EE] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#FAF9F7] border border-[#E9E2DF]">
              <img
                src={
                  productToDelete.images.find((i) => i.isPrimary)?.url ||
                  productToDelete.images[0]?.url ||
                  ''
                }
                alt=""
                className="w-14 h-16 rounded-xl object-cover bg-white border border-[#E9E2DF] shrink-0"
              />
              <div className="min-w-0">
                <p className="font-bold text-sm text-[#2C1E21] truncate">{productToDelete.name}</p>
                <p className="text-xs text-[#8B3A4A] font-bold">{formatCFA(productToDelete.price)}</p>
                <p className="text-[11px] text-[#7A6469]">
                  {productToDelete.variants.length} variante(s) associée(s)
                </p>
              </div>
            </div>

            <p className="text-xs text-[#644D52] leading-relaxed">
              Êtes-vous certain de vouloir supprimer définitivement le produit{' '}
              <strong>« {productToDelete.name} »</strong> ? Toutes ses variantes, photos et stocks associés seront retirés du catalogue.
            </p>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={deleteProductMutation.isPending}
                onClick={() => setProductToDelete(null)}
              >
                Annuler
              </Button>
              <button
                type="button"
                disabled={deleteProductMutation.isPending}
                onClick={confirmDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl py-3 px-4 text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleteProductMutation.isPending ? (
                  <span>Suppression en cours...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer Définitivement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
