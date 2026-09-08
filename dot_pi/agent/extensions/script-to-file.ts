// SPDX-License-Identifier: CC0-1.0
// script-to-file: enforce the "temp file, then execute" pattern for multi-line
// scripts run through the bash tool.
//
// Why: inline heredocs (`python3 - <<'PY' … PY`) and multi-line `-c`/`-e` blobs
// collide with the OS-level sandbox fence and get retried in loops, burning
// tokens. Prompts can't fix that deterministically; this extension rewrites or
// vetoes the command mechanically before it spawns (pi guarantees mutations to
// `event.input.command` affect actual execution).
//
// - Whole-command heredocs feeding an interpreter: rewritten byte-for-byte to
//   `cat > /tmp/pi-script-<rand>.<ext> <<'D' … D` + execute — no quote parsing
//   needed. Plain newline-separated sequence (CC Safety Net's shell parser only
//   supports heredocs on ordinary commands, NOT inside { …; } groups).
//   Target is /tmp, never $TMPDIR: the seatbelt profile does not expand $TMPDIR
//   (empirically EPERM), while /tmp writes succeed under the fence. umask 077
//   keeps the staged script private (/tmp is world-readable).
// - Multi-line `-c`/`-e` bodies: vetoed with a corrective reason (one blocked
//   call replaces the EPERM retry loop).
// - Genuine one-liners and everything else: untouched.

import { isToolCallEventType, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { randomBytes } from "node:crypto";

const EXT: Record<string, string> = {
	python3: "py",
	python: "py",
	node: "mjs",
	ruby: "rb",
	perl: "pl",
	bash: "sh",
	sh: "sh",
	zsh: "sh",
};

const INTERPRETERS = Object.keys(EXT).join("|");

// Whole command is a heredoc feeding an interpreter, e.g.:
//   python3 - <<'PY'\n…\nPY
//   node <<EOF\n…\nEOF
const HEREDOC = new RegExp(
	`^\\s*(?:sudo\\s+)?(?:[\\w./-]+/)?(${INTERPRETERS})\\s+(?:-\\s+)?<<-?\\s*(['"]?)([A-Za-z_]\\w*)\\2\\s*\\n([\\s\\S]*?)\\n\\3\\s*$`,
);

// Interpreter invoked with a quoted -c/-e body, e.g. `python3 -c '…'`, `node -e "…"`.
const INLINE_C = new RegExp(
	`^\\s*(?:sudo\\s+)?(?:[\\w./-]+/)?(${INTERPRETERS})\\s+(?:-{1,2}[\\w-]+\\s+)*-(?:c|e)\\s+(["'])([\\s\\S]+)\\2\\s*$`,
);

const BLOCK_REASON =
	"Inline multi-line scripts are disabled by sandbox policy. " +
	"Write the script to a file (e.g. $TMPDIR/script.py) with the write tool, then execute it. " +
	"Genuine one-liners (no newlines) may stay inline.";

export default function scriptToFile(pi: ExtensionAPI) {
	pi.on("tool_call", (event) => {
		if (!isToolCallEventType("bash", event)) return;
		const cmd = event.input.command;
		if (!cmd) return;

		// Case 1: heredoc → rewrite byte-preserving into file + execute.
		const heredoc = cmd.match(HEREDOC);
		if (heredoc) {
			const [, interp, , delim, body] = heredoc;
			const ext = EXT[interp] ?? "txt";
			const tmp = `/tmp/pi-script-${randomBytes(4).toString("hex")}.${ext}`;
			event.input.command = `umask 077\ncat > '${tmp}' <<'${delim}'\n${body}\n${delim}\n${interp} '${tmp}'`;
			return;
		}

		// Case 2: multi-line -c/-e body → veto with the corrective reason.
		const inline = cmd.match(INLINE_C);
		if (inline && inline[3].includes("\n")) {
			return { block: true, reason: BLOCK_REASON };
		}
	});
}
