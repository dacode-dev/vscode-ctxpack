const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");
const { mkdtempSync, writeFileSync, mkdirSync, rmSync } = require("node:fs");
const os = require("node:os");

const vscodeMock = require("./vscode-mock.js");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request === "vscode") return path.join(__dirname, "vscode-mock.js");
  return originalResolve.call(this, request, ...args);
};

const dir = mktempRepo();
vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: dir } }];

const ext = require("../dist/extension.js");
const fakeContext = { subscriptions: [] };
ext.activate(fakeContext);

function mktempRepo() {
  const d = mkdtempSync(path.join(os.tmpdir(), "ctxpack-vscode-"));
  mkdirSync(path.join(d, "src"));
  writeFileSync(path.join(d, "src", "a.js"), "console.log('hello');\n");
  writeFileSync(path.join(d, "secret.env"), "API_KEY=supersecretvalue123\n");
  return d;
}

async function run() {
  assert.ok(vscodeMock.__test.registered["ctxpack.packWorkspace"], "packWorkspace registered");
  assert.ok(vscodeMock.__test.registered["ctxpack.packSelection"], "packSelection registered");
  assert.ok(vscodeMock.__test.registered["ctxpack.packGitDiff"], "packGitDiff registered");

  await vscodeMock.__test.registered["ctxpack.packWorkspace"]();
  const clip = vscodeMock.__test.getClipboard();
  assert.match(clip, /# Context pack/, "clipboard has context pack markdown");
  assert.match(clip, /src\/a\.js/, "clipboard includes the real file");
  assert.match(clip, /\[REDACTED/, "secret was redacted");
  assert.ok(!clip.includes("supersecretvalue123"), "raw secret not present");
  console.log("PASS: packWorkspace");

  vscodeMock.__test.reset();
  await vscodeMock.__test.registered["ctxpack.packSelection"](
    { fsPath: path.join(dir, "src", "a.js") },
    []
  );
  const clip2 = vscodeMock.__test.getClipboard();
  assert.match(clip2, /src\/a\.js/, "selection packs the clicked file");
  assert.ok(!clip2.includes("secret.env"), "selection excludes unrelated files");
  console.log("PASS: packSelection");

  rmSync(dir, { recursive: true, force: true });
  console.log("ALL SMOKE TESTS PASSED");
}

run().catch((err) => {
  console.error("SMOKE TEST FAILED:", err);
  process.exit(1);
});
