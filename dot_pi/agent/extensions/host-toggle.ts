import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * Runtime host toggle: `/offline` and `/online` switch the session's model
 * between the local oMLX server (pi-localllm-provider's `localllm-omlx`) and
 * the remote OpenCode gateway, mirroring what the `pi` / `pi --online` shell
 * wrappers pick at launch. The change applies to this session only — new
 * sessions use `defaultProvider`/`defaultModel` from settings.json — and
 * subagents spawned afterwards inherit it, since tinysubagent reads the
 * parent's live model at spawn time.
 *
 * The judge (`classifierModel`, pi-warden) is NOT switched: tinysubagent and
 * pi-warden read their classifier config once at load, so a mid-session
 * switch there requires a restart.
 */

const HOSTS = {
  offline: {
    provider: "localllm-omlx",
    model: "Inkling-2-Mini-MLX-8bit",
    label: "local oMLX code",
  },
  online: {
    provider: "opencode-go",
    model: "deepseek-v4.1-flash",
    label: "remote OpenCode deepseek-v4.1-flash",
  },
} as const;

type HostName = keyof typeof HOSTS;

const DESCRIPTIONS: Record<HostName, string> = {
  offline: "Switch this session to the local oMLX model",
  online: "Switch this session to the remote OpenCode model",
};

export default function hostToggle(pi: ExtensionAPI) {
  for (const [name, host] of Object.entries(HOSTS) as [HostName, (typeof HOSTS)[HostName]][]) {
    pi.registerCommand(name, {
      description: DESCRIPTIONS[name],
      handler: async (_args, ctx) => {
        const model = ctx.modelRegistry.find(host.provider, host.model);
        if (!model) {
          ctx.ui.notify(
            `host-toggle: ${host.provider}/${host.model} is not registered — is the localllm settings block present?`,
            "error",
          );
          return;
        }
        const ok = await pi.setModel(model);
        if (!ok) {
          ctx.ui.notify(`host-toggle: no credentials for ${host.provider}/${host.model}`, "error");
          return;
        }
        ctx.ui.notify(`Switched to ${host.label}`, "info");
      },
    });
  }
}
