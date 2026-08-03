---
name: unity-cli
description: Unity Editor automation via unity-cli. Use when running tests, reading console logs, or executing C# in the Unity Editor.
license: MIT
---

# Unity CLI

`unity-cli` is a standalone Go binary — no server, no config. Use `unity-cli list` to discover available tools and `unity-cli <command> --help` for syntax.

## Commands

| Command | Description |
|---------|-------------|
| `editor` | Play/stop/pause/refresh the Unity Editor |
| `console` | Read, filter, and clear console logs |
| `exec` | Run arbitrary C# code inside Unity |
| `test` | Run EditMode/PlayMode tests |
| `menu` | Execute any Unity menu item by path |
| `reserialize` | Re-serialize assets through Unity's serializer |
| `screenshot` | Capture scene/game view as PNG |
| `profiler` | Read profiler hierarchy, control recording |
| `list` | Show all available tools with parameter schemas |
| `status` | Show Unity Editor connection state |

## Common Workflows

**Editor control:**
```bash
unity-cli editor play
unity-cli editor stop
unity-cli editor pause
```

**Console logs:**
```bash
unity-cli console  # Read logs
unity-cli console --filter "error"  # Filter by level
unity-cli console --clear  # Clear logs
```

**Execute C# code:**
```bash
unity-cli exec "return Application.dataPath;"
unity-cli exec "var go = GameObject.Find(\"MainCamera\"); return go.transform.position;"
```

**Run tests:**
```bash
unity-cli test  # Run all tests
unity-cli test --filter "PlayerTests"  # Filter by name
```

**Asset management:**
```bash
unity-cli reserialize Assets/Scenes/Main.unity  # Re-serialize after editing
```
