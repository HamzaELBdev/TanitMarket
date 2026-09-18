import { auth, storage, ref, uploadBytes, getDownloadURL } from '../firebase';

/**
 * Compresses an image client-side if > 4MB to satisfy Firebase Storage rules (< 5MB)
 */
export async function compressImageIfNeeded(file) {
  if (typeof window === 'undefined' || !(file instanceof File || file instanceof Blob)) return file;
  
  if (file.size <= 4 * 1024 * 1024 && file.type && file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_WIDTH = 1920;
      const MAX_HEIGHT = 1920;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name || 'image.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}

/**
 * Upload an image file to Firebase Storage with automatic fallback to base64
 */
export async function uploadImageToStorage(file, folder = 'ads', customUserId = null) {
  try {
    if (!file) return null;
    if (typeof file === 'string') return file;

    const processedFile = await compressImageIfNeeded(file);
    const currentUser = auth.currentUser;
    const uid = customUserId || currentUser?.uid || 'user-anon';
    const cleanName = (processedFile.name || 'image.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
    
    const filename = `${folder}/${uid}/${Date.now()}_${cleanName}`;
    const storageRef = ref(storage, filename);
    const metadata = { contentType: processedFile.type || 'image/jpeg' };

    try {
      const snapshot = await uploadBytes(storageRef, processedFile, metadata);
      return await getDownloadURL(snapshot.ref);
    } catch (firstErr) {
      // Alternate path fallback
      const altFolder = folder === 'ads' ? 'products' : (folder === 'products' ? 'ads' : folder);
      if (altFolder !== folder) {
        const altFilename = `${altFolder}/${uid}/${Date.now()}_${cleanName}`;
        const altStorageRef = ref(storage, altFilename);
        const altSnapshot = await uploadBytes(altStorageRef, processedFile, metadata);
        return await getDownloadURL(altSnapshot.ref);
      }
      throw firstErr;
    }
  } catch (err) {
    console.warn("Firebase Storage upload note:", err.message);

    // Fallback: Convert file to Base64 data URL
    if (typeof window !== 'undefined' && (file instanceof File || file instanceof Blob)) {
      try {
        const base64Url = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
        if (base64Url) return base64Url;
      } catch (fallbackErr) {
        console.warn("Base64 fallback failed:", fallbackErr);
      }
    }
    return null;
  }
}

/**
 * Resolve any Firebase Storage path or URL to a displayable browser image
 */
export async function resolveFirebaseImageUrl(pathOrUrl) {
  const fallback = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80';
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return fallback;
  
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('blob:') || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }

  try {
    let cleanPath = pathOrUrl;
    if (pathOrUrl.startsWith('gs://')) {
      const parts = pathOrUrl.split('.app/');
      cleanPath = parts[1] || pathOrUrl;
    }
    const imageRef = ref(storage, cleanPath);
    return await getDownloadURL(imageRef);
  } catch (err) {
    return fallback;
  }
}
