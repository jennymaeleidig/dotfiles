"use strict";

const vscode = require("vscode");

const TERM_NAME = "pi";

// Pi-specific environment marker: identifies terminals this launcher owns,
// distinct from the retired opencode extension's OPENCODE_CALLER marker.
const PI_CALLER = { PI_CALLER: "vscode" };

function workspaceRoot() {
  const folder = vscode.workspace.workspaceFolders?.[0];
  return folder ? folder.uri.fsPath : undefined;
}

function activate(context) {
  const disposable = vscode.commands.registerCommand("pi.launch", () => {
    const terminal = vscode.window.createTerminal({
      name: TERM_NAME,
      cwd: workspaceRoot(),
      env: PI_CALLER,
    });
    terminal.show();
    terminal.sendText("pi");
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = { activate, deactivate };