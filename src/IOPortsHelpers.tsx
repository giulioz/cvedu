import React, { useEffect, useRef } from "react";

export function NumberIOHelper({ value }: { value: number }) {
  return <div>{value.toFixed(2)}</div>;
}

export function StringIOHelper({ value }: { value: string }) {
  return <div>{value}</div>;
}

const canvasWidth = 50;

export function ImageIOHelper({ value }: { value: ImageData }) {
  const aspect = value.height / value.width;
  const height = canvasWidth * aspect;

  const canvasRef = useRef<HTMLCanvasElement>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      context.putImageData(value, 0, 0);
    }
  }, [value]);

  return (
    <div>
      <canvas
        width={value.width}
        height={value.height}
        ref={canvasRef}
        style={{ width: canvasWidth, height }}
      ></canvas>
    </div>
  );
}

export function MaskIOHelper({
  value,
}: {
  value: { data: boolean[]; width: number; height: number };
}) {
  const aspect = value.height / value.width;
  const height = canvasWidth * aspect;

  const canvasRef = useRef<HTMLCanvasElement>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      const imgData = new ImageData(value.width, value.height);
      value.data.forEach((d, i) => {
        imgData.data[i * 4] = d ? 255 : 0;
        imgData.data[i * 4 + 1] = d ? 255 : 0;
        imgData.data[i * 4 + 2] = d ? 255 : 0;
        imgData.data[i * 4 + 3] = 255;
      });
      context.putImageData(imgData, 0, 0);
    }
  }, [value, height]);

  return (
    <div>
      <canvas
        width={value.width}
        height={value.height}
        ref={canvasRef}
        style={{ width: canvasWidth, height }}
      ></canvas>
    </div>
  );
}
