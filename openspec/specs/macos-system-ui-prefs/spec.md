## ADDED Requirements

### Requirement: Script manages core macOS UI preferences
The system SHALL provide a chezmoi `run_onchange` script that declaratively backs up and restores core macOS system UI preferences.

#### Scenario: Applying dock preferences
- **WHEN** the script is run on a macOS machine with `autohide` set to `false` in `com.apple.dock`
- **THEN** the script uses `defaults write` to set `autohide` to `true`

#### Scenario: Applying global appearance preferences
- **WHEN** the script contains a `defaults write` for `AppleInterfaceStyle` set to "Dark"
- **THEN** the system sets the macOS appearance to Dark Mode upon re-logging or killing `SystemUIServer`

### Requirement: Script excludes noisy and volatile keys
The script SHALL NOT include or apply stateful, volatile, or per-file keys that are not portable across different macOS installations.

#### Scenario: Filtering out recent app state
- **WHEN** the script is generated from the current macOS `defaults read` output
- **THEN** it SHALL NOT include keys like `FXRecentFiles`, `NSNavPanelFileLastListModeForOpenModeKey`, or `persistent-apps` from `com.apple.dock`

### Requirement: Script restarts affected processes
The script SHALL address the need for some preference changes to take effect immediately by restarting the relevant system processes.

#### Scenario: Restarting the Dock
- **WHEN** the script updates a `com.apple.dock` preference
- **THEN** it runs `killall Dock` to ensure the changes are immediately visible

### Requirement: Script supports write-only declarative workflow
The script SHALL serve as the single source of truth, allowing the user to modify preferences directly in the dotfiles repo and have them propagated to all macOS machines upon `chezmoi apply`.

#### Scenario: Updating a preference across machines
- **WHEN** a developer changes the `tilesize` value in the script in the git repository
- **THEN** running `chezmoi apply` on any configured macOS machine updates the Dock tile size to the new value
