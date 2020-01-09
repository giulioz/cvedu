import React, { useRef, useEffect } from "react";
import * as jsfeat from "jsfeat";

import { useWebcam } from "./videoUtils";

export default function CanvasOutput({ handler }: { handler: any }) {
  const { video, handleStart } = useWebcam();
  const canvasRef = useRef<HTMLCanvasElement>();

  const matRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!video || !canvas) return;
    const context = canvas.getContext("2d");

    function loop() {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        if (!matRef.current) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          matRef.current = new jsfeat.matrix_t(
            canvas.width,
            canvas.height,
            jsfeat.U8C1_t
          );
        }

        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        try {
          handler(
            imageData.data,
            canvas.width,
            canvas.height,
            matRef.current,
            jsfeat.imgproc
          );
        } catch (e) {
          console.error(e);
        }

        const data_u32 = new Uint32Array(imageData.data.buffer);
        const alpha = 0xff << 24;
        let i = matRef.current.cols * matRef.current.rows;
        let pix = 0;
        while (--i >= 0) {
          pix = matRef.current.data[i];
          data_u32[i] = alpha | (pix << 16) | (pix << 8) | pix;
        }

        context.putImageData(imageData, 0, 0);
      }

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animRef.current);
  }, [video, handler]);

  return <canvas ref={canvasRef} />;
}
