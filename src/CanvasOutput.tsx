import React, { useRef, useCallback, Props } from "react";

import { useWebcam, useAnimLoop } from "./videoUtils";

export default function CanvasOutput<T extends CallableFunction>({
  handler,
  onError,
  ...rest
}: {
  handler: T;
  onError: (error: any) => void;
} & React.HTMLProps<HTMLCanvasElement>) {
  const { video } = useWebcam();
  const canvasRef = useRef<HTMLCanvasElement>();

  const videoReady = useRef(false);

  const animLoop = useCallback(() => {
    const canvas = canvasRef.current;

    if (!video || !canvas) return () => {};
    const context = canvas.getContext("2d");

    return () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        if (!videoReady.current) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          videoReady.current = true;
        }

        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        let imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        try {
          const tmp = handler(
            imageData.data,
            imageData.width,
            imageData.height
          );

          if (tmp) {
            imageData.data.set(tmp);
          }
        } catch (e) {
          onError(e.stack);
          console.error(e);
        }

        context.putImageData(imageData, 0, 0);
      }
    };
  }, [video, handler, onError]);

  useAnimLoop(animLoop);

  return <canvas ref={canvasRef} {...rest} />;
}
