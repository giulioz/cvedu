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
