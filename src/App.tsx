import React, { useRef, useState, useEffect } from "react";
import ThemeProvider from "@material-ui/styles/ThemeProvider";
import { createMuiTheme, makeStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Grid from "@material-ui/core/Grid";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { Canvas } from "react-three-fiber";
import * as jsfeat from "jsfeat";

import CodeEditor from "./CodeEditor";
import { formatCode } from "./codeUtils";

import "./globalStyles.css";
import FullscreenQuad from "./FullscreenQuad";
const theme = createMuiTheme({ palette: { type: "dark" } });

function useWebcam() {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    async function init() {
      if (!video) {
        const el = document.createElement("video");
        el.setAttribute("playsinline", "true");

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false
        });
        el.srcObject = mediaStream;

        setVideo(el);
      }
    }

    init();
  }, [video]);

  function onStart() {
    video.play();
  }

  return { video, onStart };
}

const useStyles = makeStyles(theme => ({
  full: {
    flexGrow: 1,
    height: "100%"
  },
  fullHeight: {
    height: "100%"
  },
  title: {
    flexGrow: 1
  }
}));

const functionName = "processFrame";
const initialCode = formatCode(`function ${functionName}() { return 0; }`);
type Handler = () => void;

export default function App() {
  const classes = useStyles({});

  const [currentHandler, setCurrentHandler] = useState<Handler>(() => {});

  function handleRun(fn: Handler) {
    setCurrentHandler(fn);
  }

  const webcam = useWebcam();

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" className={classes.title}>
              CvEducation
            </Typography>
          </Toolbar>
        </AppBar>
        <Grid container className={classes.full}>
          <Grid item xs={6} className={classes.fullHeight}>
            <Canvas>
              <FullscreenQuad texture={} />
            </Canvas>
          </Grid>
          <Grid item xs={6}>
            <CodeEditor
              functionName={functionName}
              initialCode={initialCode}
              onRun={handleRun}
            />
          </Grid>
        </Grid>
      </ThemeProvider>
    </>
  );
}
