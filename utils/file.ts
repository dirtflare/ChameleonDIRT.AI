import { GeneratedImage } from '../types';

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
  // ユーザーが入力したファイル名が正しく適用されるように修正
  // 1. ファイル名が空か確認し、デフォルト値を設定
  const cleanFileName = (fileName || 'generated-image').trim();

  // 2. ファイルシステムで無効な文字をアンダースコアに置換。日本語などは維持する
  const sanitizedFileName = cleanFileName
    .replace(/[\\/:*?"<>|]/g, '_');

  // 3. サニタイズ後に空文字列になった場合に備えて再度デフォルト値を設定
  const finalFileName = sanitizedFileName || 'generated-image';

  const link = document.createElement('a');
  link.href = imageUrl;
  // 4. 最終的なファイル名をdownload属性に設定
  link.download = `${finalFileName}.png`;
  
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