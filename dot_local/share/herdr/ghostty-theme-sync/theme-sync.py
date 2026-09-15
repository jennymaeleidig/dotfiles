#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
#
# Vendored from themuuln/herdr-ghostty-theme-sync (MIT), with two changes:
#   1. read Ghostty's current config path — the file moved from `config` to
#      `config.ghostty` (the old name is still read as a fallback)
#   2. call the sibling refresh.sh instead of a PATH-installed wrapper
# Upstream: https://github.com/themuuln/herdr-ghostty-theme-sync
#
# The [theme.custom] palette -> token mapping (compute()) and darken() are
# ported from qintmb/herdr-theme-picker's bin/map.sh (MIT, Copyright (c) 2026
# qintmb): https://github.com/qintmb/herdr-theme-picker
# Citation: see CITATION.cff
"""herdr-theme-sync — derive herdr's theme + sidebar colors from the active Ghostty theme.

Reads the active `theme = ...` from Ghostty's config (config.ghostty, falling
back to the pre-rename `config`), resolves the theme file (user themes dirs
first, then the Ghostty bundle), maps its palette onto herdr's [theme.custom]
tokens and every sidebar token fg in ~/.config/herdr/config.toml, then validates
and reloads herdr.

Usage:
  theme-sync.py            apply (rewrites config, reloads herdr)
  theme-sync.py --dry-run  print what would change without writing
"""
from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

HOME = Path.home()


def _ghostty_config() -> Path:
    """Ghostty's active config file: `config.ghostty`, else the old `config`."""
    for name in ("config.ghostty", "config"):
        p = HOME / ".config" / "ghostty" / name
        if p.exists():
            return p
    return HOME / ".config" / "ghostty" / "config.ghostty"


GHOSTTY_CONFIG = _ghostty_config()
# chezmoi-managed on this host: sync rewrites it, so a later `chezmoi apply`
# reverts to Source state unless the generated values are folded back in.
HERDR_CONFIG = HOME / ".config" / "herdr" / "config.toml"
DRY = "--dry-run" in sys.argv


