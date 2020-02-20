import React, { useRef, useState, useLayoutEffect, useEffect } from "react";
import MonacoEditor, { monaco } from "@monaco-editor/react";
import MonacoEditorT from "monaco-editor";
import { Toolbar, Button, IconButton } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import PlayIcon from "@material-ui/icons/PlayArrow";
import UndoIcon from "@material-ui/icons/Undo";
import RedoIcon from "@material-ui/icons/Redo";

import { formatCode } from "./codeUtils";

const formatProvider: MonacoEditorT.languages.DocumentFormattingEditProvider = {
  displayName: "Prettier",
  provideDocumentFormattingEdits(model, options, token) {
    const code = model.getValue();
    const formatted = formatCode(code);
    const textEdit = [
      {
        range: {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: formatted.split("\n").length + 1,
          endColumn: 999,
        },
        text: formatted,
      },
    ];

    return textEdit;
  },
};

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  spacer: {
    flexGrow: 1,
  },
  button: {
    marginLeft: theme.spacing(1),
  },
}));

export default React.memo(function CodeEditor({
  initialCode,
  onRun,
  onReset,
  onSolution,
  onError,
}: {
  initialCode: string;
  onRun: (code: string) => void;
  onReset: () => void;
  onSolution: () => void;
  onError: (error: any) => void;
}) {
  const classes = useStyles({});

  const [isEditorReady, setIsEditorReady] = useState(false);
  const valueGetterRef = useRef<() => string>(() => "");
  const monacoRef = useRef<MonacoEditorT.editor.IStandaloneCodeEditor | null>(
    null
  );

  const globalMonacoRef = useRef<typeof MonacoEditorT | null>(null);
  useLayoutEffect(() => {
    monaco.init().then(monaco => {
      monaco.languages.registerDocumentFormattingEditProvider(
        "typescript",
        formatProvider
      );

      globalMonacoRef.current = monaco;
    });
  }, []);

  const onRunRef = useRef<(code: string) => void | null>(null);
  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  function handleEditorDidMount(
    getter: () => string,
    editor: MonacoEditorT.editor.IStandaloneCodeEditor
  ) {
    valueGetterRef.current = getter;
    monacoRef.current = editor;

    editor
      .getModel()
      .updateOptions({ insertSpaces: true, indentSize: 2, tabSize: 2 });

    editor.addCommand(
      globalMonacoRef.current.KeyMod.CtrlCmd |
        globalMonacoRef.current.KeyCode.KEY_S,
      handleRunClick
    );

    setIsEditorReady(true);
  }

  function handleFormatClick() {
    const code = valueGetterRef.current();

    try {
      const formatted = formatCode(code);
      monacoRef.current.setValue(formatted);
    } catch (e) {
      onError(e);
    }
  }

  function handleRunClick() {
    const code = valueGetterRef.current();
    onRunRef.current(code);
  }

  function handleUndoClick() {
    monacoRef.current.trigger("source", "undo", null);
  }
  function handleRedoClick() {
    monacoRef.current.trigger("source", "redo", null);
  }

  return (
    <div className={classes.root}>
      <Toolbar variant="dense">
        <div className={classes.spacer} />
        <Button className={classes.button} onClick={onSolution}>
          Solution
        </Button>
        <Button className={classes.button} onClick={onReset}>
          Reset
        </Button>
        <IconButton
          size="small"
          color="inherit"
          className={classes.button}
          onClick={handleUndoClick}
        >
          <UndoIcon />
        </IconButton>
        <IconButton
          size="small"
          color="inherit"
          className={classes.button}
          onClick={handleRedoClick}
        >
          <RedoIcon />
        </IconButton>
        <Button className={classes.button} onClick={handleFormatClick}>
          Format
        </Button>
        <IconButton
          size="small"
          color="inherit"
          className={classes.button}
          onClick={handleRunClick}
        >
          <PlayIcon />
        </IconButton>
      </Toolbar>

      <div className={classes.spacer}>
        <MonacoEditor
          value={initialCode}
          width="100%"
          height="100%"
          language="typescript"
          theme="dark"
          options={{ minimap: { enabled: false } }}
          editorDidMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
});
