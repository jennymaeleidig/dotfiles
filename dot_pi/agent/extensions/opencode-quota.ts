import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
	type ExtensionAPI,
	DynamicBorder,
	type Theme,
} from "@earendil-works/pi-coding-agent";
import {
	type Component,
	type TUI,
	Loader,
	matchesKey,
	truncateToWidth,
} from "@earendil-works/pi-tui";

/**
 * OpenCode Usage Quota — a pi command that mirrors the neuralwatt
 * `/neuralwatt:quota` panel but pulls OpenCode workspace usage limits
 * (Rolling / Weekly / Monthly) from opencode.ai using the credentials
 * stored at `~/.opencode/session.json` (the same file the
 * `opencode-go-usage-analyzer` CLI reads, but resolved via $HOME so it
 * works from any working directory).
 *
 * Usage: `/opencode:quota`
 */

// --- types -----------------------------------------------------------------

interface OpenCodeSession {
	workspace_id: string;
	auth_token: string;
}

interface UsageEntry {
	usageType: string; // "Rolling" | "Weekly" | "Monthly"
	percentage: number; // capacity used, 0-100
	resetsIn: string; // human-readable reset timer
}

type FetchResult =
	| { success: true; entries: UsageEntry[] }
	| { success: false; error: string };

// --- session / auth --------------------------------------------------------

function loadSession(): OpenCodeSession | null {
	const path = join(homedir(), ".opencode", "session.json");
	let raw: string;
	try {
		raw = readFileSync(path, "utf8");
	} catch {
		return null;
	}
	let payload: Record<string, unknown>;
	try {
		payload = JSON.parse(raw) as Record<string, unknown>;
	} catch {
		return null;
	}
	const workspace_id = String(payload.workspace_id ?? "").trim();
	const auth_token = String(payload.auth_token ?? "").trim();
	if (!workspace_id || !auth_token) return null;
	return { workspace_id, auth_token };
}

function missingAuthMessage(): string {
	const sessionPath = join(homedir(), ".opencode", "session.json");
	return `OpenCode quota needs credentials at ${sessionPath} (workspace_id + auth_token). Run \`opencode-usage\` from your home directory once to create it, or add the file manually.`;
}

// --- fetch + parse ---------------------------------------------------------

const USAGE_URL = (workspaceId: string) =>
	`https://opencode.ai/workspace/${workspaceId}/go`;

const USER_AGENT =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
	"(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Per-item field extractors. The dashboard renders each usage row as a
// <div data-slot="usage-item"> block with usage-label / usage-value /
// reset-time children. Parsing per-item (rather than a single regex over the
// whole page) avoids trailing footer text leaking into the last entry.
const USAGE_ITEM_RE = /data-slot="usage-item"/g;
const LABEL_RE = /data-slot="usage-label">([^<]+)</;
const VALUE_RE = /data-slot="usage-value"[^>]*>([\s\S]*?)<\/span>/;
const RESET_RE = /data-slot="reset-time"[^>]*>([\s\S]*?)<\/span>/;

async function fetchUsage(
	session: OpenCodeSession,
	signal?: AbortSignal,
): Promise<FetchResult> {
	let response: Response;
	try {
		response = await fetch(USAGE_URL(session.workspace_id), {
			headers: {
				"User-Agent": USER_AGENT,
				Cookie: `auth=${session.auth_token}; oc_locale=en`,
			},
			signal,
		});
	} catch (e) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "network request failed",
		};
	}

	if (!response.ok) {
		return {
			success: false,
			error: `HTTP ${response.status} ${response.statusText}`,
		};
	}

	const html = await response.text();

	// The dashboard redirects unauthenticated users to a Google login.
	if (html.includes("Continue with Google")) {
		return {
			success: false,
			error:
				"not authenticated — auth token in ~/.opencode/session.json is invalid or expired",
		};
	}

	// Split on each usage-item block and extract its fields. Stripping
	// <[^>]+> removes tags and the <!--$-->/<!--/--> React comment markers.
	const entries: UsageEntry[] = [];
	const chunks = html.split(USAGE_ITEM_RE);
	for (let i = 1; i < chunks.length; i++) {
		const block = chunks[i] ?? "";
		const label = LABEL_RE.exec(block);
		const value = VALUE_RE.exec(block);
		const reset = RESET_RE.exec(block);
		if (!label || !value || !reset) continue;
		const usageType = label[1].trim();
		const pct = parseInt(
			value[1].replace(/<[^>]+>/g, "").replace(/\D/g, ""),
			10,
		);
		const resetsIn = reset[1]
			.replace(/<[^>]+>/g, "")
			.replace(/Resets in/i, "")
			.replace(/\s+/g, " ")
			.trim();
		if (!Number.isFinite(pct) || !usageType || !resetsIn) continue;
		entries.push({ usageType, percentage: pct, resetsIn });
	}

	if (entries.length === 0) {
		return {
			success: false,
			error: "could not extract usage data from dashboard",
		};
	}
	return { success: true, entries };
}

