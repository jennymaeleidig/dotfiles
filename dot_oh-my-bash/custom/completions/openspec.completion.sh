# Bash completion script for OpenSpec CLI
# Auto-generated - do not edit manually

_openspec_completion() {
  local cur prev words cword

  # Use _init_completion if available (from bash-completion package)
  # The -n : option prevents colons from being treated as word separators
  # (important for spec/change IDs that may contain colons)
  # Otherwise, fall back to manual initialization
  if declare -F _init_completion >/dev/null 2>&1; then
    _init_completion -n : || return
  else
    # Manual fallback when bash-completion is not installed
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    words=("${COMP_WORDS[@]}")
    cword=$COMP_CWORD
  fi

  local cmd="${words[1]}"
  local subcmd="${words[2]}"

  # Top-level commands
  if [[ $cword -eq 1 ]]; then
    local commands="init update list view validate show archive status instructions templates schemas new set workspace context-store initiative feedback change spec completion config schema"
    COMPREPLY=($(compgen -W "$commands" -- "$cur"))
    return 0
  fi

  # Command-specific completion
  case "$cmd" in
    init)
      if [[ "$cur" == -* ]]; then
        local flags="--tools --force --profile"
        COMPREPLY=($(compgen -W "$flags" -- "$cur"))
        return 0
      fi

      case "$prev" in
        --tools|--profile) return 0 ;;
      esac

      local positional_index=0
      local skip_next=0
      local i
      for ((i = 2; i < cword; i++)); do
        if [[ $skip_next -eq 1 ]]; then
          skip_next=0
          continue
        fi
        case "${words[i]}" in
          --tools|--profile) skip_next=1 ;;
          --tools=*|--profile=*) ;;
          -*) ;;
          *) ((positional_index++)) ;;
        esac
      done

      case "$positional_index" in
        0)
        COMPREPLY=($(compgen -f -- "$cur"))
          ;;
      esac
      ;;
    update)
      if [[ "$cur" == -* ]]; then
        local flags="--force"
        COMPREPLY=($(compgen -W "$flags" -- "$cur"))
        return 0
      fi

      local positional_index=0
      local skip_next=0
      local i
      for ((i = 2; i < cword; i++)); do
        if [[ $skip_next -eq 1 ]]; then
          skip_next=0
          continue
        fi
        case "${words[i]}" in
          -*) ;;
          *) ((positional_index++)) ;;
        esac
      done

      case "$positional_index" in
        0)
        COMPREPLY=($(compgen -f -- "$cur"))
          ;;
      esac
      ;;
    list)
      if [[ "$cur" == -* ]]; then
        local flags="--specs --changes --sort --json"
        COMPREPLY=($(compgen -W "$flags" -- "$cur"))
        return 0
      fi

      ;;
    view)
      ;;
    validate)
      if [[ "$cur" == -* ]]; then
        local flags="--all --changes --specs --type --strict --json --concurrency --no-interactive"
        COMPREPLY=($(compgen -W "$flags" -- "$cur"))
        return 0
      fi

      case "$prev" in
        --type|--concurrency) return 0 ;;
      esac

      local positional_index=0
      local skip_next=0
      local i
      for ((i = 2; i < cword; i++)); do
        if [[ $skip_next -eq 1 ]]; then
          skip_next=0
          continue
        fi
        case "${words[i]}" in
          --type|--concurrency) skip_next=1 ;;
          --type=*|--concurrency=*) ;;
          -*) ;;
          *) ((positional_index++)) ;;
        esac
      done

      case "$positional_index" in
        0)
        _openspec_complete_items
          ;;
      esac
      ;;
    show)
      if [[ "$cur" == -* ]]; then
        local flags="--json --type --no-interactive --deltas-only --requirements-only --requirements --no-scenarios -r --requirement"
        COMPREPLY=($(compgen -W "$flags" -- "$cur"))
        return 0
      fi

      case "$prev" in
        --type|--requirement|-r) return 0 ;;
      esac

      local positional_index=0
      local skip_next=0
      local i
      for ((i = 2; i < cword; i++)); do
        if [[ $skip_next -eq 1 ]]; then
          skip_next=0
          continue
        fi
        case "${words[i]}" in
          --type|--requirement|-r) skip_next=1 ;;
          --type=*|--requirement=*|-r=*) ;;
          -*) ;;
          *) ((positional_index++)) ;;
        esac
      done

      case "$positional_index" in
        0)
        _openspec_complete_items
          ;;
      esac
      ;;
    archive)
      if [[ "$cur" == -* ]]; then
        local flags="-y --yes --skip-specs --no-validate"
        COMPREPLY=($(compgen -W "$flags" -- "$cur"))
        return 0
      fi

      local positional_index=0
      local skip_next=0
      local i
      for ((i = 2; i < cword; i++)); do
        if [[ $skip_next -eq 1 ]]; then
          skip_next=0
          continue
        fi
        case "${words[i]}" in
          -*) ;;
          *) ((positional_index++)) ;;
        esac
      done

      case "$positional_index" in
        0)
        _openspec_complete_changes
          ;;
      esac
      ;;
    status)
      if [[ "$cur" == -* ]]; then
        local flags="--change --schema --json"
        COMPREPLY=($(compgen -W "$flags" -- "$cur"))
        return 0
      fi

      ;;
    instructions)
      if [[ "$cur" == -* ]]; then
        local flags="--change --schema --json"
        COMPREPLY=($(compgen -W "$flags" -- "$cur"))
        return 0
      fi

      case "$prev" in
        --change|--schema) return 0 ;;
      esac

      local positional_index=0
      local skip_next=0
      local i
      for ((i = 2; i < cword; i++)); do
        if [[ $skip_next -eq 1 ]]; then
          skip_next=0
          continue
        fi
        case "${words[i]}" in
          --change|--schema) skip_next=1 ;;
          --change=*|--schema=*) ;;
          -*) ;;
          *) ((positional_index++)) ;;
        esac
      done

      case "$positional_index" in
      esac
      ;;
    templates)
      if [[ "$cur" == -* ]]; then
        local flags="--schema --json"
        COMPREPLY=($(compgen -W "$flags" -- "$cur"))
        return 0
      fi

      ;;
    schemas)
      if [[ "$cur" == -* ]]; then
        local flags="--json"
        COMPREPLY=($(compgen -W "$flags" -- "$cur"))
        return 0
      fi

      ;;
    new)
      if [[ $cword -eq 2 ]]; then
        local subcommands="change"
        COMPREPLY=($(compgen -W "$subcommands" -- "$cur"))
        return 0
      fi

      case "$subcmd" in
        change)
          if [[ "$cur" == -* ]]; then
            local flags="--description --goal --areas --initiative --store --store-path --schema --json"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          case "$prev" in
            --description|--goal|--areas|--initiative|--store|--store-path|--schema) return 0 ;;
          esac

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              --description|--goal|--areas|--initiative|--store|--store-path|--schema) skip_next=1 ;;
              --description=*|--goal=*|--areas=*|--initiative=*|--store=*|--store-path=*|--schema=*) ;;
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
          esac
          ;;
      esac
      ;;
    set)
      if [[ $cword -eq 2 ]]; then
        local subcommands="change"
        COMPREPLY=($(compgen -W "$subcommands" -- "$cur"))
        return 0
      fi

      case "$subcmd" in
        change)
          if [[ "$cur" == -* ]]; then
            local flags="--initiative --store --store-path --json"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          case "$prev" in
            --initiative|--store|--store-path) return 0 ;;
          esac

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              --initiative|--store|--store-path) skip_next=1 ;;
              --initiative=*|--store=*|--store-path=*) ;;
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
            0)
            _openspec_complete_changes
              ;;
          esac
          ;;
      esac
      ;;
    workspace)
      if [[ $cword -eq 2 ]]; then
        local subcommands="setup list ls link relink doctor update open"
        COMPREPLY=($(compgen -W "$subcommands" -- "$cur"))
        return 0
      fi

      case "$subcmd" in
        setup)
          if [[ "$cur" == -* ]]; then
            local flags="--name --link --opener --tools --json --no-interactive"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          ;;
        list)
          if [[ "$cur" == -* ]]; then
            local flags="--json"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          ;;
        ls)
          if [[ "$cur" == -* ]]; then
            local flags="--json"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          ;;
        link)
          if [[ "$cur" == -* ]]; then
            local flags="--workspace --json --no-interactive"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          case "$prev" in
            --workspace) return 0 ;;
          esac

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              --workspace) skip_next=1 ;;
              --workspace=*) ;;
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
            0)
            COMPREPLY=($(compgen -f -- "$cur"))
              ;;
            1)
            COMPREPLY=($(compgen -f -- "$cur"))
              ;;
          esac
          ;;
        relink)
          if [[ "$cur" == -* ]]; then
            local flags="--workspace --json --no-interactive"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          case "$prev" in
            --workspace) return 0 ;;
          esac

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              --workspace) skip_next=1 ;;
              --workspace=*) ;;
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
            1)
            COMPREPLY=($(compgen -f -- "$cur"))
              ;;
          esac
          ;;
        doctor)
          if [[ "$cur" == -* ]]; then
            local flags="--workspace --json --no-interactive"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          ;;
        update)
          if [[ "$cur" == -* ]]; then
            local flags="--workspace --tools --json --no-interactive"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          case "$prev" in
            --workspace|--tools) return 0 ;;
          esac

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              --workspace|--tools) skip_next=1 ;;
              --workspace=*|--tools=*) ;;
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
          esac
          ;;
        open)
          if [[ "$cur" == -* ]]; then
            local flags="--workspace --initiative --store --store-path --agent --editor --prepare-only --json --change --no-interactive"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          case "$prev" in
            --workspace|--initiative|--store|--store-path|--agent|--change) return 0 ;;
          esac

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              --workspace|--initiative|--store|--store-path|--agent|--change) skip_next=1 ;;
              --workspace=*|--initiative=*|--store=*|--store-path=*|--agent=*|--change=*) ;;
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
          esac
          ;;
      esac
      ;;
    context-store)
      if [[ $cword -eq 2 ]]; then
        local subcommands="setup register unregister remove list ls doctor"
        COMPREPLY=($(compgen -W "$subcommands" -- "$cur"))
        return 0
      fi

      case "$subcmd" in
        setup)
          if [[ "$cur" == -* ]]; then
            local flags="--path --init-git --no-init-git --json"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          case "$prev" in
            --path) return 0 ;;
          esac

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              --path) skip_next=1 ;;
              --path=*) ;;
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
          esac
          ;;
        register)
          if [[ "$cur" == -* ]]; then
            local flags="--id --json"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          case "$prev" in
            --id) return 0 ;;
          esac

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              --id) skip_next=1 ;;
              --id=*) ;;
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
            0)
            COMPREPLY=($(compgen -f -- "$cur"))
              ;;
          esac
          ;;
        unregister)
          if [[ "$cur" == -* ]]; then
            local flags="--json"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
          esac
          ;;
        remove)
          if [[ "$cur" == -* ]]; then
            local flags="--yes --json"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
          esac
          ;;
        list)
          if [[ "$cur" == -* ]]; then
            local flags="--json"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          ;;
        ls)
          if [[ "$cur" == -* ]]; then
            local flags="--json"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          ;;
        doctor)
          if [[ "$cur" == -* ]]; then
            local flags="--json"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
          esac
          ;;
      esac
      ;;
    initiative)
      if [[ $cword -eq 2 ]]; then
        local subcommands="create show list ls"
        COMPREPLY=($(compgen -W "$subcommands" -- "$cur"))
        return 0
      fi

      case "$subcmd" in
        create)
          if [[ "$cur" == -* ]]; then
            local flags="--store --store-path --title --summary --json"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          case "$prev" in
            --store|--store-path|--title|--summary) return 0 ;;
          esac

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              --store|--store-path|--title|--summary) skip_next=1 ;;
              --store=*|--store-path=*|--title=*|--summary=*) ;;
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
          esac
          ;;
        show)
          if [[ "$cur" == -* ]]; then
            local flags="--store --store-path --json"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          case "$prev" in
            --store|--store-path) return 0 ;;
          esac

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              --store|--store-path) skip_next=1 ;;
              --store=*|--store-path=*) ;;
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
          esac
          ;;
        list)
          if [[ "$cur" == -* ]]; then
            local flags="--store --store-path --json"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          ;;
        ls)
          if [[ "$cur" == -* ]]; then
            local flags="--store --store-path --json"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          ;;
      esac
      ;;
    feedback)
      if [[ "$cur" == -* ]]; then
        local flags="--body"
        COMPREPLY=($(compgen -W "$flags" -- "$cur"))
        return 0
      fi

      case "$prev" in
        --body) return 0 ;;
      esac

      local positional_index=0
      local skip_next=0
      local i
      for ((i = 2; i < cword; i++)); do
        if [[ $skip_next -eq 1 ]]; then
          skip_next=0
          continue
        fi
        case "${words[i]}" in
          --body) skip_next=1 ;;
          --body=*) ;;
          -*) ;;
          *) ((positional_index++)) ;;
        esac
      done

      case "$positional_index" in
      esac
      ;;
    change)
      if [[ $cword -eq 2 ]]; then
        local subcommands="show list validate"
        COMPREPLY=($(compgen -W "$subcommands" -- "$cur"))
        return 0
      fi

      case "$subcmd" in
        show)
          if [[ "$cur" == -* ]]; then
            local flags="--json --deltas-only --requirements-only --no-interactive"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
            0)
            _openspec_complete_changes
              ;;
          esac
          ;;
        list)
          if [[ "$cur" == -* ]]; then
            local flags="--json --long"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          ;;
        validate)
          if [[ "$cur" == -* ]]; then
            local flags="--strict --json --no-interactive"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
            0)
            _openspec_complete_changes
              ;;
          esac
          ;;
      esac
      ;;
    spec)
      if [[ $cword -eq 2 ]]; then
        local subcommands="show list validate"
        COMPREPLY=($(compgen -W "$subcommands" -- "$cur"))
        return 0
      fi

      case "$subcmd" in
        show)
          if [[ "$cur" == -* ]]; then
            local flags="--json --requirements --no-scenarios -r --requirement --no-interactive"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          case "$prev" in
            --requirement|-r) return 0 ;;
          esac

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              --requirement|-r) skip_next=1 ;;
              --requirement=*|-r=*) ;;
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
            0)
            _openspec_complete_specs
              ;;
          esac
          ;;
        list)
          if [[ "$cur" == -* ]]; then
            local flags="--json --long"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          ;;
        validate)
          if [[ "$cur" == -* ]]; then
            local flags="--strict --json --no-interactive"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
            0)
            _openspec_complete_specs
              ;;
          esac
          ;;
      esac
      ;;
    completion)
      if [[ $cword -eq 2 ]]; then
        local subcommands="generate install uninstall"
        COMPREPLY=($(compgen -W "$subcommands" -- "$cur"))
        return 0
      fi

      case "$subcmd" in
        generate)
          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
            0)
            local shells="zsh bash fish powershell"
            COMPREPLY=($(compgen -W "$shells" -- "$cur"))
              ;;
          esac
          ;;
        install)
          if [[ "$cur" == -* ]]; then
            local flags="--verbose"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
            0)
            local shells="zsh bash fish powershell"
            COMPREPLY=($(compgen -W "$shells" -- "$cur"))
              ;;
          esac
          ;;
        uninstall)
          if [[ "$cur" == -* ]]; then
            local flags="-y --yes"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
            0)
            local shells="zsh bash fish powershell"
            COMPREPLY=($(compgen -W "$shells" -- "$cur"))
              ;;
          esac
          ;;
      esac
      ;;
    config)
      if [[ "$cur" == -* ]]; then
        local flags="--scope"
        COMPREPLY=($(compgen -W "$flags" -- "$cur"))
        return 0
      fi

      if [[ $cword -eq 2 ]]; then
        local subcommands="path list get set unset reset edit profile"
        COMPREPLY=($(compgen -W "$subcommands" -- "$cur"))
        return 0
      fi

      case "$subcmd" in
        path)
          ;;
        list)
          if [[ "$cur" == -* ]]; then
            local flags="--json"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          ;;
        get)
          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
          esac
          ;;
        set)
          if [[ "$cur" == -* ]]; then
            local flags="--string --allow-unknown"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
          esac
          ;;
        unset)
          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
          esac
          ;;
        reset)
          if [[ "$cur" == -* ]]; then
            local flags="--all -y --yes"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          ;;
        edit)
          ;;
        profile)
          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
          esac
          ;;
      esac
      ;;
    schema)
      if [[ $cword -eq 2 ]]; then
        local subcommands="which validate fork init"
        COMPREPLY=($(compgen -W "$subcommands" -- "$cur"))
        return 0
      fi

      case "$subcmd" in
        which)
          if [[ "$cur" == -* ]]; then
            local flags="--json --all"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
            0)
            _openspec_complete_schemas
              ;;
          esac
          ;;
        validate)
          if [[ "$cur" == -* ]]; then
            local flags="--json --verbose"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
            0)
            _openspec_complete_schemas
              ;;
          esac
          ;;
        fork)
          if [[ "$cur" == -* ]]; then
            local flags="--json --force"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
            0)
            _openspec_complete_schemas
              ;;
          esac
          ;;
        init)
          if [[ "$cur" == -* ]]; then
            local flags="--json --description --artifacts --default --no-default --force"
            COMPREPLY=($(compgen -W "$flags" -- "$cur"))
            return 0
          fi

          case "$prev" in
            --description|--artifacts) return 0 ;;
          esac

          local positional_index=0
          local skip_next=0
          local i
          for ((i = 3; i < cword; i++)); do
            if [[ $skip_next -eq 1 ]]; then
              skip_next=0
              continue
            fi
            case "${words[i]}" in
              --description|--artifacts) skip_next=1 ;;
              --description=*|--artifacts=*) ;;
              -*) ;;
              *) ((positional_index++)) ;;
            esac
          done

          case "$positional_index" in
          esac
          ;;
      esac
      ;;
  esac

  return 0
}

# Dynamic completion helpers

_openspec_complete_changes() {
  local changes
  changes=$(openspec __complete changes 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$changes" -- "$cur"))
}

_openspec_complete_specs() {
  local specs
  specs=$(openspec __complete specs 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$specs" -- "$cur"))
}

_openspec_complete_items() {
  local items
  items=$(openspec __complete changes 2>/dev/null | cut -f1; openspec __complete specs 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$items" -- "$cur"))
}

_openspec_complete_schemas() {
  local schemas
  schemas=$(openspec __complete schemas 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$schemas" -- "$cur"))
}
complete -F _openspec_completion openspec

