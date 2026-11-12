export function compressImage(
  file: File,
  callback: (base64: string) => void
): void;
export function compressImage(
  file: File,
  maxSize?: number,
  quality?: number
): Promise<string>;
export function compressImage(
  file: File,
  secondArg?: ((base64: string) => void) | number,
  quality: number = 0.8
): void | Promise<string> {
  const isCallback = typeof secondArg === "function";
  const maxDim = typeof secondArg === "number" ? secondArg : 600;

  const runCompression = (resolve: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = maxDim;
        const MAX_HEIGHT = maxDim;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve(e.target?.result as string);
        }
      };
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  if (isCallback) {
    runCompression(secondArg);
    return;
  }

  return new Promise<string>((resolve) => {
    runCompression(resolve);
  });
}

