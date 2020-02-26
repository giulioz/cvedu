import { useState, useEffect } from "react";

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

export function useDefaultInputImages(): (typeof config[0] & {
  image: HTMLImageElement;
  imageData: ImageData;
})[] {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadImages() {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      const loadedImages = await Promise.all(
        config.map(c => fetchImage(c.url))
      );

      const newData = config.map((d, i) => ({
        ...d,
        image: loadedImages[i],
        imageData: getImageData(canvas, context, loadedImages[i]),
      }));

      setData(newData);
    }

    loadImages();
  }, []);

  return data;
}
