## Why

Currently, the chezmoi dotfiles repository only manages static configuration files (`.bashrc`, `.gitconfig`, `.config/*` files, etc.). macOS system-level UI preferences—such as dock settings, appearance (Dark Mode, accent color), and menu bar clock format—are not captured. These settings are crucial for maintaining a consistent user experience across multiple macOS machines. This change adds support for backing up and restoring these macOS system UI preferences in a declarative, write-only manner, making the chezmoi repository the single source of truth.

## What Changes

- **Add a chezmoi run script**: A new `run_onchange_set-macos-system-ui.sh` script will be added to the chezmoi source directory. This script will use `defaults write` to declaratively apply macOS system UI preferences.
- **Cover core UI domains**: The script will manage settings across the following preference domains:
  - **NSGlobalDomain**: Appearance (Dark Mode, accent color), file extensions, locale, etc.
  - **com.apple.dock**: Dock auto-hide, size, behavior, and hot corners.
  - **com.apple.HIToolbox**: Keyboard layout and Fn key behavior.
  - **com.apple.menuextra.clock**: Menu bar clock format.
  - **com.apple.universalaccess**: System font size category.
- **Exclude noisy/volatile keys**: Per-file state, analytics timestamps, window positions (`FXRecentFiles`, `NSNavPanel`), and persistent app lists (`persistent-apps`) will be explicitly excluded to maintain stability.
- **Use `run_onchange_` prefix**: The script will use `run_onchange_` so that chezmoi re-applies settings whenever the script is updated in the repository.
- **(Future) App-Specific Preferences**: This change lays the groundwork for a later addition of app-specific preferences (e.g., `com.google.Chrome`, `com.apple.Safari`) in a similar fashion.

## Capabilities

### New Capabilities
- `macos-system-ui-prefs`: Declarative backup and restoration of core macOS system UI preferences (Dock, Global, Menu Bar, Keyboard, Accessibility).

### Modified Capabilities
- No existing capabilities are being modified.

## Impact

- **Chezmoi source directory:** A new `run_onchange_set-macos-system-ui.sh` script will be added at the root of the chezmoi repository.
- **Affected processes:** `Dock`, `SystemUIServer`, `Finder` (if applicable) will be restarted or notified upon applying changes.
- **macOS only:** The new script is designed for macOS. It will have no effect on other operating systems.
