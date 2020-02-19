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

  function handleStart() {
    video.play();
  }

  return { video, handleStart };
}
