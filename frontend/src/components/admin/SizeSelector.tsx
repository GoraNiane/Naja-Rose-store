import { useState } from 'react';
import { Size } from '../../types';
import { Plus, Check } from 'lucide-react';
import { productService } from '../../services/product.service';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface SizeSelectorProps {
  allSizes: Size[];
  selectedSizeIds: string[];
  onChange: (sizeIds: string[]) => void;
  onSizeCreated: (size: Size) => void;
}

export function SizeSelector({
  allSizes,
  selectedSizeIds,
  onChange,
  onSizeCreated,
}: SizeSelectorProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSizeName, setNewSizeName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const toggleSize = (id: string) => {
    if (selectedSizeIds.includes(id)) {
      onChange(selectedSizeIds.filter((sId) => sId !== id));
    } else {
      onChange([...selectedSizeIds, id]);
    }
  };

  const handleCreateSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSizeName.trim()) return;

    try {
      setIsSubmitting(true);
      setAddError(null);
      const created = await productService.createSize({
        name: newSizeName.trim().toUpperCase(),
      });
      onSizeCreated(created);
      onChange([...selectedSizeIds, created.id]);
      setNewSizeName('');
      setShowAddModal(false);
    } catch (err: any) {
      setAddError(err.message || 'Échec de la création de la taille');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Tailles Disponibles ({selectedSizeIds.length} sélectionnée(s))
        </label>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="text-xs text-amber-700 font-semibold hover:underline flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Nouvelle taille
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {allSizes.map((size) => {
          const isSelected = selectedSizeIds.includes(size.id);
          return (
            <button
              type="button"
              key={size.id}
              onClick={() => toggleSize(size.id)}
              className={`min-w-[48px] h-10 px-3.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <span>{size.name}</span>
              {isSelected && <Check className="w-3 h-3 text-amber-400" />}
            </button>
          );
        })}
      </div>

      {/* Quick Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-display font-bold text-base text-slate-900">
              Ajouter une Nouvelle Taille
            </h3>
            {addError && <p className="text-xs text-rose-600">{addError}</p>}
            <form onSubmit={handleCreateSize} className="space-y-4">
              <Input
                label="Nom de la taille"
                placeholder="Ex: XS, 4XL, Sur-Mesure"
                value={newSizeName}
                onChange={(e) => setNewSizeName(e.target.value)}
                required
              />

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddModal(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="gold" className="flex-1" isLoading={isSubmitting}>
                  Enregistrer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
