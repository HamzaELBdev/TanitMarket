/**
 * Shrinks a photo to something worth sending to Cloud Vision: the labels it
 * returns do not need more than ~800 px, and a phone photo is several MB.
 * Resolves to a base64 JPEG (no data: prefix), or null when the browser cannot
 * decode the file.
 */
export function photoToBase64(file, maxSide = 800, quality = 0.7) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || !file) return resolve(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl.split(',')[1] || null);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}
