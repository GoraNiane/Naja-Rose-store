import { useState, useMemo } from 'react';
import { Color } from '../../types';
import { Plus, Check, Search, X, Sparkles, Palette } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#D8A7A7');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Normalize accents and case for intuitive matching (e.g. "dore" -> "Doré")
  const normalizeText = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const filteredColors = useMemo(() => {
    if (!searchQuery.trim()) return allColors;
    const q = normalizeText(searchQuery);
    return allColors.filter(
      (c) =>
        normalizeText(c.name).includes(q) ||
        c.hex.toLowerCase().includes(q)
    );
  }, [allColors, searchQuery]);

  const toggleColor = (id: string) => {
    if (selectedColorIds.includes(id)) {
      onChange(selectedColorIds.filter((cId) => cId !== id));
    } else {
      onChange([...selectedColorIds, id]);
    }
  };

  const handleSelectAllFiltered = () => {
    const newIds = new Set([...selectedColorIds, ...filteredColors.map((c) => c.id)]);
    onChange(Array.from(newIds));
  };

  const handleClearSelection = () => {
    onChange([]);
  };

  const handleOpenAddModalWithSearch = () => {
    if (searchQuery.trim()) {
      setNewColorName(searchQuery.trim());
    }
    setShowAddModal(true);
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
      setSearchQuery('');
    } catch (err: any) {
      setAddError(err.message || 'Échec de la création de la couleur');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#8B3A4A]" />
          <label className="text-xs font-bold uppercase tracking-wider text-[#2C1E21]">
            Couleurs ({selectedColorIds.length} sélectionnée{selectedColorIds.length > 1 ? 's' : ''})
          </label>
        </div>

        <div className="flex items-center gap-2.5">
          {selectedColorIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-[11px] text-[#7A6469] hover:text-rose-600 transition-colors cursor-pointer"
            >
              Tout désélectionner
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setNewColorName('');
              setShowAddModal(true);
            }}
            className="text-xs text-[#8B3A4A] font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Nouvelle couleur
          </button>
        </div>
      </div>

      {/* Interactive Color Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#A0888E] absolute left-3.5 top-2.5 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une couleur (ex: Rose, Noir, Doré, Vert, Terracotta, Bleu...)..."
          className="w-full pl-10 pr-9 py-2 bg-[#FAF9F7] border border-[#E9E2DF] rounded-2xl text-xs text-[#2C1E21] placeholder-[#A0888E] focus:bg-white focus:outline-none focus:border-[#8B3A4A] focus:ring-2 focus:ring-[#8B3A4A]/10 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-[#A0888E] hover:text-[#2C1E21] transition-colors cursor-pointer"
            title="Effacer la recherche"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Info Bar */}
      {searchQuery && (
        <div className="flex items-center justify-between text-[11px] text-[#644D52] px-1">
          <span>
            {filteredColors.length} couleur{filteredColors.length > 1 ? 's' : ''} trouvée{filteredColors.length > 1 ? 's' : ''} pour « {searchQuery} »
          </span>
          {filteredColors.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="font-bold text-[#8B3A4A] hover:underline cursor-pointer"
            >
              + Sélectionner ces {filteredColors.length} couleur{filteredColors.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Color Swatches Grid */}
      {filteredColors.length > 0 ? (
        <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1 p-1">
          {filteredColors.map((color) => {
            const isSelected = selectedColorIds.includes(color.id);
            return (
              <button
                type="button"
                key={color.id}
                onClick={() => toggleColor(color.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#8B3A4A] bg-[#FAF0EE] text-[#54202B] font-bold shadow-2xs ring-2 ring-[#8B3A4A]/25 scale-102'
                    : 'border-[#E9E2DF] bg-white text-[#2C1E21] hover:border-[#8B3A4A]/40 hover:bg-[#FAF9F8]'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0 shadow-2xs"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="truncate max-w-[140px]">{color.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#8B3A4A] shrink-0" />}
              </button>
            );
          })}
        </div>
      ) : (
        /* Empty search state with quick create button */
        <div className="p-4 rounded-2xl bg-[#FAF9F7] border border-dashed border-[#E9E2DF] text-center space-y-2">
          <p className="text-xs text-[#7A6469]">
            Aucune couleur trouvée pour <strong>« {searchQuery} »</strong>
          </p>
          <button
            type="button"
            onClick={handleOpenAddModalWithSearch}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#8B3A4A] text-white text-xs font-bold shadow-2xs hover:bg-[#722E3C] transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Créer la couleur « {searchQuery} »</span>
          </button>
        </div>
      )}

      {/* Quick Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-5 shadow-2xl border border-[#F2E5E2] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F4E2E0] pb-3">
              <h3 className="font-serif italic font-bold text-base text-[#2C1E21]">
                Ajouter une Nouvelle Couleur
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-[#7A6469] hover:bg-[#FAF0EE] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium rounded-xl">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateColor} className="space-y-4">
              <Input
                label="Nom de la couleur *"
                placeholder="Ex: Terracotta Foncé, Or Bazin, Bleu Pastel..."
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                required
                autoFocus
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#2C1E21]">
                  Nuancier Hexadécimal
                </label>
                <div className="flex items-center gap-3 p-3 bg-[#FAF9F7] rounded-2xl border border-[#E9E2DF]">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-black/10 cursor-pointer shadow-2xs"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newColorHex.toUpperCase()}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      placeholder="#000000"
                      className="w-full font-mono text-xs font-bold text-[#2C1E21] bg-transparent border-none focus:outline-none uppercase"
                    />
                    <span className="text-[10px] text-[#7A6469] block">Cliquez sur le carré pour choisir</span>
                  </div>
                </div>
              </div>

              {/* Preset quick colors */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A6469] block">
                  Suggestions Naja Rose :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: 'Rose Poudré', hex: '#F5DCD8' },
                    { name: 'Vieux Rose', hex: '#8B3A4A' },
                    { name: 'Beige Rosé', hex: '#E8CFCF' },
                    { name: 'Doré', hex: '#D97706' },
                    { name: 'Terracotta', hex: '#9A3412' },
                    { name: 'Vert Émeraude', hex: '#059669' },
                    { name: 'Noir Élégance', hex: '#1A1816' },
                    { name: 'Bleu Nuit', hex: '#1E1B4B' },
                  ].map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => {
                        setNewColorHex(preset.hex);
                        if (!newColorName) setNewColorName(preset.name);
                      }}
                      className="w-6 h-6 rounded-full border border-black/10 shadow-2xs hover:scale-110 transition-transform cursor-pointer"
                      style={{ backgroundColor: preset.hex }}
                      title={`${preset.name} (${preset.hex})`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-[#F4E2E0]">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  className="flex-1 bg-[#8B3A4A] hover:bg-[#722E3C] text-white"
                  isLoading={isSubmitting}
                >
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
