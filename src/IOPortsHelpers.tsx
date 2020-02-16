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
