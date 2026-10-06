/**
 * pi-pigment's renderers for the tools it cannot own.
 *
 * pi-pigment renders by occupying tool names, and registration is
 * first-wins, so a neighbour that registers `bash` — pi-sandbox's
 * sandboxed shell does, from its factory body, before any `session_start`
 * runs — takes the name and pi-pigment yields. The rendering is then lost
 * with no way to win it back by ordering.
 *
 * Pi 1.0.4's `registerToolRenderer` is the renderer-only override that
 * closes this: it applies to any tool whatever registered it, so the
 * rendering can be restored without racing for the name. pi-pigment
 * publishes its kit on `globalThis` (its "channel B") for consumers that
 * cannot import the package — and this file, sitting in the agent
 * extensions directory, cannot resolve `pi-pigment/render-kit`, which the
 * package materializes under the agent's own npm tree.
 *
 * The published `createRenderKit` hands back `decorate(definition)`. We
 * feed it the native renderers from `next()` so the shell tool keeps its
 * native output display (timing, preview windows, truncation footers) and
 * gains pi-pigment's command highlighting on top.
 *
 * Load order works for us: global extensions load before package
 * extensions, and the resolver chain runs in load order, so this resolver
 * is always consulted before the registered tool's own renderers.
 *
 * It backs off in two cases: no publication (pi-pigment absent, or too old
 * to publish) and — checked lazily, once the registry is settled —
 * pi-pigment itself owning the name, so its own renderers are never
 * wrapped in a second copy of themselves.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const RENDER_KIT_KEY = "pi-pigment.render-kit.v1";

/** The shell tools pi-pigment loses to pi-sandbox. */
const HANDLED: readonly string[] = ["bash", "powershell"];

/** What pi-pigment puts on the global channel; only what this bridge reads. */
interface RenderKitPublication {
  version: number;
  tools: readonly string[];
  createRenderKit: (options: { cwd: string }) => Promise<RenderKit>;
}

/** The borrowed slice of the kit: one decorator, one support check. */
interface RenderKit {
  hasTool: (name: string) => boolean;
  decorate: (definition: Record<string, unknown>) => Renderers;
}

/** The renderer trio a resolver returns. */
interface Renderers {
  renderShell?: unknown;
  renderCall?: unknown;
  renderResult?: unknown;
}

/** Whether an extension owning `name` is pi-pigment itself. */
function pigmentOwns(pi: ExtensionAPI, name: string): boolean {
  try {
    const tool = pi.getAllTools().find((candidate) => candidate.name === name);
    return (tool?.sourceInfo?.path ?? "").includes("pi-pigment");
  } catch {
    // The registry is not initialized yet; treat as not-owned so the
    // renderer still applies rather than silently dropping pigment.
    return false;
  }
}

export default function pigmentBridge(pi: ExtensionAPI): void {
  let kit: RenderKit | undefined;
  const resolved = new Map<string, Renderers>();

  pi.on("session_start", async (_event, ctx) => {
    resolved.clear();
    kit = undefined;
    const publication = (globalThis as Record<symbol, unknown>)[Symbol.for(RENDER_KIT_KEY)] as
      | RenderKitPublication
      | undefined;
    if (publication?.version !== 1 || !publication.tools.includes("bash")) return;
    kit = await publication.createRenderKit({ cwd: ctx.cwd });
  });

  pi.on("session_shutdown", () => {
    resolved.clear();
    kit = undefined;
  });

  pi.registerToolRenderer((toolName, next) => {
    const current = kit;
    if (!current || !HANDLED.includes(toolName) || !current.hasTool(toolName)) return next();
    const cached = resolved.get(toolName);
    if (cached) return cached;
    // pi-pigment owns this name: its own renderers are already installed.
    if (pigmentOwns(pi, toolName)) return next();
    const native = next();
    // No registered tool, no native display to borrow.
    if (!native) return native;
    const decorated = current.decorate({ name: toolName, ...native });
    const renderers: Renderers = {
      renderShell: decorated.renderShell,
      renderCall: decorated.renderCall,
      renderResult: decorated.renderResult,
    };
    resolved.set(toolName, renderers);
    return renderers;
  });
}
