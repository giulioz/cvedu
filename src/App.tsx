import React, { useRef, useState, useEffect } from "react";
import ThemeProvider from "@material-ui/styles/ThemeProvider";
import { createMuiTheme, makeStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import PlayIcon from "@material-ui/icons/PlayArrow";
import * as jsfeat from "jsfeat";

import CodeEditor from "./CodeEditor";
import { formatCode } from "./codeUtils";

import "./globalStyles.css";
const theme = createMuiTheme({ palette: { type: "dark" } });

function useWebcam() {
  const [video, setVideo] = useState();

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
  title: {
    flexGrow: 1
  }
}));

const functionName = "processFrame";
const initialCode = formatCode(`function ${functionName}() { return 0; }`);

export default function App() {
  const classes = useStyles({});

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" className={classes.title}>
              CvEducation
            </Typography>
            {/* <Button onClick={handleFormatClick}>Format</Button>
            <IconButton edge="start" color="inherit" onClick={handleRunClick}>
              <PlayIcon />
            </IconButton> */}
          </Toolbar>
        </AppBar>
        <Grid container className={classes.full}>
          <Grid item xs={6}>
            Output
          </Grid>
          <Grid item xs={6}>
            <CodeEditor functionName={functionName} initialCode={initialCode} />
          </Grid>
        </Grid>
      </ThemeProvider>
    </>
  );
}
