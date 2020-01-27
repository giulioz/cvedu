import React, { useRef, useCallback, useState } from "react";
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
  },
  canvas: {
    maxWidth: "100%",
    maxHeight: "100%",
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

export default function CanvasOutput<T extends CallableFunction>({
  handler,
  onError,
  title,
}: {
  handler: T;
  onError: (error: any) => void;
  title: string;
}) {
  const classes = useStyles({});

  const { video } = useWebcam();
  const [pausedFrame, setPausedFrame] = useState<null | ImageData>(null);
  const canvasRef = useRef<HTMLCanvasElement>();

  function handleTogglePlay() {
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
  }

  const videoReady = useRef(false);

  const animLoop = useCallback(() => {
    const canvas = canvasRef.current;

    if (!video || !canvas || !handler) return () => {};
    const context = canvas.getContext("2d");

    return () => {
      if (pausedFrame) {
        const imageData = pausedFrame;

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
      } else if (video.readyState === video.HAVE_ENOUGH_DATA) {
        if (!videoReady.current) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          videoReady.current = true;
        }

        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

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
  }, [video, handler, onError, pausedFrame]);

  useAnimLoop(animLoop);

  return (
    <div className={classes.root}>
      <div className={classes.title}>{title}</div>
      <canvas className={classes.canvas} ref={canvasRef} />
      <div className={classes.controls}>
        <IconButton onClick={handleTogglePlay}>
          {pausedFrame ? <PlayIcon /> : <PauseIcon />}
        </IconButton>
      </div>
    </div>
  );
}
