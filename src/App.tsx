import React, { useState } from "react";
import ThemeProvider from "@material-ui/styles/ThemeProvider";
import { createMuiTheme, makeStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Grid from "@material-ui/core/Grid";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";

import CodeEditor from "./CodeEditor";
import { formatCode, getFunctionFromCode } from "./codeUtils";

import CanvasOutput from "./CanvasOutput";

import "./globalStyles.css";
const theme = createMuiTheme({
  palette: { type: "dark" },
  overrides: { MuiAppBar: { root: { zIndex: null } } }
});

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
function process(data: Uint8ClampedArray, width: number, height: number) {
  for (let i = 0; i < data.length; i += 4) {
    const rnd = Math.random() * 255;
    data[i + 1] = data[i] * 0.5 + rnd * 0.5;
    data[i + 2] = data[i + 1] * 0.5 + rnd * 0.5;
    data[i + 3] = 255;
  }
}`);

type Handler = (
  data: Uint8ClampedArray,
  width: number,
  height: number
) => Uint8ClampedArray | void;

export default function App() {
  const classes = useStyles({});

  const [handler, setHandler] = useState<Handler>(() =>
    getFunctionFromCode<Handler>(initialCode)
  );
  function handleRun(code: string) {
    setCurrentError("");

    try {
      const F = getFunctionFromCode<Handler>(code);
      // WARNING: we are dealing with functions, this messes with React state setters
      setHandler(() => F);
    } catch (e) {
      setCurrentError(String(e));
    }
  }

  const [currentError, setCurrentError] = useState(null);
  function handleError(error: any) {
    if (String(error) !== currentError) {
      setCurrentError(String(error));
    }

    setHandler(() => () => {});
  }
  function handleCloseError() {
    setCurrentError(null);
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
            <CanvasOutput handler={handler} onError={handleError} />
          </Grid>
          <Grid item xs={6}>
            <CodeEditor
              initialCode={initialCode}
              onRun={handleRun}
              onError={handleError}
            />
          </Grid>
        </Grid>

        <Snackbar
          open={Boolean(currentError)}
          autoHideDuration={6000}
          onClose={handleCloseError}
        >
          <Alert
            severity="error"
            elevation={6}
            variant="filled"
            onClose={handleCloseError}
          >
            <AlertTitle>Error:</AlertTitle>
            <pre>{currentError}</pre>
          </Alert>
        </Snackbar>
      </ThemeProvider>
    </>
  );
}
