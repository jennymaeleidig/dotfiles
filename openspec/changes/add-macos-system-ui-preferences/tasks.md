## 1. Script Setup & Structure

- [ ] 1.1 Create `run_onchange_set-macos-system-ui.sh` in the chezmoi source directory
- [ ] 1.2 Add shebang and header comments explaining the script's purpose
- [ ] 1.3 Ensure script is executable (`chmod +x`)

## 2. NSGlobalDomain (Appearance & Global UI)

- [ ] 2.1 Add `AppleInterfaceStyle` (Dark Mode)
- [ ] 2.2 Add `AppleAccentColor`
- [ ] 2.3 Add `AppleActionOnDoubleClick`
- [ ] 2.4 Add `AppleShowAllExtensions`
- [ ] 2.5 Add `AppleAntiAliasingThreshold`
- [ ] 2.6 Add `AppleHighlightColor`
- [ ] 2.7 Add `AppleLocale`
- [ ] 2.8 Add `AppleMiniaturizeOnDoubleClick`
- [ ] 2.9 Add `ApplePressAndHoldEnabled`
- [ ] 2.10 Add `AppleSpacesSwitchOnActivate`
- [ ] 2.11 Add `NSDocumentSaveNewDocumentsToCloud`

## 3. com.apple.dock (Dock Settings)

- [ ] 3.1 Add `autohide`
- [ ] 3.2 Add `autohide-delay`
- [ ] 3.3 Add `mineffect`
- [ ] 3.4 Add `minimize-to-application`
- [ ] 3.5 Add `mru-spaces`
- [ ] 3.6 Add `no-bouncing`
- [ ] 3.7 Add `show-process-indicators`
- [ ] 3.8 Add `show-recents`
- [ ] 3.9 Add `tilesize`
- [ ] 3.10 Add `wvous-br-corner`
- [ ] 3.11 Add `wvous-br-modifier`

## 4. com.apple.HIToolbox (Keyboard)

- [ ] 4.1 Add `AppleCurrentKeyboardLayoutInputSourceID`
- [ ] 4.2 Add `AppleFnUsageType`

## 5. com.apple.menuextra.clock (Menu Bar Clock)

- [ ] 5.1 Add `ShowAMPM`
- [ ] 5.2 Add `ShowDate`
- [ ] 5.3 Add `ShowDayOfWeek`
- [ ] 5.4 Add `TimeAnnouncementsEnabled`

## 6. com.apple.universalaccess (Font Sizing)

- [ ] 6.1 Add `FontSizeCategory` (global)

## 7. Process Restarts & Validation

- [ ] 7.1 Add `killall Dock` to script
- [ ] 7.2 Test script on current macOS machine with `chezmoi apply --verbose`
- [ ] 7.3 Verify no errors during application

## 8. Documentation

- [ ] 8.1 Add chezmoi script to `.gitignore` if necessary (should be auto-managed)
- [ ] 8.2 Commit changes and push
