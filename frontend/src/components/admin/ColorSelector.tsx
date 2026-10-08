import { useState } from 'react';
import { Color } from '../../types';
import { Plus, Check } from 'lucide-react';
import { productService } from '../../services/product.service';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ColorSelectorProps {
  allColors: Color[];
  selectedColorIds: string[];
  onChange: (colorIds: string[]) => void;
  onColorCreated: (color: Color) => void;
}

export function ColorSelector({
  allColors,
  selectedColorIds,
  onChange,
  onColorCreated,
}: ColorSelectorProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#111111');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const toggleColor = (id: string) => {
    if (selectedColorIds.includes(id)) {
      onChange(selectedColorIds.filter((cId) => cId !== id));
    } else {
      onChange([...selectedColorIds, id]);
    }
  };

  const handleCreateColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColorName.trim()) return;

    try {
      setIsSubmitting(true);
      setAddError(null);
      const created = await productService.createColor({
        name: newColorName.trim(),
        hex: newColorHex,
      });
      onColorCreated(created);
      onChange([...selectedColorIds, created.id]);
      setNewColorName('');
      setShowAddModal(false);
    } catch (err: any) {
      setAddError(err.message || 'Échec de la création de la couleur');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Couleurs du Modèle ({selectedColorIds.length} sélectionnée(s))
        </label>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="text-xs text-amber-700 font-semibold hover:underline flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Nouvelle couleur
        </button>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {allColors.map((color) => {
          const isSelected = selectedColorIds.includes(color.id);
          return (
            <button
              type="button"
              key={color.id}
              onClick={() => toggleColor(color.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                isSelected
                  ? 'border-amber-600 bg-amber-50 text-amber-950 font-semibold shadow-sm ring-1 ring-amber-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <span
                className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0"
                style={{ backgroundColor: color.hex }}
              />
              <span>{color.name}</span>
              {isSelected && <Check className="w-3.5 h-3.5 text-amber-600" />}
            </button>
          );
        })}
      </div>

      {/* Quick Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-display font-bold text-base text-slate-900">
              Ajouter une Nouvelle Couleur
            </h3>
            {addError && <p className="text-xs text-rose-600">{addError}</p>}
            <form onSubmit={handleCreateColor} className="space-y-4">
              <Input
                label="Nom de la couleur"
                placeholder="Ex: Vert Bazin, Doré Saharien"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                required
              />
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Nuancier Hexadécimal
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer"
                  />
                  <span className="font-mono text-xs text-slate-700 font-bold">{newColorHex}</span>
                </div>
              </div>

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
