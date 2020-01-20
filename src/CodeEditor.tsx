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

const hoverProvider: MonacoEditorT.languages.HoverProvider = {
  provideHover: (
    model: MonacoEditorT.editor.ITextModel,
    position: MonacoEditorT.Position,
    token: MonacoEditorT.CancellationToken
  ) => {
    const bns = (window as any).bindings;
    const bName = model.getWordAtPosition(position);

    if (bName && bns && bns[bName.word] !== undefined) {
      let value = JSON.stringify(bns[bName.word]);
      if (value.length > 50) {
        value = value.substring(0, 50) + "...";
      }

      return {
        contents: [{ value }]
      };
    } else {
      return null;
    }
  }
};

monaco.init().then(monaco => {
  monaco.languages.registerDocumentFormattingEditProvider(
    "javascript",
    formatProvider
  );
  monaco.languages.registerHoverProvider("javascript", hoverProvider);
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
  onRun,
  onError
}: {
  initialCode: string;
  onRun: (code: string) => void;
  onError: (error: any) => void;
}) {
  const classes = useStyles({});

  const [isEditorReady, setIsEditorReady] = useState(false);
  const valueGetterRef = useRef<() => string>(() => "");
  const monacoRef = useRef<MonacoEditorT.editor.IStandaloneCodeEditor | null>(
    null
  );

  function handleEditorDidMount(
    getter: () => string,
    editor: MonacoEditorT.editor.IStandaloneCodeEditor
  ) {
    valueGetterRef.current = getter;
    monacoRef.current = editor;

    editor
      .getModel()
      .updateOptions({ insertSpaces: true, indentSize: 2, tabSize: 2 });

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
    onRun(code);
  }

  function handleUndoClick() {}

  function handleRedoClick() {}

  function handleResetClick() {
    monacoRef.current.setValue(initialCode);
  }

  return (
    <>
      <Toolbar variant="dense">
        <div className={classes.spacer} />
        <Button onClick={handleResetClick}>Reset</Button>
        <IconButton color="inherit" onClick={handleUndoClick}>
          <UndoIcon />
        </IconButton>
        <IconButton color="inherit" onClick={handleRedoClick}>
          <RedoIcon />
        </IconButton>
        <Button onClick={handleFormatClick}>Format</Button>
        <IconButton color="inherit" onClick={handleRunClick}>
          <PlayIcon />
        </IconButton>
      </Toolbar>

      <div className={classes.full}>
        <MonacoEditor
          value={initialCode}
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
