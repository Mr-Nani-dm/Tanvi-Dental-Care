#!/usr/bin/env node
"use strict";

// Small test-only TypeScript loader: production imports and auth remain unchanged.
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { spawnSync } = require("node:child_process");
const ts = require("typescript");
const repository = path.resolve(__dirname, "..");

if (!process.env.TANVI_CONTENT_TEST_CHILD) {
  const files = process.argv.slice(2);
  const testFiles = files.length ? files : fs.readdirSync(path.join(repository, "tests"))
    .filter((name) => name.endsWith(".test.ts"))
    .map((name) => path.join(repository, "tests", name));
  if (!testFiles.length) throw new Error("No content tests were found.");
  const result = spawnSync(process.execPath, ["--require", __filename, "--test", "--test-concurrency=1", ...testFiles], {
    cwd: repository,
    env: { ...process.env, TANVI_CONTENT_TEST_CHILD: "1" },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...options) {
  return resolveFilename.call(this, request.startsWith("@/") ? path.join(repository, "src", request.slice(2)) : request, parent, ...options);
};

require.extensions[".ts"] = function (module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
  });
  module._compile(compiled.outputText, filename);
};
