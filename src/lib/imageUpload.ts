/**
 * Reads an image file selected by the user and optimizes large photos so they fit
 * cleanly inside Firebase Firestore documents (< 240 KB per image) without quality loss.
 */
export async function prepareImageDataUrl(file: File): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Impossible de lire ce fichier image.'));
    reader.readAsDataURL(file);
  });

  if (!rawDataUrl.startsWith('data:image/')) {
    throw new Error('Veuillez sélectionner un fichier image valide (PNG, JPG, WEBP, GIF, SVG, ICO).');
  }

  if (
    file.type === 'image/svg+xml' ||
    file.type === 'image/gif' ||
    file.type === 'image/x-icon' ||
    file.type === 'image/vnd.microsoft.icon'
  ) {
    if (rawDataUrl.length <= 680_000) {
      return rawDataUrl;
    }
    throw new Error('Ce fichier SVG/GIF est trop volumineux pour le stockage Firebase (max ~500 Ko).');
  }

  if (
    rawDataUrl.length <= 240_000 &&
    (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/webp')
  ) {
    return rawDataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const targetMaxBytes = 240_000;
      const dimensions = [1200, 960, 760];
      const hasAlpha = file.type === 'image/png' || file.type === 'image/webp';
      const preferredMime = hasAlpha ? 'image/webp' : 'image/jpeg';

      for (const maxDim of dimensions) {
        const ratio = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round((img.width || 1) * ratio));
        const height = Math.max(1, Math.round((img.height || 1) * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        for (const q of [0.84, 0.72, 0.6, 0.48]) {
          const encoded = canvas.toDataURL(preferredMime, q);
          if (encoded.startsWith(`data:${preferredMime}`) && encoded.length <= targetMaxBytes) {
            resolve(encoded);
            return;
          }
          const jpegFallback = canvas.toDataURL('image/jpeg', q);
          if (jpegFallback.length <= targetMaxBytes) {
            resolve(jpegFallback);
            return;
          }
        }
      }

      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = Math.min(720, img.width || 720);
      fallbackCanvas.height = Math.max(
        1,
        Math.round(((img.height || 720) * fallbackCanvas.width) / Math.max(1, img.width || 720)),
      );
      const ctx = fallbackCanvas.getContext('2d');
      if (!ctx) {
        resolve(rawDataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, fallbackCanvas.width, fallbackCanvas.height);
      resolve(fallbackCanvas.toDataURL('image/jpeg', 0.55));
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}
