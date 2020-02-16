import React, { useEffect, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(theme => ({
  numberHelper: {},
  stringHelper: {},
  imageHelper: {},
}));

export function NumberIOHelper({ value }: { value: number }) {
  const classes = useStyles({});

  return <div className={classes.numberHelper}>{value.toFixed(2)}</div>;
}

export function StringIOHelper({ value }: { value: string }) {
  const classes = useStyles({});

  return <div className={classes.stringHelper}>{value}</div>;
}

export function ImageIOHelper({ value }: { value: ImageData }) {
  const classes = useStyles({});

  const aspect = value.height / value.width;
  const width = 50;
  const height = width * aspect;

  const canvasRef = useRef<HTMLCanvasElement>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      context.putImageData(value, 0, 0);
    }
  }, [value, width, height]);

  return (
    <div className={classes.imageHelper}>
      <canvas
        width={value.width}
        height={value.height}
        ref={canvasRef}
        style={{ width, height }}
      ></canvas>
    </div>
  );
}

export function MaskIOHelper({
  value,
}: {
  value: { data: boolean[]; width: number; height: number };
}) {
  const classes = useStyles({});

  const aspect = value.height / value.width;
  const width = 50;
  const height = width * aspect;

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
  }, [value, width, height]);

  return (
    <div className={classes.imageHelper}>
      <canvas
        width={value.width}
        height={value.height}
        ref={canvasRef}
        style={{ width, height }}
      ></canvas>
    </div>
  );
}
