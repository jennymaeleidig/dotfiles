import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { Type } from "typebox"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

type Diagnostic = {
  line: number
  column: number
  message: string
  raw?: string
  suggestion?: string
  fixable?: boolean
  ruleId: string
  severity: "error" | "warning"
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "mermaid_lint",
    label: "Lint Mermaid Diagrams",
    description:
      "Lint every Mermaid diagram in a Markdown or .mmd file. For a .md path it " +
      "extracts every ```mermaid fenced block and validates each; for a .mmd path " +
      "it lints the whole file as one diagram. Each diagram is parsed with the " +
      "bundled Mermaid parser plus semantic rules, and the tool reports pass/fail " +
      "with diagnostics (line, column, severity, message, rule id) in absolute file " +
      "coordinates. Read-only — the file is never modified. `path` is relative to " +
      "the tool's working directory (ctx.cwd); absolute paths are also accepted. " +
      "Zero findings is ground truth: a diagram has not been linted until this " +
      "returns clean.",
    promptSnippet: "Lint mermaid diagrams in a file",
    promptGuidelines: [
      "Use mermaid_lint to validate mermaid diagrams in a .md or .mmd file before landing them — zero findings is the bar.",
    ],
    parameters: Type.Object({
      path: Type.String({
        description:
          "Path to the file to lint relative to the working directory (ctx.cwd), or an absolute path. .md extracts and lints every ```mermaid fence; .mmd lints the whole file as one diagram.",
      }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const target = params.path.replace(/^@/, "")
      const absolutePath = resolve(ctx.cwd, target)

      let original: string
      try {
        original = await readFile(absolutePath, "utf8")
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return {
          content: [
            { type: "text", text: `mermaid_lint: cannot read ${target}: ${message}` },
          ],
          details: { ok: false, path: target, error: message, findings: [] },
        }
      }

      // Imported lazily so the extension registers even before its runtime
      // dependencies are installed (the import fails only on first use), and
      // so jsdom/mermaid boot only when a lint is actually requested.
      let lintMarkdown: typeof import("@mermaid-lint/core")["lintMarkdown"]
      let extractMermaidBlocks: typeof import("@mermaid-lint/core")["extractMermaidBlocks"]
      try {
        const core = await import("@mermaid-lint/core")
        lintMarkdown = core.lintMarkdown
        extractMermaidBlocks = core.extractMermaidBlocks
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return {
          content: [
            {
              type: "text",
              text: `mermaid_lint: dependencies missing — run the chezmoi mermaid-lint deps installer (or \`npm install\` in the extension dir). ${message}`,
            },
          ],
          details: { ok: false, path: target, error: message, findings: [] },
        }
      }

      const diagnostics = (await lintMarkdown(absolutePath, original)) as Diagnostic[]
      const blocks = extractMermaidBlocks(absolutePath, original)

      if (diagnostics.length === 0) {
        const summary =
          blocks.length === 0
            ? `mermaid_lint: ${target} — no mermaid diagrams found.`
            : `mermaid_lint: ${target} clean — ${blocks.length} diagram${blocks.length === 1 ? "" : "s"}, zero findings.`
        return {
          content: [{ type: "text", text: summary }],
          details: { ok: true, path: target, diagrams: blocks.length, findings: [] },
        }
      }

      const errors = diagnostics.filter((d) => d.severity === "error")
      const warnings = diagnostics.filter((d) => d.severity === "warning")
      const lines = [
        `mermaid_lint: ${target} — ${errors.length} error${errors.length === 1 ? "" : "s"}, ${warnings.length} warning${warnings.length === 1 ? "" : "s"}:`,
      ]
      for (const d of diagnostics) {
        lines.push(`  ${absolutePath}:${d.line}:${d.column}  ${d.severity} [${d.ruleId}] ${d.message}`)
        if (d.raw) lines.push(`    raw: ${d.raw.replace(/\n/g, "\n    ")}`)
        if (d.suggestion) lines.push(`    suggestion: ${d.suggestion}`)
      }

      return {
        content: [{ type: "text", text: lines.join("\n") }],
        details: {
          ok: false,
          path: target,
          diagrams: blocks.length,
          errors: errors.length,
          warnings: warnings.length,
          findings: diagnostics.map((d) => ({
            line: d.line,
            column: d.column,
            severity: d.severity,
            ruleId: d.ruleId,
            message: d.message,
            ...(d.raw ? { raw: d.raw } : {}),
            ...(d.suggestion ? { suggestion: d.suggestion } : {}),
            ...(d.fixable ? { fixable: true } : {}),
          })),
        },
      }
    },
  })
}
