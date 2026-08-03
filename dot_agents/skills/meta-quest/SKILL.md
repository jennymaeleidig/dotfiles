---
name: meta-quest
description: Meta Quest and Horizon OS VR development via metavr CLI. Use when working with Meta Quest, Horizon OS, or VR development.
license: Apache-2.0
---

# Meta Quest Development

## CLI Reference

Use `npx -y metavr --help` for discovery. For structured output, add `--json` flags.

### Command Groups

| Group | Use For |
|-------|---------|
| `device` | List/connect devices, battery, controllers, health-check, configure-testing |
| `app` | Install, uninstall, list, launch, stop, clear, info, foreground |
| `capture` | Screenshots from connected headset |
| `files` | ls, push, pull, rm, mkdir on device |
| `perf` | Perfetto traces, analyze-trace, gpu-counters, open in UI |
| `docs` | Search Meta Quest developer documentation, fetch pages, API search |
| `asset` | Search Meta's 3D asset library |
| `audio` | Volume status, set, mute, unmute |
| `log` | Device logs (logcat) with filters |
| `shell` / `adb` | Direct shell commands and ADB passthrough |

### Common Workflows

**Device setup:**
```bash
npx -y metavr device list
npx -y metavr device info
npx -y metavr device configure-testing  # Disable animations, stay awake
```

**App deployment:**
```bash
npx -y metavr app install path/to/app.apk
npx -y metavr app launch com.example.app
npx -y metavr app foreground  # Check what's running
```

**Performance analysis:**
```bash
npx -y metavr perf capture  # Capture Perfetto trace
npx -y metavr perf analyze-trace  # Analyze the trace
npx -y metavr perf open  # Open in Perfetto UI
```

**Documentation lookup:**
```bash
npx -y metavr docs search "hand tracking setup"
npx -y metavr docs search "OVRManager configuration" --category UNITY
```

## Platform Knowledge

- **Unity VR**: OVRManager, OVRCameraRig, hand tracking, passthrough, controllers, Scene API, Meta XR Core SDK
- **Performance**: Perfetto traces, frame timing, CPU/GPU bottlenecks, thermal issues
- **Horizon Platform SDK**: Android/Kotlin apps, public platform packages
- **Mixed Reality**: MR Utility Kit, Scene API, spatial anchors, anchor-based prefab spawning
- **WebXR**: Immersive Web SDK, Three.js, ECS patterns, spatial UI
- **App submission**: Build validation, VRC compliance, store upload, ovr-platform-util

For Unity-specific Quest development, reference the `unity` skill.
