import React, { useRef, useState } from "react";
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
import MonacoEditor, { monaco } from "@monaco-editor/react";
import MonacoEditorT from "monaco-editor";
import * as prettier from "prettier/standalone";
import parserBabel from "prettier/parser-babylon";
import * as Babel from "@babel/standalone";
import * as protect from "loop-protect";

import "./globalStyles.css";
const theme = createMuiTheme({ palette: { type: "dark" } });

const timeout = 1000;
Babel.registerPlugin("loopProtection", protect(timeout));

function formatCode(code: string) {
  return prettier.format(code, {
    parser: "babel",
    plugins: [parserBabel]
  });
}
const formatProvider: MonacoEditorT.languages.DocumentFormattingEditProvider = {
  displayName: "Prettier",
  provideDocumentFormattingEdits: (
    model: MonacoEditorT.editor.ITextModel,
    options: MonacoEditorT.languages.FormattingOptions,
    token: MonacoEditorT.CancellationToken
  ) => {
    const code = model.getValue();
    const formatted = formatCode(code);
    const textEdit = [
      {
        range: {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: formatted.split("\n").length + 1,
          endColumn: 999
        },
        text: formatted
      }
    ];

    return textEdit;
  }
};
monaco.init().then(monaco => {
  monaco.languages.registerDocumentFormattingEditProvider(
    "javascript",
    formatProvider
  );
});

const useStyles = makeStyles(theme => ({
  full: {
    flexGrow: 1,
    height: "100%"
  },
  title: {
    flexGrow: 1
  }
}));

const initialCode = "function test() { return 0; }";

export default function App() {
  const classes = useStyles({});

  const [isEditorReady, setIsEditorReady] = useState(false);
  const [editorValue, setEditorValue] = useState(initialCode);
  const valueGetterRef = useRef<() => string>(() => "");
  const monacoRef = useRef<MonacoEditorT.editor.IStandaloneCodeEditor | null>(
    null
  );

  function handleEditorDidMount(
    getter: () => string,
    monaco: MonacoEditorT.editor.IStandaloneCodeEditor
  ) {
    setIsEditorReady(true);
    valueGetterRef.current = getter;
    monacoRef.current = monaco;

    if (monaco) {
      // monaco.languages.registerDocumentRangeFormattingEditProvider(
      //   "javascript",
      //   formatProvider
      // );
      // monaco.languages.registerOnTypeFormattingEditProvider(
      //   "javascript",
      //   formatProvider
      // );
    }
  }

  function handleFormatClick() {
    const code = valueGetterRef.current();
    const formatted = formatCode(code);

    setEditorValue(formatted);
  }

  function handleRunClick() {
    const code = valueGetterRef.current();

    const transform = (source: string) =>
      Babel.transform(source, {
        plugins: ["loopProtection"]
      }).code;
    const processed = transform(code);
    console.log(processed);

    const F = new Function(processed);
    const result = F();
    alert(result);
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
            <Button onClick={handleFormatClick}>Format</Button>
            <IconButton edge="start" color="inherit" onClick={handleRunClick}>
              <PlayIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Grid container className={classes.full}>
          <Grid item xs={6}>
            Output
          </Grid>
          <Grid item xs={6}>
            <MonacoEditor
              value={editorValue}
              width="100%"
              height="100%"
              language="javascript"
              theme="dark"
              editorDidMount={handleEditorDidMount}
            />
          </Grid>
        </Grid>
      </ThemeProvider>
    </>
  );
}
