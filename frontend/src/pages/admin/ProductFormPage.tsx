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
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Basic Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [oldPrice, setOldPrice] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

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

  // Populate data when editing
  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name);
      setDescription(existingProduct.description || '');
      setCategoryId(existingProduct.categoryId);
      setPrice(Number(existingProduct.price));
      setOldPrice(existingProduct.oldPrice ? Number(existingProduct.oldPrice) : '');
      setIsActive(existingProduct.isActive);

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
    }
  }, [existingProduct]);

  // Regenerate/Sync variant combinations when colors, sizes, or product name changes
  useEffect(() => {
    const cleanProdCode = (name || 'PROD')
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
      // Single standard variant (no color, no size specified)
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
      if (!price || Number(price) <= 0) throw new Error('Veuillez spécifier un prix valide');
      if (images.length === 0) throw new Error('Veuillez ajouter au moins une photo');
      if (images.length > 7) throw new Error('Un produit ne peut pas avoir plus de 7 photos');
      if (variants.length === 0) throw new Error('Veuillez spécifier le stock pour au moins une variante');

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        categoryId,
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
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
      setFormError(err.message || 'Échec de l\'enregistrement du produit');
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
              Photos Cloudinary (max 7), configuration des couleurs, tailles et stocks individuels
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
              placeholder="Ex: Grand Boubou Bazin Riche Prestige"
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Prix de Vente (FCFA)"
              type="number"
              min="0"
              placeholder="Ex: 65000"
              value={price}
              onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
              required
            />
            <Input
              label="Ancien Prix (FCFA) - Optionnel"
              type="number"
              min="0"
              placeholder="Ex: 75000"
              value={oldPrice}
              onChange={(e) => setOldPrice(e.target.value ? Number(e.target.value) : '')}
              helperText="Affiché barré pour créer un effet promo"
            />
            <div className="space-y-1.5 flex flex-col justify-center">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Visibilité en Boutique
              </label>
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  {isActive ? '✓ Produit Actif (En ligne)' : '✗ Produit Masqué (Brouillon)'}
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Description & Entretien
            </label>
            <textarea
              rows={4}
              placeholder="Détails du tissu (Bazin riche, lin, wax), finitions, conseils de lavage..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {/* 2. Galerie Photos (Max 7) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">
              2
            </span>
            Photos du Produit (Cloudinary - Max 7)
          </h2>

          <ImageUploader images={images} onChange={setImages} />
        </div>

        {/* 3. Couleurs et Tailles */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">
              3
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

        {/* 4. Matrice des Variantes et des Stocks */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">
              4
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
