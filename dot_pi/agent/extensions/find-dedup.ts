// Keeps exactly one `find`-shaped tool in the model's active set.
//
// `@ff-labs/pi-fff` registers `fffind` *beside* pi's built-in `find` unless it
// runs in `override` mode — and that mode is all-or-nothing: it also takes the
// `grep` name, which `pi-hashline-edit-pro` owns (see
// docs/adr/0009-hashline-owns-the-edit-surface.md). So pi-fff stays in its
// default mode and this drops the built-in `find` instead of racing hashline
// for `grep` on undocumented `session_start` ordering.
//
// `before_agent_start` runs after every extension's `session_start`, so the
// registered set is complete by the time this inspects it. The prune is
// conditional on `fffind` being present: removing pi-fff, or switching it to
// override mode where its finder is named `find`, leaves the builtin in place
// rather than leaving the session with no finder at all.

export default function (pi) {
  if (typeof pi.getActiveTools !== "function" || typeof pi.setActiveTools !== "function") {
    return;
  }

  pi.on("before_agent_start", () => {
    const active = pi.getActiveTools();
    if (!active.includes("fffind") || !active.includes("find")) return;
    pi.setActiveTools(active.filter((name) => name !== "find"));
  });
}
