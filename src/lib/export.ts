import { toPng } from "html-to-image";

function imageToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image blob."));
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export async function preloadImages(
  paths: string[],
  cache: Record<string, string>,
) {
  await Promise.all(
    paths.map(async (path) => {
      if (cache[path]) return;
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Failed to load ${path}`);
      cache[path] = await imageToDataUrl(await response.blob());
    }),
  );
}

async function resizeDataUrl(
  dataUrl: string,
  width: number,
  height: number,
) {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to resize export image.");

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

export function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function captureNode(
  node: HTMLDivElement,
  canvasW: number,
  canvasH: number,
  targetW: number,
  targetH: number,
) {
  const previous = {
    left: node.style.left,
    opacity: node.style.opacity,
    zIndex: node.style.zIndex,
  };

  node.style.left = "0px";
  node.style.opacity = "1";
  node.style.zIndex = "-1";

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  const options = {
    width: canvasW,
    height: canvasH,
    pixelRatio: 1,
    cacheBust: true,
  };

  // Double-render for reliability (matches original pipeline behavior)
  await toPng(node, options);
  const dataUrl = await toPng(node, options);

  node.style.left = previous.left;
  node.style.opacity = previous.opacity;
  node.style.zIndex = previous.zIndex;

  return resizeDataUrl(dataUrl, targetW, targetH);
}
