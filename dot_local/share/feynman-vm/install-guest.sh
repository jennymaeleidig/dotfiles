#!/bin/sh
# install-guest.sh - runs INSIDE the feynman builder sandbox (see
# feynman-vm-setup). The feynman disk volume is mounted at /mnt/feynman and
# the verified bundle tarball is at /tmp/feynman-bundle.tar.gz.
set -eu

MNT="/mnt/feynman"
TARBALL="/root/feynman-bundle.tar.gz"

cd "$MNT"
rm -rf current
tar -xzf "$TARBALL"

# The tarball holds one top-level dir: feynman-<version>-linux-arm64.
TOP="$(ls -d feynman-*)"
case "$TOP" in */*) echo "install-guest: unexpected bundle layout: $TOP" >&2; exit 1;; esac
ln -sfn "$TOP" current
rm -f "$TARBALL"

# Prune stale bundle dirs so the volume doesn't grow across version bumps.
for d in feynman-*; do
	[ -d "$d" ] || continue
	[ "$d" = "$TOP" ] || rm -rf "$d"
done

echo "install-guest: installed $TOP into the feynman volume"
