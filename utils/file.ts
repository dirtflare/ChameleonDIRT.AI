import JSZip from 'jszip';
import { GeneratedImage } from '../types';

/**
 * ブラウザでのプレビュー表示とGemini APIへの送信の両方が可能な形式のみを許可する。
 * HEIC/HEIFはGemini側では扱えるが、Safari以外ではプレビューが表示できないため除外している。
 */
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

/** base64化すると約1.33倍に膨らむため、リクエストサイズを考慮した上限 */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export type ImageValidationResult =
  | { valid: true }
  | { valid: false; message: string };

/**
 * アップロードされたファイルを検証する。
 * input要素の`accept`属性はドラッグ&ドロップを素通しするため、両方の経路でこの関数を通す必要がある。
 */
export const validateImageFile = (file: File | null | undefined): ImageValidationResult => {
  if (!file) {
    return { valid: false, message: '画像ファイルが選択されていません。' };
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as typeof ACCEPTED_IMAGE_TYPES[number])) {
    return {
      valid: false,
      message: `対応していないファイル形式です。PNG、JPEG、WebPのいずれかを選択してください。`,
    };
  }

  if (file.size === 0) {
    return { valid: false, message: 'ファイルが空です。別の画像を選択してください。' };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    const limitMb = Math.round(MAX_IMAGE_BYTES / 1024 / 1024);
    return {
      valid: false,
      message: `ファイルサイズが大きすぎます。${limitMb}MB以下の画像を選択してください。`,
    };
  }

  return { valid: true };
};

/**
 * ファイルシステムで無効な文字をアンダースコアに置換する。日本語などは維持する。
 * 空文字になった場合はデフォルト名を返す。
 */
export const sanitizeFileName = (fileName: string, fallback = 'generated-image'): string => {
  const sanitized = (fileName || '').trim().replace(/[\\/:*?"<>|]/g, '_');
  return sanitized || fallback;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('ファイルのbase64文字列としての読み込みに失敗しました。'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const downloadImage = (imageUrl: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = `${sanitizeFileName(fileName)}.png`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


export const downloadAllAsZip = async (images: GeneratedImage[]) => {
  const zip = new JSZip();
  
  images.forEach((image, index) => {
    const fileName = image.prompt.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 50) || `画像-${index + 1}`;
    const base64Data = image.imageUrl.split(',')[1];
    zip.file(`${fileName}.png`, base64Data, { base64: true });
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = 'gemini-バリエーション.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const resizeImage = (imageUrl: string, width: number, height: number): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.max(hRatio, vRatio);
      const centerShift_x = (canvas.width - img.width * ratio) / 2;
      const centerShift_y = (canvas.height - img.height * ratio) / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
      
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = imageUrl;
  });
};


export const resizeAndExportAll = async (images: GeneratedImage[], width: number, height: number, zipName: string) => {
    const zip = new JSZip();

    const resizePromises = images.map(async (image, index) => {
        const resizedImageUrl = await resizeImage(image.imageUrl, width, height);
        const fileName = image.prompt.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 50) || `image-${index + 1}`;
        const base64Data = resizedImageUrl.split(',')[1];
        zip.file(`${fileName}.jpeg`, base64Data, { base64: true });
    });

    await Promise.all(resizePromises);

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${zipName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}