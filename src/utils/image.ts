// 上传的图片会以 data URL 存进 localStorage（总共约 5MB），必须先缩小再存

export interface CompressOptions {
  maxSize: number; // 长边像素上限
  quality?: number;
  /** 保留无损 PNG（二维码等需要锐利边缘的图片） */
  lossless?: boolean;
  /** 居中裁成正方形（头像）。导出 PNG 用的 html2canvas 不支持 object-fit，非正方形头像会被拉伸 */
  square?: boolean;
}

const readAsDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode failed'));
    img.src = src;
  });

export const compressImage = async (file: File, { maxSize, quality = 0.85, lossless = false, square = false }: CompressOptions): Promise<string> => {
  const original = await readAsDataUrl(file);
  // GIF 动图压缩会丢帧，SVG 无需压缩，原样保留
  if (/^data:image\/(gif|svg\+xml)/.test(original)) return original;

  let img: HTMLImageElement;
  try {
    img = await loadImage(original);
  } catch {
    return original;
  }

  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const srcW = square ? side : img.naturalWidth;
  const srcH = square ? side : img.naturalHeight;
  const srcX = (img.naturalWidth - srcW) / 2;
  const srcY = (img.naturalHeight - srcH) / 2;
  const scale = Math.min(1, maxSize / Math.max(srcW, srcH));
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return original;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, width, height);

  let result: string;
  if (lossless) {
    result = canvas.toDataURL('image/png');
  } else {
    result = canvas.toDataURL('image/webp', quality);
    // Safari 不支持编码 WebP，会静默回退成 PNG，体积反而更大
    if (!result.startsWith('data:image/webp')) {
      // JPEG 没有透明通道，先垫白底，免得透明区域变黑
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      result = canvas.toDataURL('image/jpeg', quality);
    }
  }
  // 裁切过的图片必须用处理后的结果；否则只在确实变小时才替换
  return square || result.length < original.length ? result : original;
};

export const IMAGE_PRESETS = {
  avatar: { maxSize: 400, square: true },
  qrCode: { maxSize: 600, lossless: true },
  background: { maxSize: 1920, quality: 0.8 },
  gallery: { maxSize: 1080 },
} satisfies Record<string, CompressOptions>;
