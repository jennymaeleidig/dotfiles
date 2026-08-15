#!/usr/bin/env bash
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
version="$(node -p "require('$here/package.json').version")"

editor="${1:-vscode}"
case "$editor" in
vscode) target_dir="$HOME/.vscode/extensions" ;;
cursor) target_dir="$HOME/.cursor/extensions" ;;
windsurf) target_dir="$HOME/.windsurf/extensions" ;;
*)
	echo "unknown editor: $editor (use vscode|cursor|windsurf)" >&2
	exit 1
	;;
esac

dest="$target_dir/pi-launcher-$version"
mkdir -p "$target_dir"
rm -rf "$target_dir"/pi-launcher-*
mkdir -p "$dest/src"
cp "$here/package.json" "$dest/"
cp "$here/src/extension.js" "$dest/src/"

echo "Installed pi-launcher -> $dest"
echo "Reload the window (Cmd+Shift+P > Developer: Reload Window) or restart the editor."