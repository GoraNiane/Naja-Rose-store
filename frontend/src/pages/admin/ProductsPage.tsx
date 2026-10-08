import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../services/product.service';
import { formatCFA } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Plus, Search, Edit3, Trash2, ExternalLink, Package } from 'lucide-react';

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

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
        limit: 50,
      }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-list'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le produit "${name}" ?`)) {
      deleteProductMutation.mutate(id);
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
            Gestion des Produits & Variantes
          </h1>
          <p className="text-xs text-[#77706D] mt-1">
            Gérez votre catalogue de mode Naja Rose, photos et stocks par taille / couleur
          </p>
        </div>
        <Link to="/admin/products/new">
          <Button
            variant="gold"
            className="bg-[#8B3A4A] hover:bg-[#772F3E] text-white rounded-full px-5 py-2.5 text-xs font-semibold shadow-xs"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nouveau Produit
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-[#E9E2DF] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-[#77706D] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom ou référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF9F7] border border-[#E9E2DF] rounded-2xl text-xs text-[#171717] focus:bg-white focus:outline-none focus:border-[#D8A7A7]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto bg-[#FAF9F7] border border-[#E9E2DF] rounded-2xl px-3.5 py-2 text-xs text-[#171717] font-medium focus:outline-none focus:border-[#D8A7A7] cursor-pointer"
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
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : productsData?.data && productsData.data.length > 0 ? (
        <div className="bg-white rounded-3xl border border-[#E9E2DF] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F7] border-b border-[#E9E2DF] text-[#77706D] font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-6">Article</th>
                  <th className="py-3.5 px-6">Catégorie</th>
                  <th className="py-3.5 px-6">Prix Vente</th>
                  <th className="py-3.5 px-6">Photos</th>
                  <th className="py-3.5 px-6">Variantes & Stock Total</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF5F4]">
                {productsData.data.map((product) => {
                  const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
                  const primaryImg =
                    product.images.find((img) => img.isPrimary)?.url ||
                    product.images[0]?.url ||
                    '';

                  return (
                    <tr key={product.id} className="hover:bg-[#FAF9F7]/70 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={primaryImg}
                            alt=""
                            className="w-12 h-14 rounded-2xl object-cover bg-[#F4EEE8] border border-[#E9E2DF] shadow-2xs"
                          />
                          <div>
                            <p className="font-bold text-[#171717] text-sm">{product.name}</p>
                            <p className="text-[#77706D] text-[11px] font-mono">
                              Slug: {product.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-[#77706D] font-medium">
                        {product.category?.name || 'Général'}
                      </td>

                      <td className="py-4 px-6 font-serif font-bold text-[#171717] text-sm">
                        {formatCFA(product.price)}
                        {product.oldPrice && (
                          <span className="block text-[11px] text-[#77706D] line-through font-normal">
                            {formatCFA(product.oldPrice)}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-[#171717]">
                            {product.images.length} / 7
                          </span>
                          <span className="text-[10px] text-[#77706D]">photos</span>
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
                            {totalStock} pièces en stock
                          </span>
                          <p className="text-[10px] text-[#77706D]">
                            {product.variants.length} variante(s)
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/product/${product.slug}`}
                            target="_blank"
                            className="p-2 rounded-xl text-[#77706D] hover:text-[#171717] hover:bg-[#FAF9F7] transition-colors"
                            title="Voir en boutique"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/products/edit/${product.id}`}
                            className="p-2 rounded-xl text-[#8B3A4A] hover:bg-[#FAF5F4] transition-colors"
                            title="Modifier le produit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Supprimer"
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
            <h3 className="text-base font-bold text-[#171717]">Aucun produit au catalogue</h3>
            <p className="text-xs text-[#77706D] mt-1">
              Commencez par ajouter votre premier modèle ou modifiez vos critères de recherche.
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
    </div>
  );
}
