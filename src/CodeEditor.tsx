import React, { useRef, useState } from "react";
import MonacoEditor, { monaco } from "@monaco-editor/react";
import MonacoEditorT from "monaco-editor";

import { formatCode, transformExecTimeout } from "./codeUtils";

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

export default function CodeEditor({ functionName, initialCode }) {
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
    const processed = transformExecTimeout(code);
    const tail = `;return ${functionName};`;
    const final = processed + tail;
    console.log(final);

    const F = new Function(final)();
    const result = F();
    alert(result);
  }

  return (
    <MonacoEditor
      value={editorValue}
      width="100%"
      height="100%"
      language="javascript"
      theme="dark"
      editorDidMount={handleEditorDidMount}
    />
  );
}
