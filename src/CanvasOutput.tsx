import React, { useRef, useCallback, useState } from "react";
import { useAutoMemo, useAutoCallback } from "hooks.macro";
import { makeStyles } from "@material-ui/styles";
import { Theme, IconButton } from "@material-ui/core";
import PlayIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";

import { useWebcam, useAnimLoop } from "./videoUtils";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    position: "relative",
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  canvas: {
    maxWidth: "100%",
    maxHeight: "100%",
  },
  tooltip: {
    position: "absolute",
    top: theme.spacing(1),
    left: theme.spacing(1),
    zIndex: 1000,
  },
  title: {
    position: "absolute",
    bottom: theme.spacing(1),
    left: theme.spacing(1),
    zIndex: 1000,
  },
  controls: {
    position: "absolute",
    bottom: theme.spacing(1),
    right: theme.spacing(1),
    zIndex: 1000,
  },
}));

export default React.memo(function CanvasOutput({
  handler,
  onError,
  title,
  ...rest
}: {
  handler(data: ImageData): ImageData | null;
  onError: (error: any) => void;
  title: string;
} & any) {
  const classes = useStyles({});

  const video = useWebcam();
  const [pausedFrame, setPausedFrame] = useState<null | ImageData>(null);
  const canvasRef = useRef<HTMLCanvasElement>();

  const [underPixelColor, setUnderPixelColor] = useState();

  const handleMouseMove = useAutoCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = e.target as HTMLCanvasElement;
      const bounds = canvas.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      const data = ctx.getImageData(
        e.clientX - bounds.left,
        e.clientY - bounds.top,
        1,
        1
      ).data;
      const color = data.join(", ");
      setUnderPixelColor(color);
    }
  );

  const handleTogglePlay = useAutoCallback(function handleTogglePlay() {
    setPausedFrame(frame => {
      if (frame) {
        return null;
      } else {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        return imageData;
      }
    });
  });

  const videoReady = useRef(false);

  const animLoop = useCallback(() => {
    const canvas = canvasRef.current;

    if (!video || !canvas || !handler) return () => {};
    const context = canvas.getContext("2d");

    return () => {
      if (pausedFrame) {
        let imageData = pausedFrame;

        try {
          const tmp = handler(imageData);

          if (tmp) {
            if (tmp.width !== canvas.width || tmp.height !== canvas.height) {
              canvas.width = tmp.width;
              canvas.height = tmp.height;
            }

            imageData = tmp;
          }
        } catch (e) {
          onError(e.stack);
          console.error(e);
        }

        context.putImageData(imageData, 0, 0);
      } else if (video.readyState === video.HAVE_ENOUGH_DATA) {
        if (!videoReady.current) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          videoReady.current = true;
        }

        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        let imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        try {
          const tmp = handler(imageData);

          if (tmp) {
            if (tmp.width !== canvas.width || tmp.height !== canvas.height) {
              canvas.width = tmp.width;
              canvas.height = tmp.height;
            }

            imageData = tmp;
          }
        } catch (e) {
          onError(e.stack);
          console.error(e);
        }

        context.putImageData(imageData, 0, 0);
      }
    };
  }, [video, handler, onError, pausedFrame]);

  useAnimLoop(animLoop);

  return (
    <div className={classes.root} {...rest}>
      {underPixelColor && (
        <div className={classes.tooltip}>{underPixelColor}</div>
      )}
      <div className={classes.title}>{title}</div>
      <canvas
        className={classes.canvas}
        onMouseMove={handleMouseMove}
        ref={canvasRef}
      />
      {useAutoMemo(() => (
        <div className={classes.controls}>
          <IconButton onClick={handleTogglePlay}>
            {pausedFrame ? <PlayIcon /> : <PauseIcon />}
          </IconButton>
        </div>
      ))}
    </div>
  );
});
