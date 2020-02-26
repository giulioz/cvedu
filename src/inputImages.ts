import { useState, useEffect, useRef } from "react";

const config = [{ url: "/testImage.jpg", label: "Beach" }];

async function fetchImage(url: string) {
  return new Promise<HTMLImageElement>(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.src = url;
  });
}

function getImageData(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  image: HTMLImageElement
) {
  canvas.width = image.width;
  canvas.height = image.height;

  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  return imageData;
}

export function useDefaultInputImages(): [
  (typeof config[0] & { loaded: boolean })[],
  React.RefObject<ImageData[]>
] {
  const [data, setData] = useState(config.map(c => ({ ...c, loaded: false })));

  const imgsRef = useRef<ImageData[]>([]);

  useEffect(() => {
    async function loadImages() {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      const imagesLoaded = await Promise.all(
        config.map(c => fetchImage(c.url))
      );

      imagesLoaded.forEach(
        (img, i) => (imgsRef.current[i] = getImageData(canvas, context, img))
      );

      const newData = config.map((d, i) => ({
        ...d,
        loaded: true,
      }));

      setData(newData);
    }

    loadImages();
  }, []);

  return [data, imgsRef];
}
