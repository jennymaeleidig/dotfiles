import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { withFileMutationQueue } from "@earendil-works/pi-coding-agent"
import { Type } from "typebox"
import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { formatMarkdownTables } from "./md-table-formatter.ts"

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "format_md_tables",
    label: "Format Markdown Tables",
    description:
      "Reformats every well-formed GitHub/CommonMark table in a markdown file in place, " +
      "aligning columns by their visible (display) width. Strips concealable markdown " +
      "symbols (bold, italic, strikethrough, links) when computing widths but preserves " +
      "content inside inline code. Left-aligns by default, honors :--- / :--: / ---: " +
      "alignment delimiters, and regenerates the separator row. `path` is relative to " +
      "the tool's working directory (ctx.cwd). Only writes the file back if the " +
      "formatted output differs. Tables inside fenced code blocks and malformed tables " +
      "(unequal column counts) are left untouched.",
    promptSnippet: "Reformat markdown tables in a file by width",
    promptGuidelines: [
      "Use format_md_tables to beautify markdown tables in .md files instead of hand-aligning them.",
    ],
    parameters: Type.Object({
      path: Type.String({
        description:
          "Path to the markdown file to format, relative to the working directory (ctx.cwd).",
      }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const target = params.path.replace(/^@/, "")
      const absolutePath = resolve(ctx.cwd, target)

      return withFileMutationQueue(absolutePath, async () => {
        const original = await readFile(absolutePath, "utf8")
        const formatted = formatMarkdownTables(original)

        if (formatted === original) {
          return {
            content: [
              {
                type: "text",
                text: `No tables needed reformatting in ${target} (file unchanged).`,
              },
            ],
            details: { changed: false },
          }
        }

        await writeFile(absolutePath, formatted, "utf8")
        return {
          content: [{ type: "text", text: `Formatted markdown tables in ${target}.` }],
          details: { changed: true },
        }
      })
    },
  })
}
