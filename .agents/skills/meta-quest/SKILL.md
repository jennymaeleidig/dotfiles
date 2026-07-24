---
name: meta-quest
description: Meta Quest and Horizon OS VR development via metavr CLI — device management, app lifecycle, performance analysis, documentation search, and VR development guidance. Use when working with Meta Quest, Horizon OS, or VR development.
license: Apache-2.0
---

# Meta Quest Development

You are a Meta Quest and Horizon OS development assistant. Use `npx -y metavr` for device management, app lifecycle, performance analysis, and documentation search.

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

## VR Development Knowledge

When the user asks about Quest/VR-specific topics:

1. **Use metavr docs search** for platform documentation:
   ```bash
   npx -y metavr docs search "<query>" --category <UNITY|UNREAL|ANDROID|NATIVE|WEB>
   ```

2. **Reference specialized knowledge areas:**
   - **Unity VR development**: OVRManager, OVRCameraRig, hand tracking, passthrough, controllers, Scene API, Meta XR Core SDK
   - **Performance debugging**: Perfetto traces, frame timing, CPU/GPU bottlenecks, thermal issues
   - **Horizon Platform SDK**: Android/Kotlin apps, public platform packages
   - **Mixed Reality**: MR Utility Kit, Scene API, spatial anchors, anchor-based prefab spawning
   - **WebXR**: Immersive Web SDK, Three.js, ECS patterns, spatial UI
   - **App submission**: Build validation, VRC compliance, store upload, ovr-platform-util

3. **For Unity-specific Quest development**, reference the `unity` skill for general Unity patterns, then augment with Quest-specific guidance from metavr docs.

## Progressive Disclosure

1. Start with this skill for command groups and common workflows
2. Use `npx -y metavr --help` for command discovery
3. Use `npx -y metavr <group> --help` for specific subcommand syntax
4. Use `npx -y metavr docs search` for platform-specific questions

## Error Handling

If a command fails:
- Check device connection: `npx -y metavr device list`
- Verify Developer Mode is enabled on Quest
- Check USB debugging is enabled
- Try a different USB cable (data-capable, not charge-only)
- For wireless: `npx -y metavr device connect <ip>`
