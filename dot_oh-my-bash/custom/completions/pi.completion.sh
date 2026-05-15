# pi CLI completions for Oh My Bash
# Offers subcommands and options for the pi CLI

_pi() {
  local cur prev words cword
  
  cur="${COMP_WORDS[COMP_CWORD]:-}"
  prev="${COMP_WORDS[COMP_CWORD-1]:-}"
  cword=${COMP_CWORD}

  # First argument: show commands and global options
  if [[ $cword -eq 1 ]]; then
    local commands="install remove uninstall update list config help"
    local options="--provider --model --api-key --system-prompt --append-system-prompt --mode --print --continue --resume --session --fork --session-dir --no-session --models --no-tools --thinking --export --list-models --extension --no-extensions --no-prompt-templates --no-builtin-tools --no-context-files --no-skills --help -p -c -r -h"
    
    COMPREPLY=( $(compgen -W "$commands $options" -- "$cur") )
    return 0
  fi

  # Subsequent arguments: complete options when user types -
  if [[ "$cur" == -* ]]; then
    local options="--provider --model --api-key --system-prompt --append-system-prompt --mode --print --continue --resume --session --fork --session-dir --no-session --models --no-tools --thinking --export --list-models --extension --no-extensions --no-prompt-templates --no-builtin-tools --no-context-files --no-skills --help -p -c -r -h"
    COMPREPLY=( $(compgen -W "$options" -- "$cur") )
    return 0
  fi

  return 0
}

# Register completion
if type complete &>/dev/null; then
  complete -o default -F _pi pi
fi