// --- rendering helpers -----------------------------------------------------

type Severity = "success" | "warning" | "error";

function usedSeverity(pct: number): Severity {
	if (pct >= 90) return "error";
	if (pct > 50) return "warning";
	return "success";
}

function renderProgressBar(
	usedPct: number,
	width: number,
	theme: Theme,
	severity: Severity,
): string {
	const clamped = Math.max(0, Math.min(100, Math.round(usedPct)));
	const filled = Math.round((clamped / 100) * width);
	const parts: string[] = [];
	for (let i = 0; i < width; i++) {
		parts.push(
			i < filled ? theme.fg(severity, "\u2588") : theme.fg("dim", "\u2591"),
		);
	}
	return parts.join("");
}

function labelValue(
	label: string,
	value: string,
	maxWidth: number,
	theme: Theme,
): string {
	const labelWidth = 14;
	return truncateToWidth(
		`  ${theme.fg("dim", label.padEnd(labelWidth))} ${value}`,
		maxWidth,
	);
}

function renderEntryTab(
	entry: UsageEntry,
	contentWidth: number,
	maxWidth: number,
	theme: Theme,
): string[] {
	const lines: string[] = [];
	const barWidth = Math.min(40, Math.max(20, contentWidth - 30));
	const sev = usedSeverity(entry.percentage);

	lines.push("");
	lines.push(
		truncateToWidth(`  ${theme.fg("accent", theme.bold("Usage"))}`, maxWidth),
	);
	const bar = renderProgressBar(entry.percentage, barWidth, theme, sev);
	lines.push(
		truncateToWidth(
			`  ${bar} ${theme.fg(sev, `${entry.percentage}%`)}`,
			maxWidth,
		),
	);
	lines.push(labelValue("Capacity", `${entry.percentage}%`, maxWidth, theme));
	lines.push(labelValue("Resets in", entry.resetsIn, maxWidth, theme));

	return lines;
}

// --- component -------------------------------------------------------------

type QuotaState =
	| { type: "loading" }
	| { type: "error"; message: string }
	| { type: "loaded"; entries: UsageEntry[] };

const TAB_ORDER = ["Rolling", "Weekly", "Monthly"];

class QuotaComponent implements Component {
	private state: QuotaState = { type: "loading" };
	private theme: Theme;
	private tui: TUI;
	private onClose: () => void;
	private onRefetch: () => void;
	private loader: Loader | null = null;
	private activeTab = 0;

	constructor(
		theme: Theme,
		tui: TUI,
		onClose: () => void,
		onRefetch: () => void,
	) {
		this.theme = theme;
		this.tui = tui;
		this.onClose = onClose;
		this.onRefetch = onRefetch;
		this.startLoader();
	}

	private startLoader(): void {
		this.loader = new Loader(
			this.tui,
			(s: string) => this.theme.fg("accent", s),
			(s: string) => this.theme.fg("muted", s),
			"Fetching OpenCode usage...",
		);
	}

	destroy(): void {
		this.loader?.stop();
		this.loader = null;
	}

	setState(state: QuotaState): void {
		if (state.type === "loading") {
			this.loader?.stop();
			this.startLoader();
			this.activeTab = 0;
		} else if (this.state.type === "loading") {
			this.loader?.stop();
			this.loader = null;
		}
		this.state = state;
	}

	private tabs(): string[] {
		if (this.state.type !== "loaded") return TAB_ORDER;
		return this.state.entries.map((e) => e.usageType.replace(/\s+Usage$/i, ""));
	}

