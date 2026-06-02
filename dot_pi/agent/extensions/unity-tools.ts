/**
 * Unity Tools Extension
 *
 * Registers:
 *  - `unity-context`: Extracts Unity project metadata (version, render
 *    pipeline, dimension, template, project path, package capabilities).
 *  - `unity-list-packages`: Returns the full unfiltered Packages/manifest.json
 *    dependencies on demand.
 *
 * Auto-discovered from ~/.pi/agent/extensions/.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Resolve the bash extractor relative to this extension file
// In ~/.pi/agent/extensions/, the script is unity-context.sh in the same directory
const SCRIPT_DIR = __dirname;

export default function unityTools(pi: ExtensionAPI) {
  pi.registerTool({
    name: "unity-context",
    label: "Unity Context",
    description:
      "Extract Unity project settings (version, render pipeline, dimension, template, package capabilities, project path). Call this at the start of every Unity session.",
    parameters: Type.Object({}),
    async execute(_toolCallId) {
      try {
        const result = execSync(`bash "${join(SCRIPT_DIR, "unity-context.sh")}"`, {
          encoding: "utf8",
          timeout: 5000,
        }).trim();

        let parsed;
        try {
          parsed = JSON.parse(result);
        } catch {
          // Script printed non-JSON (error message) — pass it through
          return {
            content: [{ type: "text", text: result }],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(parsed, null, 2),
            },
          ],
        };
      } catch (err: any) {
        const message =
          err.stderr || err.message || "Unknown error running unity-context";
        return {
          content: [
            {
              type: "text",
              text: `unity-context tool error: ${message.trim()}\n\nNote: Run from a Unity project root (where ProjectSettings/ exists).`,
            },
          ],
        };
      }
    },
  });

  pi.registerTool({
    name: "unity-list-packages",
    label: "Unity List Packages",
    description:
      "Return the full unfiltered list of packages from Packages/manifest.json. Use when you need to check specific package versions or resolve dependencies.",
    parameters: Type.Object({}),
    async execute(_toolCallId) {
      const manifestPath = join(process.cwd(), "Packages", "manifest.json");
      if (!existsSync(manifestPath)) {
        return {
          content: [
            {
              type: "text",
              text: "No Packages/manifest.json found. Run from a Unity project root.",
            },
          ],
        };
      }
      try {
        const raw = readFileSync(manifestPath, "utf8");
        const manifest = JSON.parse(raw);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(manifest, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error reading manifest: ${err.message}`,
            },
          ],
        };
      }
    },
  });
}
