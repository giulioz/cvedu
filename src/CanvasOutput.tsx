import React, { useRef, useCallback } from "react";

import { useWebcam, useAnimLoop } from "./videoUtils";

export default function CanvasOutput<T extends CallableFunction>({
  handler,
  onError
}: {
  handler: T;
  onError: (error: any) => void;
}) {
  const { video } = useWebcam();
  const canvasRef = useRef<HTMLCanvasElement>();

  const animLoop = useCallback(() => {
    const canvas = canvasRef.current;

    if (!video || !canvas) return;
    const context = canvas.getContext("2d");

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      let imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      try {
        const tmp = handler(imageData.data, imageData.width, imageData.height);

        if (tmp) {
          imageData.data.set(tmp);
        }
      } catch (e) {
        onError(e.stack);
        console.error(e);
      }

      context.putImageData(imageData, 0, 0);
    }
  }, [video, handler, onError]);

  useAnimLoop(animLoop);

  return <canvas ref={canvasRef} />;
}
