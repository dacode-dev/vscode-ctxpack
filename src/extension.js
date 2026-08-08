import * as vscode from "vscode";
import { relative } from "path";
import {
  walkRepo,
  getChangedFiles,
  buildFileEntries,
  selectWithinBudget,
  renderMarkdown,
} from "llm-ctxpack/src/lib.js";

function getWorkspaceRoot() {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage("ctxpack: open a folder/workspace first.");
    return null;
  }
  return folders[0].uri.fsPath;
}

function getConfig() {
  const cfg = vscode.workspace.getConfiguration("ctxpack");
  const budget = cfg.get("tokenBudget", 0);
  const redact = cfg.get("redactSecrets", true);
  return { budget: budget > 0 ? budget : null, redact };
}

async function finish(entries, dropped, redactedCount, root, meta = {}) {
  const markdown = renderMarkdown(entries, { root, meta: { ...meta, dropped } });
  await vscode.env.clipboard.writeText(markdown);
  const totalTokens = entries.reduce((s, e) => s + e.tokens, 0);
  let msg = `ctxpack: copied ${entries.length} files (~${totalTokens} tokens) to clipboard.`;
  if (dropped.length) msg += ` Dropped ${dropped.length} files to stay within budget.`;
  if (redactedCount > 0) msg += ` Redacted ${redactedCount} likely secret(s).`;
  vscode.window.showInformationMessage(msg);
}

async function packFiles(root, relFiles) {
  const { budget, redact } = getConfig();
  const { entries, redactedCount } = buildFileEntries(root, relFiles, { redact });
  let selected = entries;
  let dropped = [];
  if (budget) {
    const result = selectWithinBudget(entries, budget);
    selected = result.selected;
    dropped = result.dropped;
  }
  await finish(selected, dropped, redactedCount, root);
}

export function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("ctxpack.packWorkspace", async () => {
      const root = getWorkspaceRoot();
      if (!root) return;
      const relFiles = walkRepo(root);
      await packFiles(root, relFiles);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("ctxpack.packSelection", async (clickedUri, selectedUris) => {
      const root = getWorkspaceRoot();
      if (!root) return;
      const uris = selectedUris && selectedUris.length ? selectedUris : clickedUri ? [clickedUri] : [];
      if (uris.length === 0) {
        vscode.window.showErrorMessage("ctxpack: select one or more files/folders in the explorer first.");
        return;
      }
      const allFiles = walkRepo(root);
      const relSelected = uris.map((u) => relative(root, u.fsPath));
      const filtered = allFiles.filter((f) =>
        relSelected.some((sel) => f === sel || f.startsWith(sel + "/"))
      );
      if (filtered.length === 0) {
        vscode.window.showErrorMessage("ctxpack: no matching files found in the selection.");
        return;
      }
      await packFiles(root, filtered);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("ctxpack.packGitDiff", async () => {
      const root = getWorkspaceRoot();
      if (!root) return;
      const ref = await vscode.window.showInputBox({
        prompt: "Git ref to diff against (e.g. main, HEAD~5)",
        placeHolder: "main",
      });
      if (!ref) return;
      let changed;
      try {
        changed = getChangedFiles(root, ref);
      } catch (err) {
        vscode.window.showErrorMessage(`ctxpack: ${err.message}`);
        return;
      }
      const allFiles = walkRepo(root);
      const relFiles = allFiles.filter((f) => changed.has(f));
      if (relFiles.length === 0) {
        vscode.window.showInformationMessage(`ctxpack: no changed files vs "${ref}".`);
        return;
      }
      const { budget, redact } = getConfig();
      const { entries, redactedCount } = buildFileEntries(root, relFiles, { redact });
      let selected = entries;
      let dropped = [];
      if (budget) {
        const result = selectWithinBudget(entries, budget);
        selected = result.selected;
        dropped = result.dropped;
      }
      await finish(selected, dropped, redactedCount, root, { since: ref });
    })
  );
}

export function deactivate() {}
