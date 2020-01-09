import React, { useRef, useState } from "react";
import MonacoEditor, { monaco } from "@monaco-editor/react";
import MonacoEditorT from "monaco-editor";
import { Toolbar, Button, IconButton } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import PlayIcon from "@material-ui/icons/PlayArrow";
import UndoIcon from "@material-ui/icons/Undo";
import RedoIcon from "@material-ui/icons/Redo";

import { formatCode } from "./codeUtils";

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

  // monaco.languages.registerDocumentRangeFormattingEditProvider(
  //   "javascript",
  //   formatProvider
  // );
  // monaco.languages.registerOnTypeFormattingEditProvider(
  //   "javascript",
  //   formatProvider
  // );
});

const useStyles = makeStyles(theme => ({
  spacer: {
    flexGrow: 1
  },
  full: {
    height: "100%"
  }
}));

export default function CodeEditor({
  initialCode,
  onRun
}: {
  initialCode: string;
  onRun: (code: string) => void;
}) {
  const classes = useStyles({});

  const [isEditorReady, setIsEditorReady] = useState(false);
  const [editorValue, setEditorValue] = useState(initialCode);
  const valueGetterRef = useRef<() => string>(() => "");

  function handleEditorDidMount(getter: () => string) {
    setIsEditorReady(true);
    valueGetterRef.current = getter;
  }

  function handleFormatClick() {
    const code = valueGetterRef.current();
    const formatted = formatCode(code);

    setEditorValue(formatted);
  }

  function handleRunClick() {
    const code = valueGetterRef.current();
    onRun(code);
  }

  function handleUndoClick() {}
  
  function handleRedoClick() {}

  function handleResetClick() {
    setEditorValue(initialCode);
  }

  return (
    <>
      <Toolbar variant="dense">
        <div className={classes.spacer} />
        <Button onClick={handleResetClick}>Reset</Button>
        <IconButton edge="start" color="inherit" onClick={handleUndoClick}>
          <UndoIcon />
        </IconButton>
        <IconButton edge="start" color="inherit" onClick={handleRedoClick}>
          <RedoIcon />
        </IconButton>
        <Button onClick={handleFormatClick}>Format</Button>
        <IconButton edge="start" color="inherit" onClick={handleRunClick}>
          <PlayIcon />
        </IconButton>
      </Toolbar>

      <div className={classes.full}>
        <MonacoEditor
          value={editorValue}
          width="100%"
          height="100%"
          language="javascript"
          theme="dark"
          options={{ minimap: { enabled: false } }}
          editorDidMount={handleEditorDidMount}
        />
      </div>
    </>
  );
}
