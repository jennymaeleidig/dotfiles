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
 * It backs off in three cases: no publication (pi-pigment absent, or too
 * old to publish), a kit that throws (every call into it is caught, so a
 * broken publication cannot take down session start or pi's render path),
 * and — checked lazily, once the registry is settled — pi-pigment itself
 * owning the name, so its own renderers are never wrapped in a second copy
 * of themselves.
 */

import type { ExtensionAPI, ToolRenderers } from "@earendil-works/pi-coding-agent";

const RENDER_KIT_KEY = "pi-pigment.render-kit.v1";

/** The tool pi-sandbox claims from its factory body, ahead of pi-pigment. */
const BRIDGED_TOOLS: readonly string[] = ["bash"];

/** The path segment pi-pigment occupies under the agent's npm tree. */
const PIGMENT_SEGMENT = "pi-pigment";

/** What pi-pigment puts on the global channel; only what this bridge reads. */
interface RenderKitPublication {
  version: number;
  tools: readonly string[];
  createRenderKit: (options: { cwd: string }) => Promise<RenderKit>;
}

/** The borrowed slice of the kit: one decorator, one support check. */
interface RenderKit {
  /** Whether the kit can decorate this tool; false outside its tool set. */
  hasTool: (name: string) => boolean;
  /**
   * The definition with pi-pigment's renderers installed, dispatched by
   * `definition.name`. The kit's real signature is `ToolDefinition ->
   * ToolDefinition`; it is restated structurally here because this file
   * cannot import the package, and only the renderers are ours to take.
   */
  decorate: (definition: DecorationInput) => DecorationInput & ToolRenderers;
}

/** What `decorate` needs off a definition: the name it dispatches on. */
type DecorationInput = { name: string } & Partial<ToolRenderers>;

/** Whether an extension's source path is pi-pigment's own. */
function isPigmentPath(path: string): boolean {
  return path.split(/[\\/]/).includes(PIGMENT_SEGMENT);
}

/** Whether the tool `name` is currently owned by pi-pigment itself. */
function pigmentOwns(pi: ExtensionAPI, name: string): boolean {
  try {
    const tool = pi.getAllTools().find((candidate) => candidate.name === name);
    return isPigmentPath(tool?.sourceInfo?.path ?? "");
  } catch {
    // The registry is not initialized yet; report not-owned so the renderer
    // still applies rather than silently dropping pi-pigment's.
    return false;
  }
}

export default function pigmentBridge(pi: ExtensionAPI): void {
  let kit: RenderKit | undefined;
  const resolved = new Map<string, ToolRenderers>();

  const reset = (): void => {
    resolved.clear();
    kit = undefined;
  };

  pi.on("session_start", async (_event, ctx) => {
    reset();
    const publication = (globalThis as Record<symbol, unknown>)[Symbol.for(RENDER_KIT_KEY)] as
      | RenderKitPublication
      | undefined;
    if (publication?.version !== 1) return;
    if (!BRIDGED_TOOLS.some((tool) => publication.tools.includes(tool))) return;
    // A publication that throws leaves no kit, so every renderer falls
    // through to `next()` instead of failing the session or the render.
    try {
      kit = await publication.createRenderKit({ cwd: ctx.cwd });
    } catch {
      reset();
    }
  });

  pi.on("session_shutdown", reset);

  pi.registerToolRenderer((toolName, next) => {
    const current = kit;
    if (!current || !BRIDGED_TOOLS.includes(toolName) || !current.hasTool(toolName)) return next();
    const cached = resolved.get(toolName);
    if (cached) return cached;
    // pi-pigment owns this name: its own renderers are already installed.
    if (pigmentOwns(pi, toolName)) return next();
    const native = next();
    // No registered tool, no native display to borrow.
    if (!native) return native;
    let decorated: DecorationInput & ToolRenderers;
    try {
      decorated = current.decorate({ name: toolName, ...native });
    } catch {
      // A kit that refuses this name leaves the native renderers in place.
      return next();
    }
    // The resolver contract is the renderer trio, so hand pi exactly that
    // and not the whole definition the kit hands back.
    const renderers: ToolRenderers = {};
    if (decorated.renderShell !== undefined) renderers.renderShell = decorated.renderShell;
    if (decorated.renderCall !== undefined) renderers.renderCall = decorated.renderCall;
    if (decorated.renderResult !== undefined) renderers.renderResult = decorated.renderResult;
    resolved.set(toolName, renderers);
    return renderers;
  });
}
