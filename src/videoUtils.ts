import { useState, useEffect, useRef } from "react";

export function useAnimLoop(callbackBuild: () => (time: number) => void) {
  const animRef = useRef(null);

  useEffect(() => {
    const fn = callbackBuild();

    function loop(time: number) {
      fn(time);
      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animRef.current);
  }, [callbackBuild]);
}

export function useWebcam() {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    async function init() {
      if (!video) {
        const el = document.createElement("video");
        el.setAttribute("playsinline", "true");
        el.setAttribute("autoplay", "true");

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        el.srcObject = mediaStream;

        setVideo(el);
      }
    }

    init();
  }, [video]);

  return video;
}

export function maskToImageData(mask: {
  data: boolean[];
  width: number;
  height: number;
}) {
  const newData = new ImageData(mask.width, mask.height);

  mask.data.forEach((d, i) => {
    newData.data[i * 4] = d ? 255 : 0;
    newData.data[i * 4 + 1] = d ? 255 : 0;
    newData.data[i * 4 + 2] = d ? 255 : 0;
    newData.data[i * 4 + 3] = 255;
  });

  return newData;
}

export function accumulatorToImageData(acc: {
  data: number[];
  width: number;
  height: number;
  alpha_steps: number;
  r_steps: number;
}) {
  const newData = new ImageData(acc.width, acc.height);
  const max = Math.max(...acc.data);

  for (let i = 0; i < newData.data.length; i += 4) {
    const pos = i / 4;
    const px = pos % acc.width;
    const py = Math.floor(pos / acc.width);
    const aPos = Math.round((px / acc.width) * acc.alpha_steps);
    const rPos = Math.round((py / acc.height) * acc.r_steps);

    const d = acc.data[aPos + rPos * acc.alpha_steps];
    newData.data[i] = (d / max) * 255;
    newData.data[i + 1] = (d / max) * 255;
    newData.data[i + 2] = (d / max) * 255;
    newData.data[i + 3] = 255;
  }

  return newData;
}
