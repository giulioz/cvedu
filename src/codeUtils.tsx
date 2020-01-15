import * as prettier from "prettier/standalone";
import parserBabel from "prettier/parser-babylon";
import * as Babel from "@babel/standalone";
import * as protect from "loop-protect";

export const executionTimeout = 1000;
Babel.registerPlugin("loopProtection", protect(executionTimeout));

export function transformExecTimeout(source: string) {
  return Babel.transform(source, {
    plugins: ["loopProtection"]
  }).code;
}

export function formatCode(code: string) {
  return prettier.format(code, {
    parser: "babel",
    plugins: [parserBabel]
  });
}

export function findFunctionName(code: string) {
  const toks = code.split(" ").filter(tok => tok.length > 1);
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
  const functionName = findFunctionName(code);
  if (!functionName) return null;
  const processed = transformExecTimeout(code);
  const tail = `;return ${functionName};`;
  const final = processed + tail;

  console.log(final);

  /* eslint-disable-next-line no-new-func */
  const F = new Function(final)() as THandler;
  return F;
}
