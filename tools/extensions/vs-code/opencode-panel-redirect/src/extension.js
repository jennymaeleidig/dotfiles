"use strict";

const vscode = require("vscode");

const TERM_NAME = "opencode";

function randomPort() {
  return Math.floor(Math.random() * 49152) + 16384;
}

function isEditorLocation(loc) {
  if (loc === vscode.TerminalLocation.Editor) return true;
  if (typeof loc === "object" && loc !== null && "viewColumn" in loc)
    return true;
  return false;
}

function currentFileRef() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return undefined;
  const doc = editor.document;
  if (!vscode.workspace.getWorkspaceFolder(doc.uri)) return undefined;
  let ref = `@${vscode.workspace.asRelativePath(doc.uri)}`;
  const sel = editor.selection;
  if (!sel.isEmpty) {
    const start = sel.start.line + 1;
    const end = sel.end.line + 1;
    ref += start === end ? `#L${start}` : `#L${start}-${end}`;
  }
  return ref;
}

async function waitForServer(port, tries) {
  for (let i = 0; i < tries; i++) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    try {
      await fetch(`http://localhost:${port}/app`);
      return true;
    } catch {}
  }
  return false;
}

async function injectFileRef(port, ref) {
  try {
    await fetch(`http://localhost:${port}/tui/append-prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `In ${ref}` }),
    });
  } catch {}
}

function activate(context) {
  const disposable = vscode.window.onDidOpenTerminal((terminal) => {
    const opts = terminal.creationOptions;
    if (!isEditorLocation(opts.location)) return;
    if (opts.env && opts.env.OPENCODE_CALLER !== "vscode") return;
    if (!terminal.name.toLowerCase().includes(TERM_NAME)) return;

    const port = randomPort();
    const ref = currentFileRef();

    terminal.dispose();

    const panel = vscode.window.createTerminal({
      name: TERM_NAME,
      location: vscode.TerminalLocation.Panel,
      env: {
        _EXTENSION_OPENCODE_PORT: String(port),
        OPENCODE_CALLER: "vscode",
      },
    });
    panel.show();
    panel.sendText(`opencode --port ${port}`);

    if (ref) {
      waitForServer(port, 25).then((up) => {
        if (up) injectFileRef(port, ref);
      });
    }
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = { activate, deactivate };
