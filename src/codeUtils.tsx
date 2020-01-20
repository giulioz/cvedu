import * as prettier from "prettier/standalone";
import parserBabel from "prettier/parser-babylon";
import * as Babel from "@babel/standalone";
import preset_env from "@babel/preset-env";
import preset_typescript from "@babel/preset-typescript";
import protect from "./babel-plugin-transform-prevent-infinite-loops";

function instrumenter({ types, template }) {
  const buildLogger = template(`
    updateBinding("NAME", NAME);
  `);

  return {
    visitor: {
      // VariableDeclaration({ node, scope }) {
      //   console.log(node, scope);
      //   const logger = buildLogger({ NAME: node.declarations[0].id.name });
      //   console.log(logger);
      //   scope.parent.push(logger);
      //   // console.log(node.id.name);
      // }
      // BlockStatement({ node, scope }) {
      //   console.log(node, scope);
      //   Object.keys(scope.bindings).forEach(binding => {
      //     const logger = buildLogger({ NAME: binding });
      //     node.body.push(logger);
      //   });
      // }
    }
  };
}
Babel.registerPlugin("instrumenter", instrumenter);

Babel.registerPreset("@babel/preset-env", preset_env);
Babel.registerPreset("@babel/preset-typescript", preset_typescript);

const MAX_ITERATIONS = 500001;
Babel.registerPlugin("loopProtection", protect(MAX_ITERATIONS));

export function transformCode(source: string) {
  const instrumented = Babel.transform(source, {
    filename: "file.ts",
    presets: ["@babel/preset-typescript"],
    plugins: ["instrumenter"]
  }).code;

  return Babel.transform(instrumented, {
    plugins: ["loopProtection"],
    presets: ["@babel/preset-env"],
    filename: "file.ts"
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

const head = `
window.bindings = {};
function updateBinding(name, value) {
  window.bindings[name] = value;
}`;

export function getFunctionFromCode<THandler>(code: string) {
  const processed = transformCode(code);

  const functionName = findFunctionName(code);
  if (!functionName) return null;
  const tail = `;return ${functionName};`;

  const final = head + processed + tail;
  console.log(final);

  /* eslint-disable-next-line no-new-func */
  const F = new Function(final)() as THandler;
  return F;
}
