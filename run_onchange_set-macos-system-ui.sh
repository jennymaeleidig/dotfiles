#!/usr/bin/env bash

# run_onchange_set-macos-system-ui.sh
# ───────────────────────────────────────────────────────────────────────────
# Declarative macOS system UI preferences
# This script is managed by chezmoi as a run_onchange script.
# It applies macOS system UI preferences so that multiple machines share
# the same settings.
#
# To update these settings, edit this script and run `chezmoi apply`.
# To skip execution on a specific machine, remove the script from chezmoi's source.
# ───────────────────────────────────────────────────────────────────────────

set -euo pipefail

echo "Applying macOS system UI preferences..."

#
# NSGlobalDomain (Appearance & Global UI)
# ───────────────────────────────────────

defaults write NSGlobalDomain AppleInterfaceStyle -string "Dark"
defaults write NSGlobalDomain AppleAccentColor -int 1
defaults write NSGlobalDomain AppleActionOnDoubleClick -string "None"
defaults write NSGlobalDomain AppleShowAllExtensions -bool true
defaults write NSGlobalDomain AppleAntiAliasingThreshold -int 4
defaults write NSGlobalDomain AppleHighlightColor -string "1.000000 0.874510 0.701961 Orange"
defaults write NSGlobalDomain AppleLocale -string "en_US"
defaults write NSGlobalDomain AppleMiniaturizeOnDoubleClick -bool false
defaults write NSGlobalDomain ApplePressAndHoldEnabled -bool false
defaults write NSGlobalDomain AppleSpacesSwitchOnActivate -bool false
defaults write NSGlobalDomain NSDocumentSaveNewDocumentsToCloud -bool false

#
# com.apple.dock (Dock)
# ─────────────────────

defaults write com.apple.dock autohide -bool true
defaults write com.apple.dock autohide-delay -float 100000000
defaults write com.apple.dock mineffect -string scale
defaults write com.apple.dock minimize-to-application -bool false
defaults write com.apple.dock mru-spaces -bool false
defaults write com.apple.dock no-bouncing -bool true
defaults write com.apple.dock show-process-indicators -bool false
defaults write com.apple.dock show-recents -bool false
defaults write com.apple.dock tilesize -int 16
defaults write com.apple.dock wvous-br-corner -int 1
defaults write com.apple.dock wvous-br-modifier -int 0

#
# com.apple.HIToolbox (Keyboard)
# ──────────────────────────────

defaults write com.apple.HIToolbox AppleCurrentKeyboardLayoutInputSourceID -string "com.apple.keylayout.US"
defaults write com.apple.HIToolbox AppleFnUsageType -int 3

#
# com.apple.menuextra.clock (Menu Bar Clock)
# ─────────────────────────────────────────

defaults write com.apple.menuextra.clock ShowAMPM -int 1
defaults write com.apple.menuextra.clock ShowDate -int 0
defaults write com.apple.menuextra.clock ShowDayOfWeek -int 1
defaults write com.apple.menuextra.clock TimeAnnouncementsEnabled -bool false

#
# com.apple.universalaccess (Accessibility / Font Sizing)
# ───────────────────────────────────────────────────────

defaults write com.apple.universalaccess FontSizeCategory -dict global -string "L" version -string "3.0"

#
# Restart affected processes
# ────────────────────────

killall Dock || true

echo "Done."
