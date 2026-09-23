/**
 * Child-side extension, loaded into every spawned child with `-e child.ts`.
 *
 * Its whole job is the hand-back: `subagent_report` writes the result sidecar
 * the orchestrator's watcher polls, then shuts this pi down so the pane is
 * closed and the batch completes.
 *
 * It deliberately does nothing on `agent_settled`. A child that ends a turn
 * without reporting is not failed — it is idle at its prompt, still steerable,
 * and the batch holds. Reporting only happens through the tool.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { Type } from "typebox"
import { writeFileSync } from "node:fs"

export default function (pi: ExtensionAPI) {
  const reportFile = process.env.PI_SUBAGENT_REPORT

  pi.registerTool({
    name: "subagent_report",
    label: "Report result to orchestrator",
    description:
      "Hand your final result back to the agent that spawned you and close your pane. " +
      "Call this exactly once, when the work is done, with the complete result — it is " +
      "the only thing that reaches the orchestrator. A brief summary of what you did and " +
      "what you found is enough; the orchestrator cannot see your session.",
    promptSnippet: "Hand the final result back and close the pane",
    promptGuidelines: [
      "Finish by calling subagent_report with your complete result; ending the turn without it leaves the batch unresolved.",
    ],
    parameters: Type.Object({
      result: Type.String({
        description: "The complete result for the orchestrator. Self-contained: it cannot see your session.",
      }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (reportFile) {
        writeFileSync(reportFile, JSON.stringify({ type: "done", result: params.result }), "utf8")
      }
      // Deferred until idle, so any queued follow-up still gets answered first.
      ctx.shutdown()
      return {
        content: [{ type: "text", text: "Result delivered to the orchestrator. Closing." }],
        details: {},
      }
    },
  })
}
