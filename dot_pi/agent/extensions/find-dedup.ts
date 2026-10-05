// Keeps exactly one `find`-shaped tool in the model's active set.
//
// pi-fff runs in `override` mode here (`PI_FFF_MODE=override` in
// dot_bash_exports.tmpl), so its finder is normally registered under the name
// `find` and replaces the builtin outright — this file is a no-op in that case.
//
// The exception is pi-fff's own opt-out clause (upstream issue #857): when
// override mode meets a directory it refuses to index, it keeps its FFF tool
// names and leaves the builtins standing rather than leave the session with no
// working search. That is reachable on this machine, because
// `FFF_ENABLE_HOME_SCAN=0` makes `$HOME` such a directory — launching pi from
// `~` yields both `fffind` and the builtin `find`.
//
// `before_agent_start` runs after every extension's `session_start`, so the
// registered set is complete by the time this inspects it. The prune is
// conditional on `fffind` being present: if pi-fff ever stops registering a
// finder of its own, the builtin stays rather than leaving the session with
// none.

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
