# ctxpack: LLM Context Packer

Pack files, a folder, or a git diff into LLM-ready context — straight to your clipboard. No more manually opening files one by one to paste into a chat window.

## Commands

- **ctxpack: Pack Selected Files/Folders for LLM Context** — right-click one or more files/folders in the Explorer
- **ctxpack: Pack Entire Workspace for LLM Context** — packs everything (respecting `.gitignore`)
- **ctxpack: Pack Git Diff for LLM Context** — prompts for a git ref (e.g. `main`), packs only what changed since then

All available from the Command Palette (`Cmd/Ctrl+Shift+P`) or the Explorer right-click menu.

## Install

Download the [v1.1.0 VSIX release](https://github.com/dacode-dev/vscode-ctxpack/releases/tag/v1.1.0), then in VS Code open Extensions → `...` → **Install from VSIX**. Marketplace publication is separate; the release artifact is available now without a publisher account.

## Features

- **Secret redaction by default** — API keys, private key blocks, env-style credentials, GitLab/npm/HuggingFace/Vercel/Linear/SendGrid/Twilio tokens, OpenAI `sk-proj-` keys, and passwords embedded in database connection URLs (`postgres://user:[REDACTED]@host`) are redacted before anything touches your clipboard. Turn off with `ctxpack.redactSecrets: false`.
- **Token budget** — set `ctxpack.tokenBudget` to cap output size; keeps the most recently modified files and tells you what got dropped.
- **Respects `.gitignore`** — plus sensible defaults (`node_modules`, lockfiles, binaries, build output).

## Settings

| Setting | Default | Description |
|---|---|---|
| `ctxpack.tokenBudget` | `0` (no limit) | Cap total output tokens |
| `ctxpack.redactSecrets` | `true` | Redact likely secrets before copying |

## Also available as a CLI

Same engine, for the terminal: [`llm-ctxpack`](https://www.npmjs.com/package/llm-ctxpack) — `npx llm-ctxpack --help`

**More from dacode-dev:** [Token Counter](https://dacode-dev.github.io/token-counter.html) (browser-based, no upload) · [Agent Context API](https://dacode-dev.github.io/agent-context-api.html) (pay-per-call context checks over x402) · [x402 Services Directory](https://dacode-dev.github.io/x402-services-directory/)

## Support

Free, MIT-licensed, no paid tier. If it saves you time: [dacode-dev.github.io](https://dacode-dev.github.io/) (QR code + address). Claude Code users can use the same page to unlock the private Power Pack Pro bonus commands/agents after a crypto tip; fulfillment is automated through a transaction-hash claim.
