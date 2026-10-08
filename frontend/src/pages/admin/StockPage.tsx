import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService, StockMovementPayload } from '../../services/product.service';
import { formatCFA, formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Layers, ArrowUpDown, History, Search, Check } from 'lucide-react';

export function StockPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Quick Movement Modal state
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [movementType, setMovementType] = useState<StockMovementPayload['type']>('STOCK_IN');
  const [movementQty, setMovementQty] = useState<number>(5);
  const [movementReason, setMovementReason] = useState<string>('Réassort atelier Dakar');
  const [movementRef, setMovementRef] = useState<string>('REASSORT-2026');
  const [movementSuccess, setMovementSuccess] = useState(false);

  // Fetch Inventory
  const { data: stockItems, isLoading: isLoadingStock } = useQuery({
    queryKey: ['admin-stock', search, lowStockOnly],
    queryFn: () => productService.getStock({ search: search || undefined, lowStock: lowStockOnly }),
  });

  // Fetch Movement History
  const { data: movementsData, isLoading: isLoadingMovements } = useQuery({
    queryKey: ['admin-stock-movements'],
    queryFn: () => productService.getStockMovements(),
    enabled: activeTab === 'movements',
  });

  // Stock Movement Mutation
  const updateStockMutation = useMutation({
    mutationFn: (data: { variantId: string; payload: StockMovementPayload }) =>
      productService.updateStock(data.variantId, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stock'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stock-movements'] });
      setMovementSuccess(true);
      setTimeout(() => {
        setMovementSuccess(false);
        setSelectedVariant(null);
      }, 1500);
    },
  });

  const handleApplyMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    updateStockMutation.mutate({
      variantId: selectedVariant.id,
      payload: {
        type: movementType,
        quantity: Number(movementQty),
        reason: movementReason,
        reference: movementRef,
      },
    });
  };

  // Group variants by product for Matrix display
  const groupedByProduct = stockItems
    ? stockItems.reduce((acc: Record<string, { product: any; variants: any[] }>, item: any) => {
        const prodId = item.productId;
        if (!acc[prodId]) {
          acc[prodId] = {
            product: item.product,
            variants: [],
          };
        }
        acc[prodId].variants.push(item);
        return acc;
      }, {})
    : {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E9E2DF] pb-6">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-serif italic font-bold text-[#171717]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Gestion des Stocks & Inventaire
          </h1>
          <p className="text-xs text-[#77706D] mt-1">
            Suivi en temps réel des stocks par variante (Couleur × Taille) et traçabilité des mouvements
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#FAF9F7] border border-[#E9E2DF] p-1 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'bg-[#171717] text-white shadow-xs'
                : 'text-[#77706D] hover:text-[#171717]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> État des Stocks
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'movements'
                ? 'bg-[#171717] text-white shadow-xs'
                : 'text-[#77706D] hover:text-[#171717]'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Historique des Mouvements
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-[#E9E2DF] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-sm">
              <Search className="w-4 h-4 text-[#77706D] absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher par modèle ou SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#FAF9F7] border border-[#E9E2DF] rounded-2xl text-xs text-[#171717] focus:bg-white focus:outline-none focus:border-[#D8A7A7]"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#171717] select-none">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="w-4 h-4 text-[#8B3A4A] rounded focus:ring-[#8B3A4A]"
              />
              <span>Afficher uniquement les alertes stock faible (≤ 5 pièces)</span>
            </label>
          </div>

          {/* Stock Legend */}
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-[#77706D]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Stock Normal (&gt; 5)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-[#77706D]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D8A7A7] inline-block" />
              Stock Faible (1 - 5)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-[#77706D]">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              Rupture de Stock (0)
            </span>
          </div>

          {/* Grouped Product Matrix */}
          {isLoadingStock ? (
            <div className="py-20 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : Object.keys(groupedByProduct).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedByProduct).map(([prodId, { product, variants }]) => {
                const totalStock = variants.reduce((acc, v) => acc + v.stock, 0);

                return (
                  <div
                    key={prodId}
                    className="bg-white rounded-3xl border border-[#E9E2DF] shadow-2xs overflow-hidden"
                  >
                    <div className="p-5 bg-[#FAF9F7] border-b border-[#E9E2DF] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B3A4A]">
                          {product.category?.name || 'Collection Naja'}
                        </span>
                        <h3 className="font-serif italic font-bold text-base text-[#171717]">
                          {product.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-[#77706D]">
                          Prix : {formatCFA(product.price)}
                        </span>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full border ${
                            totalStock > 5
                              ? 'bg-[#ECFDF5] text-[#047857] border-[#D1FAE5]'
                              : totalStock > 0
                              ? 'bg-[#FAF5F5] text-[#8B3A4A] border-[#E8CFCF]'
                              : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                          }`}
                        >
                          Total : {totalStock} pièces
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#FAF9F7]/50 border-b border-[#E9E2DF] text-[#77706D] font-semibold text-[11px] uppercase tracking-wider">
                            <th className="py-3 px-6">SKU</th>
                            <th className="py-3 px-6">Couleur</th>
                            <th className="py-3 px-6">Taille</th>
                            <th className="py-3 px-6">Stock Disponible</th>
                            <th className="py-3 px-6">État</th>
                            <th className="py-3 px-6 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#FAF5F4]">
                          {variants.map((v: any) => {
                            const isZero = v.stock === 0;
                            const isLow = v.stock > 0 && v.stock <= 5;

                            return (
                              <tr key={v.id} className="hover:bg-[#FAF9F7]/70 transition-colors">
                                <td className="py-3.5 px-6 font-mono font-bold text-[#171717]">
                                  {v.sku}
                                </td>
                                <td className="py-3.5 px-6">
                                  {v.color ? (
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="w-3.5 h-3.5 rounded-full border border-black/10"
                                        style={{ backgroundColor: v.color.hex }}
                                      />
                                      <span className="font-medium text-[#171717]">
                                        {v.color.name}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[#77706D]">Standard</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-6 font-bold text-[#171717]">
                                  {v.size?.name || 'Taille Unique'}
                                </td>
                                <td className="py-3.5 px-6">
                                  <span className="text-sm font-bold font-serif text-[#171717]">
                                    {v.stock}
                                  </span>
                                </td>
                                <td className="py-3.5 px-6">
                                  {isZero ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                                      Rupture
                                    </span>
                                  ) : isLow ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF5F5] text-[#8B3A4A] border border-[#E8CFCF]">
                                      Stock Faible ({v.stock} restant)
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#047857] border border-[#D1FAE5]">
                                      Normal
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-6 text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedVariant(v)}
                                    className="rounded-xl border-[#E9E2DF] text-xs text-[#171717] hover:border-[#D8A7A7]"
                                    leftIcon={<ArrowUpDown className="w-3 h-3 text-[#8B3A4A]" />}
                                  >
                                    Ajuster
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-3xl border border-[#E9E2DF] text-xs text-[#77706D]">
              Aucune variante correspondant aux critères de recherche.
            </div>
          )}
        </div>
      ) : (
        /* Movements Audit History Tab */
        <div className="bg-white rounded-3xl border border-[#E9E2DF] shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-[#E9E2DF] flex items-center justify-between">
            <h3 className="font-serif italic font-bold text-sm text-[#171717]">
              Journal d'Audit des Mouvements de Stock
            </h3>
            <span className="text-xs text-[#77706D]">Prisma Atomic Transactions</span>
          </div>

          {isLoadingMovements ? (
            <div className="py-20 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : movementsData?.data && movementsData.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F7] border-b border-[#E9E2DF] text-[#77706D] font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-6">Date / Heure</th>
                    <th className="py-3 px-6">Article & Variante</th>
                    <th className="py-3 px-6">Type de Mouvement</th>
                    <th className="py-3 px-6">Quantité</th>
                    <th className="py-3 px-6">Motif</th>
                    <th className="py-3 px-6">Référence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAF5F4]">
                  {movementsData.data.map((m: any) => {
                    const isPositive = m.type === 'STOCK_IN' || m.type === 'RELEASE';

                    return (
                      <tr key={m.id} className="hover:bg-[#FAF9F7]/70 transition-colors">
                        <td className="py-3.5 px-6 font-mono text-[#77706D]">
                          {formatDate(m.createdAt)}
                        </td>
                        <td className="py-3.5 px-6">
                          <p className="font-bold text-[#171717]">
                            {m.variant?.product?.name || 'Produit'}
                          </p>
                          <p className="font-mono text-[10px] text-[#77706D]">
                            {m.variant?.sku} ({m.variant?.color?.name} / {m.variant?.size?.name})
                          </p>
                        </td>
                        <td className="py-3.5 px-6">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              m.type === 'STOCK_IN'
                                ? 'bg-[#ECFDF5] text-[#047857] border-[#D1FAE5]'
                                : m.type === 'STOCK_OUT'
                                ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                                : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-bold text-sm">
                          <span className={isPositive ? 'text-[#047857]' : 'text-[#991B1B]'}>
                            {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-[#77706D]">{m.reason || '—'}</td>
                        <td className="py-3.5 px-6 font-mono text-[#77706D]">
                          {m.reference || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-[#77706D]">
              Aucun mouvement de stock enregistré.
            </div>
          )}
        </div>
      )}

      {/* Quick Movement Modal */}
      {selectedVariant && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E9E2DF] shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B3A4A]">
                Ajustement Manuel de Stock
              </span>
              <h3 className="font-serif italic text-lg font-bold text-[#171717] mt-1">
                {selectedVariant.product?.name}
              </h3>
              <p className="text-xs text-[#77706D] mt-0.5">
                SKU: {selectedVariant.sku} • {selectedVariant.color?.name} •{' '}
                {selectedVariant.size?.name}
              </p>
            </div>

            {movementSuccess && (
              <div className="p-3 bg-[#ECFDF5] border border-[#D1FAE5] rounded-2xl text-xs text-[#047857] flex items-center gap-2">
                <Check className="w-4 h-4" /> Mouvement de stock enregistré avec succès !
              </div>
            )}

            <form onSubmit={handleApplyMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">
                  Type d'opération
                </label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#E9E2DF] rounded-2xl text-xs text-[#171717] font-medium outline-none focus:border-[#D8A7A7]"
                >
                  <option value="STOCK_IN">Entrée de Stock (STOCK_IN / Réassort atelier)</option>
                  <option value="STOCK_OUT">Sortie Manuelle (STOCK_OUT / Perte, défaut)</option>
                  <option value="CORRECTION">Correction d'Inventaire (CORRECTION)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">Quantité</label>
                <input
                  type="number"
                  min="1"
                  value={movementQty}
                  onChange={(e) => setMovementQty(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#E9E2DF] rounded-2xl text-xs text-[#171717] font-bold outline-none focus:border-[#D8A7A7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">Motif</label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="Ex: Réassort atelier Dakar"
                  className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#E9E2DF] rounded-2xl text-xs text-[#171717] outline-none focus:border-[#D8A7A7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">
                  Référence Bon / Facture
                </label>
                <input
                  type="text"
                  value={movementRef}
                  onChange={(e) => setMovementRef(e.target.value)}
                  placeholder="Ex: BON-ATELIER-2026-01"
                  className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#E9E2DF] rounded-2xl text-xs text-[#171717] outline-none focus:border-[#D8A7A7]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setSelectedVariant(null)}
                  className="flex-1 rounded-full border-[#E9E2DF] text-xs text-[#171717]"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="md"
                  isLoading={updateStockMutation.isPending}
                  className="flex-1 bg-[#8B3A4A] hover:bg-[#772F3E] text-white rounded-full text-xs font-semibold shadow-xs"
                >
                  Valider le Mouvement
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
