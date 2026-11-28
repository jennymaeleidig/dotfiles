# Sourced, never executed. ADR 0001 decision 4, factored: a chezmoi script
# inherits nothing from the scripts before it or from the launching shell, so
# every script resolves its own environment before testing for a tool. This is
# that resolution, once — the case blocks it replaces had already drifted
# between scripts.
#
# Consumers render the source path themselves:
#   . "{{ .chezmoi.sourceDir }}/packages/script-env.sh"

# Prints the Homebrew prefix for this host, or fails on an unsupported OS.
brew_prefix() {
	case "$(uname -s)" in
	Darwin) printf '%s\n' /opt/homebrew ;;
	Linux) printf '%s\n' /home/linuxbrew/.linuxbrew ;;
	*)
		echo "==> unsupported host: $(uname -s)" >&2
		return 1
		;;
	esac
}

# Puts the prefix's bin on PATH, tolerating a missing brew (caller checks).
brew_env() {
	local prefix
	prefix="$(brew_prefix)" || return 1
	eval "$("$prefix/bin/brew" shellenv 2>/dev/null || true)"
}

# An unattended apply must never hang on a sudo prompt. A privileged script
# calls this only once it knows work remains, so a converged host never asks.
require_uncached_sudo() {
	if ! sudo -n true 2>/dev/null; then
		echo "==> sudo needs a password: run 'sudo -v', then re-run chezmoi apply" >&2
		return 1
	fi
}
