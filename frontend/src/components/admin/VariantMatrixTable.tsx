import { useState } from 'react';
import { Color, Size } from '../../types';
import { formatCFA } from '../../lib/utils';
import { Sparkles, Plus, Minus, Check } from 'lucide-react';

export interface GeneratedVariant {
  colorId?: string | null;
  sizeId?: string | null;
  sku: string;
  stock: number;
  price?: number | null;
  isActive?: boolean;
}

interface VariantMatrixTableProps {
  productName: string;
  basePrice: number;
  selectedColors: Color[];
  selectedSizes: Size[];
  variants: GeneratedVariant[];
  onChange: (variants: GeneratedVariant[]) => void;
}

export function VariantMatrixTable({
  basePrice,
  selectedColors,
  selectedSizes,
  variants,
  onChange,
}: VariantMatrixTableProps) {
  const [bulkStockValue, setBulkStockValue] = useState<number>(10);
  const [appliedFeedback, setAppliedFeedback] = useState(false);

  // Helper to find variant
  const getVariant = (colorId?: string | null, sizeId?: string | null) => {
    return variants.find(
      (v) => (v.colorId || null) === (colorId || null) && (v.sizeId || null) === (sizeId || null)
    );
  };

  const updateStock = (colorId: string | null, sizeId: string | null, stock: number) => {
    const validStock = Math.max(0, isNaN(stock) ? 0 : stock);
    const updated = [...variants];
    const index = updated.findIndex(
      (v) => (v.colorId || null) === (colorId || null) && (v.sizeId || null) === (sizeId || null)
    );

    if (index > -1) {
      updated[index] = { ...updated[index], stock: validStock };
      onChange(updated);
    }
  };

  const applyBulkStock = () => {
    const validStock = Math.max(0, bulkStockValue || 0);
    const updated = variants.map((v) => ({ ...v, stock: validStock }));
    onChange(updated);
    setAppliedFeedback(true);
    setTimeout(() => setAppliedFeedback(false), 1500);
  };

  const totalUnits = variants.reduce((acc, v) => acc + (v.stock || 0), 0);

  const hasColors = selectedColors.length > 0;
  const hasSizes = selectedSizes.length > 0;

  // Case 1: No colors & no sizes (Single Standard Article)
  if (!hasColors && !hasSizes) {
    const singleVariant = variants[0];
    const currentStock = singleVariant?.stock ?? 0;

    return (
      <div className="bg-white p-6 rounded-3xl border border-[#E9E2DF] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FAF5F4] pb-4">
          <div>
            <h3 className="font-bold text-sm text-[#171717] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8B3A4A]" />
              Stock Initial de l'Article (Modèle Unique)
            </h3>
            <p className="text-xs text-[#77706D] mt-0.5">
              Aucune couleur ni taille sélectionnée. Indiquez la quantité totale disponible.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full shrink-0">
            Total en stock : {currentStock} pièces
          </span>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <div className="space-y-1.5 flex-1 max-w-xs">
            <label className="block text-xs font-semibold text-[#171717] uppercase tracking-wider">
              Nombre de pièces en stock
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateStock(null, null, currentStock - 1)}
                className="w-10 h-10 rounded-2xl bg-[#FAF9F7] hover:bg-[#F5DCD8] border border-[#E9E2DF] text-[#171717] font-bold flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => updateStock(null, null, parseInt(e.target.value, 10) || 0)}
                className="w-28 text-center py-2 px-3 rounded-2xl border border-[#E9E2DF] focus:border-[#8B3A4A] font-bold text-sm text-[#171717] outline-none shadow-inner"
              />
              <button
                type="button"
                onClick={() => updateStock(null, null, currentStock + 1)}
                className="w-10 h-10 rounded-2xl bg-[#FAF9F7] hover:bg-[#F5DCD8] border border-[#E9E2DF] text-[#171717] font-bold flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Quick Bulk Fill Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FAF5F4] pb-4">
        <div>
          <h3 className="font-bold text-sm text-[#171717] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B3A4A]" />
            Matrice des Stocks par Variante ({variants.length} combinaison{variants.length > 1 ? 's' : ''})
          </h3>
          <p className="text-xs text-[#77706D] mt-0.5">
            Saisissez le nombre de pièces en stock pour chaque déclinaison couleur / taille.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full shadow-2xs">
            Total en stock : {totalUnits} pièces
          </span>
        </div>
      </div>

      {/* Quick Action: Bulk Stock Filler */}
      <div className="p-4 rounded-2xl bg-[#FAF5F4] border border-[#F4E2E0] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#8B3A4A]" />
          <span className="text-xs font-semibold text-[#171717]">
            Remplir rapidement toutes les variantes :
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={bulkStockValue}
            onChange={(e) => setBulkStockValue(parseInt(e.target.value, 10) || 0)}
            placeholder="10"
            className="w-20 text-center py-1.5 px-2 bg-white border border-[#E9E2DF] focus:border-[#8B3A4A] rounded-xl text-xs font-bold text-[#171717] outline-none"
          />
          <button
            type="button"
            onClick={applyBulkStock}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs ${
              appliedFeedback
                ? 'bg-emerald-600 text-white'
                : 'bg-[#8B3A4A] hover:bg-[#772F3E] text-white'
            }`}
          >
            {appliedFeedback ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Appliqué !</span>
              </>
            ) : (
              <span>Appliquer à toutes les variantes</span>
            )}
          </button>
        </div>
      </div>

      {/* Case 2: Colors AND Sizes selected (2D Grid Matrix) */}
      {hasColors && hasSizes && (
        <div className="bg-white rounded-3xl border border-[#E9E2DF] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F7] border-b border-[#E9E2DF] text-[#77706D] font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-5">Couleur \ Taille</th>
                  {selectedSizes.map((size) => (
                    <th key={size.id} className="py-3.5 px-4 font-bold text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E9E2DF] shadow-2xs">
                        {size.name}
                      </span>
                    </th>
                  ))}
                  <th className="py-3.5 px-5 font-bold text-right">Sous-total Couleur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF5F4]">
                {selectedColors.map((color) => {
                  const rowTotal = selectedSizes.reduce((acc, size) => {
                    const v = getVariant(color.id, size.id);
                    return acc + (v?.stock || 0);
                  }, 0);

                  return (
                    <tr key={color.id} className="hover:bg-[#FAF9F7]/70 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-[#171717]">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shadow-2xs flex-shrink-0"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span>{color.name}</span>
                        </div>
                      </td>

                      {selectedSizes.map((size) => {
                        const v = getVariant(color.id, size.id);
                        const currentStock = v?.stock ?? 0;
                        const stockClass =
                          currentStock > 5
                            ? 'border-emerald-300 focus:border-emerald-600 bg-emerald-50/40 text-emerald-950'
                            : currentStock > 0
                            ? 'border-amber-300 focus:border-amber-600 bg-amber-50/40 text-amber-950'
                            : 'border-rose-300 focus:border-rose-600 bg-rose-50/40 text-rose-700';

                        return (
                          <td key={size.id} className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={currentStock}
                              onChange={(e) =>
                                updateStock(color.id, size.id, parseInt(e.target.value, 10) || 0)
                              }
                              className={`w-20 text-center py-2 px-2 rounded-xl border font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#8B3A4A]/20 transition-all shadow-inner ${stockClass}`}
                            />
                          </td>
                        );
                      })}

                      <td className="py-3.5 px-5 font-bold text-right text-[#171717]">
                        <span className="px-2 py-0.5 rounded-lg bg-[#FAF9F7] text-[11px]">
                          {rowTotal} pcs
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Case 3: ONLY Colors selected (No sizes) */}
      {hasColors && !hasSizes && (
        <div className="bg-white rounded-3xl border border-[#E9E2DF] overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF9F7] border-b border-[#E9E2DF] text-[#77706D] font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-5">Couleur</th>
                <th className="py-3.5 px-5 text-center">Quantité en Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FAF5F4]">
              {selectedColors.map((color) => {
                const v = getVariant(color.id, null);
                const currentStock = v?.stock ?? 0;

                return (
                  <tr key={color.id} className="hover:bg-[#FAF9F7]/70 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-[#171717]">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shadow-2xs flex-shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span>{color.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <input
                        type="number"
                        min="0"
                        value={currentStock}
                        onChange={(e) =>
                          updateStock(color.id, null, parseInt(e.target.value, 10) || 0)
                        }
                        className="w-24 text-center py-2 px-3 rounded-xl border border-[#E9E2DF] focus:border-[#8B3A4A] font-bold text-xs text-[#171717] outline-none shadow-inner"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Case 4: ONLY Sizes selected (No colors) */}
      {!hasColors && hasSizes && (
        <div className="bg-white rounded-3xl border border-[#E9E2DF] overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF9F7] border-b border-[#E9E2DF] text-[#77706D] font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-5">Taille</th>
                <th className="py-3.5 px-5 text-center">Quantité en Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FAF5F4]">
              {selectedSizes.map((size) => {
                const v = getVariant(null, size.id);
                const currentStock = v?.stock ?? 0;

                return (
                  <tr key={size.id} className="hover:bg-[#FAF9F7]/70 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-[#171717]">
                      <span className="px-3 py-1 rounded-xl bg-[#FAF9F7] border border-[#E9E2DF] font-bold">
                        {size.name}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <input
                        type="number"
                        min="0"
                        value={currentStock}
                        onChange={(e) =>
                          updateStock(null, size.id, parseInt(e.target.value, 10) || 0)
                        }
                        className="w-24 text-center py-2 px-3 rounded-xl border border-[#E9E2DF] focus:border-[#8B3A4A] font-bold text-xs text-[#171717] outline-none shadow-inner"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Generated SKU Breakdown List */}
      <div className="bg-[#FAF9F7] p-5 rounded-3xl border border-[#E9E2DF] space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#77706D]">
            Récapitulatif des Déclinaisons & Codes SKU ({variants.length})
          </h4>
          <span className="text-[11px] text-[#77706D]">Prix de base : {formatCFA(basePrice)}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
          {variants.map((v, i) => {
            const col = selectedColors.find((c) => c.id === v.colorId);
            const sz = selectedSizes.find((s) => s.id === v.sizeId);

            const labelParts: string[] = [];
            if (col) labelParts.push(col.name);
            if (sz) labelParts.push(`Taille ${sz.name}`);
            const label = labelParts.length > 0 ? labelParts.join(' • ') : 'Modèle Standard';

            return (
              <div
                key={i}
                className="p-3 rounded-2xl bg-white border border-[#E9E2DF] text-xs flex items-center justify-between shadow-2xs hover:border-[#D8A7A7] transition-colors"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    {col && (
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: col.hex }}
                      />
                    )}
                    <p className="font-bold text-[#171717] truncate">{label}</p>
                  </div>
                  <p className="font-mono text-[10px] text-[#8B3A4A] font-semibold truncate mt-0.5">
                    {v.sku}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      v.stock > 5
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : v.stock > 0
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {v.stock} en stock
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
