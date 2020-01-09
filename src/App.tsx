import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import ThemeProvider from "@material-ui/styles/ThemeProvider";
import { createMuiTheme, makeStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Grid from "@material-ui/core/Grid";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import * as jsfeat from "jsfeat";

import CodeEditor from "./CodeEditor";
import { formatCode, getFunctionFromCode } from "./codeUtils";

import "./globalStyles.css";
import CanvasOutput from "./CanvasOutput";
const theme = createMuiTheme({ palette: { type: "dark" } });

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

const initialCode = formatCode(`
function processFrame(data,width,height,img_u8,imgproc) {
  imgproc.grayscale(data, width, height, img_u8);
  imgproc.gaussian_blur(img_u8, img_u8, 4, 0);
  imgproc.canny(img_u8, img_u8, 40, 80);
}`);
type Handler = (
  data: any,
  width: number,
  height: number,
  img_u8: any,
  imgproc: typeof jsfeat.imgproc
) => void;

export default function App() {
  const classes = useStyles({});

  const [handler, setHandler] = useState<Handler>(() =>
    getFunctionFromCode<Handler>(initialCode)
  );
  function handleRun(code: string) {
    const F = getFunctionFromCode<Handler>(code);
    // WARNING: we are dealing with functions, this messes with React state setters
    setHandler(() => F);
  }

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
            <CanvasOutput handler={handler} />
          </Grid>
          <Grid item xs={6}>
            <CodeEditor initialCode={initialCode} onRun={handleRun} />
          </Grid>
        </Grid>
      </ThemeProvider>
    </>
  );
}
