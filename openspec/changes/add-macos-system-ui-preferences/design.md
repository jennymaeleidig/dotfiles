## Context

The user's chezmoi repository currently manages static dotfiles (e.g., `dot_bashrc`, `dot_config/*` files) across macOS machines. However, there is no mechanism to backup or restore macOS system-level UI preferences such as Dock settings, appearance, or menu bar configuration. The goal is to introduce a declarative, write-only approach to capture these preferences via a chezmoi `run_onchange_` script, using macOS's `defaults` command.

## Goals / Non-Goals

**Goals:**
- Backup core macOS system UI preferences (Dock, Global, Menu Bar, Keyboard, Accessibility)
- Store them as a declarative `defaults write` script
- Use `run_onchange_` so that chezmoi re-applies settings when the definition changes
- Keep only portable, meaningful settings and exclude noisy/volatile keys

**Non-Goals:**
- App-specific preferences (e.g., `com.google.Chrome.empty`) in this change
- Complex two-way syncing or reading back from the current machine into the dotfiles repo
- Windows or Linux support (these defaults write to macOS preference domains)

## Decisions

**1. Use `run_onchange_` prefix**
- Rationale: `run_onchange_` ensures the script is re-run only when its contents change, preserving idempotency while allowing drift correction on update. `run_once_` would not re-apply changes, and `run_` would be too aggressive.

**2. Single monolithic script vs. multiple domain scripts**
- Decision: Single monolithic script `run_onchange_set-macos-system-ui.sh`
- Rationale: Keep it simple and discoverable. A single script keeps all OS-level UI in one place, making it easy to see the full set of settings. Per-domain files add indirection for minimal gain in this context.

**3. Curate settings: exclude noisy keys**
- Decision: Explicitly exclude stateful or volatile keys (e.g., `persistent-apps`, `recent-apps`, analytics timestamps, window dimensions).
- Rationale: These are per-machine state, not declarative configuration. Including them would make the script fragile and produce noisy diffs.

**4. Use `defaults write` rather than committing raw plist files**
- Rationale: `defaults write` is the standard way to programmatically modify these settings. Plist files are binary or XML, brittle across macOS versions, and prone to corruption when version controlled.

## Risks / Trade-offs

- **[Risk] macOS version differences**: Apple may rename or remove keys across macOS versions.
  - **Mitigation**: The `defaults write` command is idempotent and safe for unknown keys. We document the expected domain and key for each setting and recommend testing on the lowest supported macOS version.
- **[Risk] `killall` command affects other applications**: Restarting Dock or SystemUIServer is necessary for some changes to take effect.
  - **Mitigation**: Only `killall Dock` is required for our selected keys. We do not restart SystemUIServer to minimize disruption.
- **[Risk] User changes a setting manually after running chezmoi**: The script is run on change, not on every boot. This aligns with the write-only/declarative model, but a user who manually tweaks a setting via System Settings will have it overwritten on the next chezmoi apply if the script is updated.
  - **Mitigation**: This is expected behavior. The script is the source of truth.