	handleInput(data: string): boolean {
		if (matchesKey(data, "escape") || data === "q") {
			this.onClose();
			return true;
		}
		if (data === "r") {
			this.onRefetch();
			return true;
		}
		const tabCount = this.tabs().length;
		if (tabCount > 1) {
			if (data === "\t") {
				this.activeTab = (this.activeTab + 1) % tabCount;
				return true;
			}
			if (data === "\x1b[Z" || data === "\x1b[2Z") {
				this.activeTab = (this.activeTab - 1 + tabCount) % tabCount;
				return true;
			}
		}
		return false;
	}

	render(width: number): string[] {
		const lines: string[] = [];
		const border = new DynamicBorder((s: string) => this.theme.fg("border", s));
		const contentWidth = Math.max(1, width - 4);

		lines.push(...border.render(width));
		lines.push(
			truncateToWidth(
				` ${this.theme.fg("accent", this.theme.bold("OpenCode API Quota"))}`,
				width,
			),
		);

		switch (this.state.type) {
			case "loading":
				lines.push(
					...(this.loader?.render(width) ?? [
						this.theme.fg("muted", "  Fetching OpenCode usage..."),
					]),
				);
				break;
			case "error":
				lines.push(this.theme.fg("error", `  ${this.state.message}`));
				break;
			case "loaded":
				lines.push(
					...this.renderLoaded(this.state.entries, contentWidth, width),
				);
				break;
		}

		lines.push("");
		const hints = ["r refresh", "q/Esc close"];
		if (this.tabs().length > 1) hints.push("Tab/Shift+Tab switch tab");
		lines.push(this.theme.fg("dim", `  ${hints.join("  ")}`));
		lines.push(...border.render(width));

		return lines;
	}

	private renderLoaded(
		entries: UsageEntry[],
		contentWidth: number,
		maxWidth: number,
	): string[] {
		const lines: string[] = [];
		const tabs = this.tabs();

		// Tab bar
		lines.push("");
		const tabParts = tabs.map((label, idx) => {
			const full = ` ${label} `;
			if (idx === this.activeTab) {
				return this.theme.bg(
					"selectedBg",
					this.theme.fg("accent", this.theme.bold(full)),
				);
			}
			return this.theme.fg("dim", full);
		});
		lines.push(truncateToWidth(`  ${tabParts.join("  ")}`, maxWidth));

		// Equalize tab heights so switching doesn't jump.
		const allTabContent = entries.map((e) =>
			renderEntryTab(e, contentWidth, maxWidth, this.theme),
		);
		const maxLen = Math.max(...allTabContent.map((t) => t.length));
		for (const t of allTabContent) while (t.length < maxLen) t.push("");

		if (allTabContent[this.activeTab]) {
			lines.push(...allTabContent[this.activeTab]);
		}

		return lines;
	}

	invalidate(): void {}
}

// --- registration ----------------------------------------------------------

export default function (pi: ExtensionAPI): void {
	pi.registerCommand("opencode:quota", {
		description: "Display OpenCode workspace usage and quota",
		handler: async (_args, ctx) => {
			const session = loadSession();
			if (!session) {
				ctx.ui.notify(missingAuthMessage(), "warning");
				return;
			}

			const result = await ctx.ui.custom<null>((tui, theme, _kb, done) => {
				const controller = new AbortController();
				const component = new QuotaComponent(
					theme,
					tui,
					() => {
						controller.abort();
						done(null);
					},
					() => {
						component.setState({ type: "loading" });
						tui.requestRender();
						void loadUsage();
					},
				);

				async function loadUsage(): Promise<void> {
					const fetchResult = await fetchUsage(session, controller.signal);
					if (controller.signal.aborted) return;
					if (fetchResult.success) {
						component.setState({
							type: "loaded",
							entries: fetchResult.entries,
						});
					} else {
						component.setState({ type: "error", message: fetchResult.error });
					}
					tui.requestRender();
				}

				void loadUsage();

				return {
					render: (width: number) => component.render(width),
					invalidate: () => component.invalidate(),
					handleInput: (data: string) => component.handleInput(data),
					dispose: () => {
						controller.abort();
						component.destroy();
					},
				};
			});

			// Non-interactive fallback (RPC, print, JSON modes): custom() returns undefined.
			if (result === undefined) {
				const fetchResult = await fetchUsage(session);
				if (!fetchResult.success) {
					ctx.ui.notify(JSON.stringify({ error: fetchResult.error }), "error");
					return;
				}
				ctx.ui.notify(JSON.stringify(fetchResult.entries), "info");
			}
		},
	});
}
