import React, { useState } from 'react';
import { Upload, X, Star, ArrowLeft, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { productService } from '../../services/product.service';

export interface UploadedImage {
  url: string;
  publicId: string;
  position: number;
  isPrimary: boolean;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const maxPhotos = 7;
  const isFull = images.length >= maxPhotos;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxPhotos) {
      setUploadError(`Limite atteinte : Vous ne pouvez pas ajouter plus de ${maxPhotos} photos.`);
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const newUploadedList: UploadedImage[] = [...images];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (newUploadedList.length >= maxPhotos) break;

        // Convert file to base64 data-uri
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await productService.uploadMedia(base64);
        newUploadedList.push({
          url: res.url,
          publicId: res.publicId,
          position: newUploadedList.length,
          isPrimary: newUploadedList.length === 0, // 1st is default primary
        });
      }

      onChange(newUploadedList);
    } catch (err: any) {
      setUploadError(err.message || 'Échec du téléversement de l\'image');
    } finally {
      setIsUploading(false);
      // reset file input
      e.target.value = '';
    }
  };

  const setPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(updated);
  };

  const removeImage = (index: number) => {
    const removed = images.filter((_, i) => i !== index);
    // If we removed the primary image, make the first one primary
    const reindexed = removed.map((img, i) => ({
      ...img,
      position: i,
      isPrimary: img.isPrimary || (i === 0 && !removed.some((r) => r.isPrimary)),
    }));
    onChange(reindexed);
  };

  const movePosition = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    // reindex positions
    const reindexed = copy.map((img, i) => ({
      ...img,
      position: i,
    }));
    onChange(reindexed);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Galerie Photos du Produit (Cloudinary)
          </label>
          <p className="text-xs text-slate-500">
            Maximum {maxPhotos} photos haute définition. La première ou celle avec l'étoile sera l'image principale.
          </p>
        </div>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            isFull ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {images.length} / {maxPhotos} photos
        </span>
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Grid of uploaded images */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {images.map((img, idx) => (
          <div
            key={img.publicId || idx}
            className={`relative group rounded-2xl overflow-hidden border-2 aspect-[3/4] bg-slate-100 shadow-sm transition-all ${
              img.isPrimary ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200'
            }`}
          >
            <img src={img.url} alt="" className="w-full h-full object-cover" />

            {/* Position and Primary badge */}
            <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
                #{idx + 1}
              </span>
              {img.isPrimary && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-white" /> Principale
                </span>
              )}
            </div>

            {/* Action overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700"
                  title="Supprimer la photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(idx)}
                    className="w-full py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center gap-1"
                  >
                    <Star className="w-3 h-3" /> Image Principale
                  </button>
                )}

                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => movePosition(idx, 'left')}
                    className="flex-1 py-1 rounded bg-white/20 hover:bg-white/40 text-white text-[10px] disabled:opacity-30 flex items-center justify-center"
                    title="Déplacer vers la gauche"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === images.length - 1}
                    onClick={() => movePosition(idx, 'right')}
                    className="flex-1 py-1 rounded bg-white/20 hover:bg-white/40 text-white text-[10px] disabled:opacity-30 flex items-center justify-center"
                    title="Déplacer vers la droite"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Upload Trigger Button */}
        {!isFull && (
          <label className="relative border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl aspect-[3/4] flex flex-col items-center justify-center p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-amber-50/30 transition-all">
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={isUploading}
              onChange={handleFileSelect}
              className="sr-only"
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                <span className="text-[11px] text-amber-700 font-medium">Téléversement...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-amber-700">
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold">Ajouter Photo</span>
                <span className="text-[10px] text-slate-400">({maxPhotos - images.length} restante(s))</span>
              </div>
            )}
          </label>
        )}
      </div>
    </div>
  );
}
