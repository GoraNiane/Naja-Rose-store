import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../services/product.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { ImageUploader, type UploadedImage } from '../../components/admin/ImageUploader';
import { ColorSelector } from '../../components/admin/ColorSelector';
import { SizeSelector } from '../../components/admin/SizeSelector';
import { VariantMatrixTable, type GeneratedVariant } from '../../components/admin/VariantMatrixTable';
import { formatCFA } from '../../lib/utils';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Tag,
  Percent,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react';

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Basic Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Pricing & Promotion State
  const [price, setPrice] = useState<number | ''>('');
  const [oldPrice, setOldPrice] = useState<number | ''>('');
  const [isPromo, setIsPromo] = useState(false);
  const [promoMode, setPromoMode] = useState<'by_price' | 'by_percent'>('by_price');
  const [discountPercent, setDiscountPercent] = useState<number | ''>(20);
  const [promoDurationType, setPromoDurationType] = useState<'48h' | '7d' | '14d' | '30d' | 'custom'>('7d');
  const [promoEndDate, setPromoEndDate] = useState<string>('');

  // Photos (Max 7)
  const [images, setImages] = useState<UploadedImage[]>([]);

  // Selected Colors & Sizes
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([]);
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([]);

  // Generated Variants with Stocks
  const [variants, setVariants] = useState<GeneratedVariant[]>([]);

  const [formError, setFormError] = useState<string | null>(null);

  // Fetch reference data (Categories, Colors, Sizes)
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
  });

  const { data: allColors = [], refetch: refetchColors } = useQuery({
    queryKey: ['colors'],
    queryFn: () => productService.getColors(),
  });

  const { data: allSizes = [], refetch: refetchSizes } = useQuery({
    queryKey: ['sizes'],
    queryFn: () => productService.getSizes(),
  });

  // If edit mode, fetch existing product
  const { data: existingProduct, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => productService.getProductById(id!),
    enabled: isEditMode,
  });

  // Helper to set duration preset date
  const setDurationPreset = (preset: '48h' | '7d' | '14d' | '30d' | 'custom') => {
    setPromoDurationType(preset);
    const now = new Date();
    if (preset === '48h') {
      now.setDate(now.getDate() + 2);
    } else if (preset === '7d') {
      now.setDate(now.getDate() + 7);
    } else if (preset === '14d') {
      now.setDate(now.getDate() + 14);
    } else if (preset === '30d') {
      now.setDate(now.getDate() + 30);
    }
    if (preset !== 'custom') {
      setPromoEndDate(now.toISOString().split('T')[0]);
    }
  };

  // Populate data when editing
  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name);
      setDescription(existingProduct.description || '');
      setCategoryId(existingProduct.categoryId);
      setIsActive(existingProduct.isActive);

      const p = Number(existingProduct.price);
      const op = existingProduct.oldPrice ? Number(existingProduct.oldPrice) : '';

      setPrice(p);
      setOldPrice(op);

      if (op && Number(op) > p) {
        setIsPromo(true);
        const calculatedPercent = Math.round(((Number(op) - p) / Number(op)) * 100);
        setDiscountPercent(calculatedPercent);
      } else {
        setIsPromo(false);
      }

      setImages(
        existingProduct.images.map((img) => ({
          url: img.url,
          publicId: img.publicId,
          position: img.position,
          isPrimary: img.isPrimary,
        }))
      );

      const colorIds = Array.from(
        new Set(existingProduct.variants.map((v) => v.colorId).filter(Boolean) as string[])
      );
      const sizeIds = Array.from(
        new Set(existingProduct.variants.map((v) => v.sizeId).filter(Boolean) as string[])
      );

      setSelectedColorIds(colorIds);
      setSelectedSizeIds(sizeIds);

      setVariants(
        existingProduct.variants.map((v) => ({
          colorId: v.colorId,
          sizeId: v.sizeId,
          sku: v.sku,
          stock: v.stock,
          price: v.price ? Number(v.price) : null,
          isActive: v.isActive,
        }))
      );
    } else {
      // Default duration preset for new promo
      setDurationPreset('7d');
    }
  }, [existingProduct]);

  // Synchronize Percentage calculations
  const handleDiscountPercentChange = (percentVal: number | '') => {
    setDiscountPercent(percentVal);
    if (percentVal !== '' && oldPrice && Number(oldPrice) > 0) {
      const discounted = Math.round(Number(oldPrice) * (1 - Number(percentVal) / 100));
      setPrice(discounted);
    }
  };

  const handleRegularPriceChange = (val: number | '') => {
    setOldPrice(val);
    if (isPromo && promoMode === 'by_percent' && val !== '' && discountPercent !== '') {
      const discounted = Math.round(Number(val) * (1 - Number(discountPercent) / 100));
      setPrice(discounted);
    }
  };

  const handlePromoPriceChange = (val: number | '') => {
    setPrice(val);
    if (val !== '' && oldPrice && Number(oldPrice) > Number(val)) {
      const pct = Math.round(((Number(oldPrice) - Number(val)) / Number(oldPrice)) * 100);
      setDiscountPercent(pct);
    }
  };

  // Regenerate/Sync variant combinations when colors, sizes, or product name changes
  useEffect(() => {
    const cleanProdCode =
      (name || 'PROD')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 6) || 'PROD';

    const hasColors = selectedColorIds.length > 0;
    const hasSizes = selectedSizeIds.length > 0;

    const newVariants: GeneratedVariant[] = [];

    if (hasColors && hasSizes) {
      for (const cId of selectedColorIds) {
        const colorObj = allColors.find((c) => c.id === cId);
        const colCode = (colorObj?.name || 'COL')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 3);

        for (const sId of selectedSizeIds) {
          const sizeObj = allSizes.find((s) => s.id === sId);
          const szCode = (sizeObj?.name || 'SZ')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 3);

          const autoSku = `NJ-${cleanProdCode}-${colCode}-${szCode}`;
          const existing = variants.find(
            (v) => (v.colorId || null) === cId && (v.sizeId || null) === sId
          );

          newVariants.push({
            colorId: cId,
            sizeId: sId,
            sku: existing?.sku || autoSku,
            stock: existing !== undefined ? existing.stock : 10,
            price: existing?.price || null,
            isActive: existing?.isActive !== undefined ? existing.isActive : true,
          });
        }
      }
    } else if (hasColors && !hasSizes) {
      for (const cId of selectedColorIds) {
        const colorObj = allColors.find((c) => c.id === cId);
        const colCode = (colorObj?.name || 'COL')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 3);

        const autoSku = `NJ-${cleanProdCode}-${colCode}`;
        const existing = variants.find(
          (v) => (v.colorId || null) === cId && (v.sizeId || null) === null
        );

        newVariants.push({
          colorId: cId,
          sizeId: null,
          sku: existing?.sku || autoSku,
          stock: existing !== undefined ? existing.stock : 10,
          price: existing?.price || null,
          isActive: existing?.isActive !== undefined ? existing.isActive : true,
        });
      }
    } else if (!hasColors && hasSizes) {
      for (const sId of selectedSizeIds) {
        const sizeObj = allSizes.find((s) => s.id === sId);
        const szCode = (sizeObj?.name || 'SZ')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 3);

        const autoSku = `NJ-${cleanProdCode}-${szCode}`;
        const existing = variants.find(
          (v) => (v.colorId || null) === null && (v.sizeId || null) === sId
        );

        newVariants.push({
          colorId: null,
          sizeId: sId,
          sku: existing?.sku || autoSku,
          stock: existing !== undefined ? existing.stock : 10,
          price: existing?.price || null,
          isActive: existing?.isActive !== undefined ? existing.isActive : true,
        });
      }
    } else {
      const autoSku = `NJ-${cleanProdCode}-STD`;
      const existing = variants[0];
      newVariants.push({
        colorId: null,
        sizeId: null,
        sku: existing?.sku || autoSku,
        stock: existing !== undefined ? existing.stock : 10,
        price: existing?.price || null,
        isActive: existing?.isActive !== undefined ? existing.isActive : true,
      });
    }

    setVariants(newVariants);
  }, [selectedColorIds, selectedSizeIds, name, allColors, allSizes]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Le nom du produit est obligatoire');
      if (!categoryId) throw new Error('Veuillez sélectionner une catégorie');
      if (!price || Number(price) <= 0) throw new Error('Veuillez spécifier un prix de vente valide');
      if (images.length === 0) throw new Error('Veuillez ajouter au moins une photo');
      if (images.length > 7) throw new Error('Un produit ne peut pas avoir plus de 7 photos');
      if (variants.length === 0) throw new Error('Veuillez spécifier le stock pour au moins une variante');

      const finalOldPrice = isPromo && oldPrice && Number(oldPrice) > Number(price) ? Number(oldPrice) : null;

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        categoryId,
        price: Number(price),
        oldPrice: finalOldPrice,
        isActive,
        images: images.map((img, i) => ({
          url: img.url,
          publicId: img.publicId,
          position: i,
          isPrimary: img.isPrimary,
        })),
        variants: variants.map((v) => ({
          colorId: v.colorId || null,
          sizeId: v.sizeId || null,
          sku: v.sku,
          stock: v.stock,
          price: v.price ? Number(v.price) : null,
          isActive: v.isActive ?? true,
        })),
      };

      if (isEditMode) {
        return productService.updateProduct(id!, payload);
      } else {
        return productService.createProduct(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-list'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stock'] });
      navigate('/admin/products');
    },
    onError: (err: any) => {
      setFormError(err.message || "Échec de l'enregistrement du produit");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    saveMutation.mutate();
  };

  if (isEditMode && isLoadingProduct) {
    return <Spinner size="lg" />;
  }

  const selectedColorsObjects = allColors.filter((c) => selectedColorIds.includes(c.id));
  const selectedSizesObjects = allSizes.filter((s) => selectedSizeIds.includes(s.id));

  // Calculated discount badge for live preview
  const liveDiscountPercent =
    isPromo && oldPrice && price && Number(oldPrice) > Number(price)
      ? Math.round(((Number(oldPrice) - Number(price)) / Number(oldPrice)) * 100)
      : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-900">
              {isEditMode ? `Modifier le Produit : ${name}` : 'Créer un Nouveau Produit'}
            </h1>
            <p className="text-xs text-slate-500">
              Gestion complète du catalogue, promotions avec calcul automatique de remise et stocks
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="gold"
          size="md"
          isLoading={saveMutation.isPending}
          onClick={handleSubmit}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {isEditMode ? 'Mettre à jour' : 'Enregistrer le Produit'}
        </Button>
      </div>

      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Informations Générales */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">
              1
            </span>
            Informations Générales
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nom du produit"
              placeholder="Ex: Robe longue fluide en soie ou Ensemble 3 pièces"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Catégorie
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">-- Sélectionnez une catégorie --</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Description & Entretien
            </label>
            <textarea
              rows={3}
              placeholder="Détails du tissu (soie, lin, satin), finitions, conseils de lavage..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Visibility toggle */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Statut de Visibilité</span>
              <span className="text-[11px] text-slate-500">
                {isActive ? 'Le produit est visible en ligne pour les clients' : 'Le produit est masqué (Brouillon)'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* 2. Tarification & Gestion des Promotions */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              Prix & Promotion
            </h2>

            {/* Promotion Toggle Switch */}
            <div className="flex items-center gap-3 bg-[#FAF0EE] px-4 py-2 rounded-2xl border border-[#F2E5E2]">
              <Tag className="w-4 h-4 text-[#8B3A4A]" />
              <span className="text-xs font-bold text-[#2C1E21]">Ce produit est-il en promotion ?</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPromo}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsPromo(checked);
                    if (checked) {
                      if (!oldPrice && price) {
                        setOldPrice(price);
                        const discounted = Math.round(Number(price) * (1 - (Number(discountPercent) || 20) / 100));
                        setPrice(discounted);
                      }
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B3A4A]"></div>
              </label>
            </div>
          </div>

          {!isPromo ? (
            /* Mode Standard (Pas de promotion) */
            <div className="max-w-md">
              <Input
                label="Prix de Vente Régulier (FCFA)"
                type="number"
                min="0"
                placeholder="Ex: 25000"
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                required
                helperText="Prix facturé au client lors de l'achat"
              />
            </div>
          ) : (
            /* Mode Promotionnel Complet */
            <div className="space-y-6 bg-[#FAF9F8] p-5 sm:p-6 rounded-2xl border border-[#F2E5E2]">
              {/* Promo Method Tabs */}
              <div className="flex gap-2 p-1 bg-white rounded-xl border border-slate-200 w-fit">
                <button
                  type="button"
                  onClick={() => setPromoMode('by_price')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    promoMode === 'by_price'
                      ? 'bg-[#8B3A4A] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mode 1 : Prix Barré & Prix Promo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPromoMode('by_percent');
                    if (oldPrice && discountPercent) {
                      const discounted = Math.round(Number(oldPrice) * (1 - Number(discountPercent) / 100));
                      setPrice(discounted);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    promoMode === 'by_percent'
                      ? 'bg-[#8B3A4A] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Percent className="w-3 h-3" />
                  Mode 2 : Réduction en Pourcentage (-%)
                </button>
              </div>

              {/* Form inputs depending on promoMode */}
              {promoMode === 'by_price' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="1. Prix Réel Régulier (Prix Barré) - FCFA"
                    type="number"
                    min="0"
                    placeholder="Ex: 50000"
                    value={oldPrice}
                    onChange={(e) => handleRegularPriceChange(e.target.value ? Number(e.target.value) : '')}
                    required
                    helperText="Ce prix sera affiché avec un trait barré"
                  />
                  <Input
                    label="2. Prix de la Promotion (Prix Facturé) - FCFA"
                    type="number"
                    min="0"
                    placeholder="Ex: 40000"
                    value={price}
                    onChange={(e) => handlePromoPriceChange(e.target.value ? Number(e.target.value) : '')}
                    required
                    helperText="Nouveau prix promotionnel payé par le client"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="max-w-md">
                    <Input
                      label="Prix Réel de Base (FCFA)"
                      type="number"
                      min="0"
                      placeholder="Ex: 50000"
                      value={oldPrice}
                      onChange={(e) => handleRegularPriceChange(e.target.value ? Number(e.target.value) : '')}
                      required
                      helperText="Prix d'origine avant réduction"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Sélectionnez le Pourcentage de Remise (-%)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {[10, 15, 20, 25, 30, 40, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleDiscountPercentChange(pct)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            discountPercent === pct
                              ? 'bg-[#1C1819] text-white shadow-xs scale-105'
                              : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          -{pct}%
                        </button>
                      ))}
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
                        <span className="text-xs text-slate-500">Autre :</span>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          placeholder="%"
                          value={discountPercent}
                          onChange={(e) => handleDiscountPercentChange(e.target.value ? Number(e.target.value) : '')}
                          className="w-12 text-xs font-bold text-slate-900 focus:outline-none"
                        />
                        <span className="text-xs font-bold text-slate-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Durée de la Promotion */}
              <div className="pt-4 border-t border-[#EFE5E3] space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#382B2F] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#8B3A4A]" />
                  Durée & Validité de la Promotion
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDurationPreset('48h')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      promoDurationType === '48h'
                        ? 'bg-[#8B3A4A] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    ⚡ Flash 48 Heures
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationPreset('7d')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      promoDurationType === '7d'
                        ? 'bg-[#8B3A4A] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    📅 7 Jours (1 Semaine)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationPreset('14d')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      promoDurationType === '14d'
                        ? 'bg-[#8B3A4A] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    14 Jours
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationPreset('30d')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      promoDurationType === '30d'
                        ? 'bg-[#8B3A4A] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    30 Jours
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromoDurationType('custom')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      promoDurationType === 'custom'
                        ? 'bg-[#8B3A4A] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    Date personnalisée
                  </button>
                </div>

                {promoDurationType === 'custom' && (
                  <div className="max-w-xs pt-1">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Date de fin de promotion :
                    </label>
                    <input
                      type="date"
                      value={promoEndDate}
                      onChange={(e) => setPromoEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#8B3A4A]"
                    />
                  </div>
                )}
              </div>

              {/* Aperçu en direct de l'effet Promotionnel */}
              {oldPrice && price && (
                <div className="p-4 bg-white rounded-2xl border border-[#F2E5E2] shadow-2xs space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B3A4A] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Aperçu en direct sur la boutique
                  </span>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xl font-bold text-[#1A1816]">
                      {formatCFA(Number(price))}
                    </span>
                    <span className="text-sm text-[#A0888E] line-through font-normal">
                      {formatCFA(Number(oldPrice))}
                    </span>
                    {liveDiscountPercent && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1C1819] text-white">
                        -{liveDiscountPercent}%
                      </span>
                    )}
                    <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Économie : {formatCFA(Number(oldPrice) - Number(price))}
                    </span>
                  </div>

                  {promoEndDate && (
                    <p className="text-[11px] text-[#644D52] flex items-center gap-1.5 pt-1">
                      <Calendar className="w-3.5 h-3.5 text-[#8B3A4A]" />
                      <span>
                        Offre promotionnelle valable jusqu'au <strong>{promoEndDate}</strong>
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Galerie Photos (Max 7) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">
              3
            </span>
            Photos du Produit (Cloudinary - Max 7)
          </h2>

          <ImageUploader images={images} onChange={setImages} />
        </div>

        {/* 4. Couleurs et Tailles */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">
              4
            </span>
            Sélection des Couleurs & Tailles
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ColorSelector
              allColors={allColors}
              selectedColorIds={selectedColorIds}
              onChange={setSelectedColorIds}
              onColorCreated={() => refetchColors()}
            />

            <SizeSelector
              allSizes={allSizes}
              selectedSizeIds={selectedSizeIds}
              onChange={setSelectedSizeIds}
              onSizeCreated={() => refetchSizes()}
            />
          </div>
        </div>

        {/* 5. Matrice des Variantes et des Stocks */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">
              5
            </span>
            Matrice des Variantes & Stocks
          </h2>

          <VariantMatrixTable
            productName={name}
            basePrice={Number(price) || 0}
            selectedColors={selectedColorsObjects}
            selectedSizes={selectedSizesObjects}
            variants={variants}
            onChange={setVariants}
          />
        </div>

        {/* Action Footer */}
        <div className="flex justify-end gap-3 pt-4">
          <Link to="/admin/products">
            <Button type="button" variant="outline" size="lg">
              Annuler
            </Button>
          </Link>
          <Button
            type="submit"
            variant="gold"
            size="lg"
            isLoading={saveMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isEditMode ? 'Mettre à jour le Produit' : 'Créer le Produit'}
          </Button>
        </div>
      </form>
    </div>
  );
}