def fail(msg: str) -> None:
    print(f"herdr-theme-sync: {msg}", file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------------------
# Ghostty theme resolution
# ---------------------------------------------------------------------------

def active_theme_name() -> str:
    if not GHOSTTY_CONFIG.exists():
        fail(f"no ghostty config at {GHOSTTY_CONFIG} (looked for config.ghostty, then config)")
    for line in GHOSTTY_CONFIG.read_text().splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, _, v = s.partition("=")
        if k.strip() == "theme":
            return v.strip().strip("\"'")
    fail("no active `theme = ...` line in ghostty config")


def find_ghostty_bin() -> str:
    which = subprocess.run(["which", "ghostty"], capture_output=True, text=True).stdout.strip()
    if which:
        return which
    # Fallbacks for minimal environments (launchd, cron): brew installs,
    # .app bundles on macOS, standard Linux paths.
    for cand in (
        "/opt/homebrew/bin/ghostty",
        "/usr/local/bin/ghostty",
        "/usr/bin/ghostty",
        "/Applications/Ghostty.app/Contents/MacOS/ghostty",
        "/Applications/Ghostty-Nightly.app/Contents/MacOS/ghostty",
    ):
        if Path(cand).exists():
            return cand
    for p in sorted(Path("/Applications").glob("Ghostty*.app/Contents/MacOS/ghostty")):
        return str(p)
    return ""


def theme_file(name: str) -> Path:
    cands = [
        HOME / ".config" / "ghostty" / "themes" / name,
        HOME / ".config" / "ghostty" / "themes" / f"{name}.conf",
        HOME / ".local" / "share" / "ghostty" / "themes" / name,
        HOME / ".local" / "share" / "ghostty" / "themes" / f"{name}.conf",
    ]
    for c in cands:
        if c.exists():
            return c
    bin_path = find_ghostty_bin()
    if bin_path:
        p = Path(bin_path)
        if ".app/Contents/MacOS" in str(p):
            # /Applications/X.app/Contents/MacOS/ghostty -> Contents/Resources/ghostty/themes
            res = p.parents[1] / "Resources" / "ghostty" / "themes" / name
            if res.exists():
                return res
    fail(f"could not find theme file for '{name}' (tried user themes dirs and the Ghostty bundle)")


def parse_theme(path: Path) -> dict:
    out = {}
    for line in path.read_text().splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, _, v = s.partition("=")
        k, v = k.strip(), v.strip()
        if k == "palette":
            for part in v.split(","):
                idx, _, col = part.strip().partition("=")
                if col:
                    out[int(idx)] = col.strip()
        else:
            out[k] = v
    return out


# ---------------------------------------------------------------------------
# Palette math
# ---------------------------------------------------------------------------

def hex2rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def rgb2hex(rgb) -> str:
    return "#%02x%02x%02x" % tuple(rgb)


def mix(a: str, b: str, t: float) -> str:
    """Linear blend: t=0 -> a, t=1 -> b."""
    return rgb2hex(round(x * (1 - t) + y * t) for x, y in zip(hex2rgb(a), hex2rgb(b)))


def darken(h: str, pct: int) -> str:
    """Darken each channel by pct, integer-floor (matches the picker's math)."""
    return rgb2hex(c * (100 - pct) // 100 for c in hex2rgb(h))


# ---------------------------------------------------------------------------
# Ghostty palette -> herdr colors
# ---------------------------------------------------------------------------

def compute(theme: dict) -> tuple[dict, dict, dict]:
    bg = theme.get("background") or "#000000"
    fg = theme.get("foreground") or "#ffffff"
    p = [theme.get(i) for i in range(16)]

    def px(i: int, fallback: str) -> str:
        return p[i] if p[i] else fallback

    # Muted/quiet text: the theme's own selection-foreground when present.
    dim = theme.get("selection-foreground") or mix(fg, bg, 0.45)
    # Bright palette variants (8-15) for anything that must pop on dark bg.
    green, yellow, red = px(10, fg), px(11, fg), px(9, fg)
    blue, magenta, cyan = px(12, fg), px(13, fg), px(14, fg)
    # The theme's cursor color is a red-orange (solarized variants put bright
    # red at palette 9); mix toward yellow for a cleaner orange that stays
    # distinct from the blocked red. Fall back to 9 when no cursor is set.
    orange = mix(theme.get("cursor-color") or px(9, fg), yellow, 0.5)

    # Mapping mirrors qintmb/herdr-theme-picker's palette_to_tokens: each herdr
    # token takes a fixed Ghostty palette role rather than a computed blend, so
    # the UI matches what the picker produced.
    custom = {
        "panel_bg": "reset",  # deliberate: keeps ghostty's background/glass (picker used the theme bg here)
        "sidebar_bg": darken(bg, 15),
        "active_row_bg": px(0, bg),
        "selection_bg": theme.get("selection-background") or px(8, fg),
        "text": fg,
        "surface0": px(0, bg),
        "surface1": px(8, fg),
        "overlay0": px(8, fg),
        "overlay1": px(7, fg),
        "subtext0": px(7, fg),
        "accent": px(4, fg),
        "blue": px(4, fg),
        "mauve": px(5, fg),
        "green": px(2, fg),
        "yellow": px(3, fg),
        "red": px(1, fg),
        "teal": px(6, fg),
        "peach": px(9, px(3, fg)),
        "surface_dim": darken(bg, 8),
    }
    sidebar = {
        # names / main text
        "$name": fg, "workspace": fg, "agent": fg,
        # state glyphs — working=orange ●, done=vibrant green ✓, idle=green ○,
        # blocked=red ×. done is a checkmark in bright green so it pops
        # against the dark panel (matches the omp extension's DONE_GLYPH).
        "$st_working": orange, "$st_done": "#00ff5f", "$st_idle": green,
        "$st_blocked": red,
        "terminal_title": dim, "terminal_title_stripped": dim,
        # git + context line
        "branch": green, "git_status": yellow, "$dir": cyan, "$panes": dim,
        # project tokens (role -> palette)
        "$zuiio": blue, "$tolom": green, "$zer": magenta, "$onoo": yellow,
        "$herdr": orange, "$omp": cyan, "$archive": dim, "$horoscope": magenta,
        "$misc": cyan,
    }
    agent_accent = {"claude": orange, "codex": green, "droid": yellow}

    # Ghostty palette entries are bare hex ("2d2a2e"), but herdr's color parser
    # has rejected bare hex (rendering cyan). Normalize every color to
    # "#rrggbb" so both the first write and the sidebar re-styling regex (which
    # matches fg = "#...") keep working on later runs.
    def normalize(c: str) -> str:
        c = c.strip()
        if re.fullmatch(r"(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})", c):
            return "#" + c
        return c

    custom = {k: normalize(v) for k, v in custom.items()}
    sidebar = {k: normalize(v) for k, v in sidebar.items()}
    agent_accent = {k: normalize(v) for k, v in agent_accent.items()}
    return custom, sidebar, agent_accent


# ---------------------------------------------------------------------------
# Config rewrite
# ---------------------------------------------------------------------------

STYLED = re.compile(r'\{ token = "([^"]+)", fg = "#[0-9a-fA-F]{3,8}"([^}]*)\}')
THEME_KEYS = ("sidebar_bg", "active_row_bg", "selection_bg", "text", "surface0",
              "surface1", "overlay0", "overlay1", "subtext0", "accent", "blue",
              "mauve", "green", "yellow", "red", "teal", "peach", "surface_dim")


def rewrite_sidebar_line(line: str, section: str, sidebar: dict, agent_accent: dict,
                         text: str, agent_key: str | None = None) -> str:
    def repl(mm: re.Match) -> str:
        tok = mm.group(1)
        if tok == "agent":
            # rows_by_agent uses `agent = [...]` key assignments inside one table
            color = agent_accent.get(agent_key or "") \
                or agent_accent.get(section.rsplit(".", 1)[-1], text)
        else:
            color = sidebar.get(tok)
            if color is None:
                return mm.group(0)
        return f'{{ token = "{tok}", fg = "{color}"{mm.group(2)}}}'

    return STYLED.sub(repl, line)


def apply(custom: dict, sidebar: dict, agent_accent: dict, name: str) -> str:
    lines = HERDR_CONFIG.read_text().splitlines()
    out, section, i = [], "", 0
    agent_key = None
    while i < len(lines):
        line = lines[i]
        m = re.match(r"^\[(.+)\]$", line)
        if m:
            section = m.group(1)
            agent_key = None
            if section == "theme.custom":
                out.append(line)
                out.append(f'panel_bg = "{custom["panel_bg"]}"')
                out.append(f'# Generated by herdr-theme-sync from ghostty theme "{name}".')
                out.append("# Mapping follows herdr-theme-picker; edit the ghostty theme and re-run.")
                for k in THEME_KEYS:
                    out.append(f'{k} = "{custom[k]}"')
                i += 1
                while i < len(lines) and not re.match(r"^\[", lines[i]):
                    i += 1
                continue
        elif section.startswith("ui"):
            if section == "ui.sidebar.agents.rows_by_agent":
                km = re.match(r"^(\w+)\s*=\s*\[", line)
                if km:
                    agent_key = km.group(1)
            if section == "ui" and re.match(r'^accent\s*=\s*"', line):
                line = f'accent = "{custom["accent"]}"'
            elif 'fg = "#' in line:
                line = rewrite_sidebar_line(line, section, sidebar, agent_accent,
                                            custom["text"], agent_key)
            elif "tokyo-night palette" in line and line.lstrip().startswith("#"):
                line = "# Colors generated by herdr-theme-sync from the active ghostty theme."
                # drop continuation lines of the old palette comment (e.g. "# #9ece6a green…")
                while i + 1 < len(lines) and re.match(r"^#\s*#[0-9a-fA-F]{6}", lines[i + 1]):
                    i += 1
        out.append(line)
        i += 1
    return "\n".join(out) + "\n"


# ---------------------------------------------------------------------------

def main() -> None:
    name = active_theme_name()
    tf = theme_file(name)
    theme = parse_theme(tf)
    custom, sidebar, agent_accent = compute(theme)

    if DRY:
        print(f"ghostty theme: {name}  ({tf})")
        print(f"bg {theme.get('background')}  fg {theme.get('foreground')}")
        print("\ntheme.custom:")
        for k in THEME_KEYS:
            print(f'  {k} = "{custom[k]}"')
        print("\nsidebar tokens:")
        for k, v in sidebar.items():
            print(f"  {k:22s} {v}")
        return

    new = apply(custom, sidebar, agent_accent, name)
    if new == HERDR_CONFIG.read_text():
        print(f"herdr config already matches ghostty theme '{name}' — nothing to do.")
    else:
        bak = Path(os.environ.get("TMPDIR", "/tmp")) / "herdr-config.toml.bak"
        bak.write_text(HERDR_CONFIG.read_text())
        HERDR_CONFIG.write_text(new)
        print(f"rewrote {HERDR_CONFIG} for ghostty theme '{name}' (backup: {bak})")

        chk = subprocess.run(["herdr", "config", "check"], capture_output=True, text=True)
        print((chk.stdout or chk.stderr).strip())
        if chk.returncode != 0:
            HERDR_CONFIG.write_text(bak.read_text())
            fail("config check failed — restored previous config")

        r = subprocess.run(["herdr", "server", "reload-config"], capture_output=True, text=True)
        print((r.stdout or r.stderr).strip())

    # Sidebar tokens ($name/$dir/$panes, project keys) live in ephemeral
    # workspace/pane metadata — always re-push (herdr restarts wipe them even
    # when the config is unchanged). refresh.sh sits next to this script in the
    # plugin root, so no PATH-installed wrapper is needed.
    refresh = Path(__file__).resolve().parent / "refresh.sh"
    subprocess.run(["bash", str(refresh)], check=False)


if __name__ == "__main__":
    main()
