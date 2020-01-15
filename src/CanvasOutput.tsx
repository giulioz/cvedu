import React, { useRef, useCallback } from "react";

import { useWebcam, useAnimLoop } from "./videoUtils";

export default function CanvasOutput({
  handler,
  onError
}: {
  handler: any;
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
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      try {
        handler(imageData.data, canvas.width, canvas.height);
      } catch (e) {
        onError(e);
        console.error(e);
      }

      context.putImageData(imageData, 0, 0);
    }
  }, [video, handler, onError]);

  useAnimLoop(animLoop);

  return <canvas ref={canvasRef} />;
}
