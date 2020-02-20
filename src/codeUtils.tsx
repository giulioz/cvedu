import * as prettier from "prettier/standalone";
import parserTypeScript from "prettier/parser-typescript";
import * as Babel from "@babel/standalone";
import preset_env from "@babel/preset-env";
import preset_typescript from "@babel/preset-typescript";
import * as ts from "typescript";
import protect from "./babel-plugin-transform-prevent-infinite-loops";

Babel.registerPreset("@babel/preset-env", preset_env);
Babel.registerPreset("@babel/preset-typescript", preset_typescript);

const MAX_ITERATIONS = 500001;
Babel.registerPlugin("loopProtection", protect(MAX_ITERATIONS));

export function transformCode(source: string) {
  return Babel.transform(source, {
    filename: "file.ts",
    presets: ["@babel/preset-typescript", "@babel/preset-env"],
    plugins: ["loopProtection"],
  }).code;
}

export function formatCode(code: string) {
  return prettier.format(code, {
    parser: "typescript",
    plugins: [parserTypeScript],
  });
}

export function findFunctionName(code: string) {
  const toks = code
    .replace(/(\r\n|\n|\r)/gm, " ")
    .split(" ")
    .filter(tok => tok.length > 1);
  const fnTokI = toks.findIndex(tok => tok === "function");
  if (fnTokI === -1) return null;
  const fnNameToClean = toks[fnTokI + 1];
  if (!fnNameToClean) return null;
  return fnNameToClean.split("(")[0];
}

export function buildGlobalsBinding(globals) {
  const keys = Object.keys(globals);
  const lets = "let " + keys.join(",");
  const prefixed = keys.map(k => "_" + k);

  const setter = `function INIT_ENV(${prefixed.join(",")}){${prefixed
    .map((k, i) => `${keys[i]}=${k}`)
    .join(";")}}`;

  return lets + setter;
}

export function getFunctionFromCode<THandler>(code: string) {
  const processed = transformCode(code);

  const functionName = findFunctionName(code);
  if (!functionName) return null;
  const tail = `;return ${functionName};`;

  const final = processed + tail;
  // console.log(final);

  /* eslint-disable-next-line no-new-func */
  const F = new Function(final)() as THandler;
  return F;
}

// class CheckerCompilerHost implements ts.CompilerHost {
//   files: { [fileName: string]: string } = {};

//   getSourceFile(
//     filename: string,
//     languageVersion: ts.ScriptTarget,
//     onError?: (message: string) => void
//   ): ts.SourceFile {
//     const text = this.files[filename];
//     if (!text) return null;
//     return ts.createSourceFile(filename, text, languageVersion);
//   }
//   getDefaultLibFileName = (options: ts.CompilerOptions) => "lib.d.ts";
//   getDirectories = (path: string) => [];

//   writeFile(
//     filename: string,
//     data: string,
//     writeByteOrderMark: boolean,
//     onError?: (message: string) => void
//   ): void {}
//   getCurrentDirectory = () => "";
//   getCanonicalFileName = (fileName: string) => fileName;
//   useCaseSensitiveFileNames = () => true;
//   getNewLine = () => "\n";
//   fileExists = (fileName: string) => !!this.files[fileName];
//   readFile = (fileName: string) => this.files[fileName];

//   addFile(fileName: string, body: string) {
//     this.files[fileName] = body;
//   }
// }

// const findNode = (n: ts.Node, f: (testNode: ts.Node) => Boolean) => {
//   let result: ts.Node;
//   function findNode(nn: ts.Node) {
//     if (result) {
//       return;
//     }
//     if (f(nn)) {
//       result = nn;
//       return;
//     }
//     ts.forEachChild(nn, findNode);
//   }
//   findNode(n);
//   return result;
// };

// export function compile(scriptName: string, options: ts.CompilerOptions) {
//   const host = new CheckerCompilerHost();
//   host.addFile(scriptName, "const value = 42");

//   const program = ts.createProgram([scriptName], options, host);
//   const typeChecker = program.getTypeChecker();

//   const sf = program.getSourceFile(scriptName);
//   const diagnostics = [].concat(
//     program.getGlobalDiagnostics(),
//     program.getSyntacticDiagnostics(sf),
//     program.getSemanticDiagnostics(sf)
//   );

//   if (diagnostics.length > 0) {
//     const result = diagnostics.map(d => d.messageText).join("\n");
//     return { error: true, output: result, type: null };
//   } else {
//     console.log(typeChecker.getSymbolsInScope(sf, ts.SymbolFlags.Variable)[0]);
//     const node = findNode(
//       sf,
//       (n: ts.Node) => n.kind === ts.SyntaxKind.VariableDeclaration
//     );
//     return {
//       error: false,
//       type: typeChecker.typeToString(typeChecker.getTypeAtLocation(node)),
//     };
//   }
// }

// const settings = ts.getDefaultCompilerOptions();
// settings.diagnostics = true;
// settings.skipLibCheck = true;
// console.log(compile("test.ts", settings));
