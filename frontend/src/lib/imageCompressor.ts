/**
 * Client-side high-quality image compressor & resizer.
 * Resizes large high-res camera photos (e.g. 5MB-20MB iPhone/Android photos)
 * down to ~200-400KB before uploading to avoid HTTP 413 (Payload Too Large) on Vercel.
 */
export async function compressImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's already an SVG, read directly
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let { width, height } = img;

        // Maintain aspect ratio while bounding within maxWidth & maxHeight
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original read if canvas 2D context fails
          resolve(event.target?.result as string);
          return;
        }

        // Apply high-quality interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG for best compression ratio or PNG if transparency needed
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressedBase64 = canvas.toDataURL(mimeType, quality);
        resolve(compressedBase64);
      };

      img.onerror = () => {
        // Fallback to direct file reader on decode error
        const fallbackReader = new FileReader();
        fallbackReader.onload = () => resolve(fallbackReader.result as string);
        fallbackReader.onerror = reject;
        fallbackReader.readAsDataURL(file);
      };
    };

    reader.onerror = reject;
  });
}
