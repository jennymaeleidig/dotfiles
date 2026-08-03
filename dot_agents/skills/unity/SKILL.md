---
name: unity
description: Unity development across Built-in, URP, and HDRP. Use when working with Unity projects or writing Unity C# scripts.
license: MIT
---

# Unity Development

## CLI

For editor control, console logs, C# execution, tests, and asset management, reference the `unity-cli` skill.

## Pipeline Awareness

Detect the render pipeline (Built-in, URP, HDRP) and qualify shader/material steps accordingly:

- **Built-in**: Standard shader, material properties via `Material.SetColor()`
- **URP**: Universal Render Pipeline, Shader Graph, `UniversalRenderPipelineAsset`
- **HDRP**: High Definition Render Pipeline, Shader Graph, `HDRenderPipelineAsset`

## Debugging Workflow

The most common Unity debugging trap: you edit a `.cs` file, run tests, and nothing changes. Unity silently falls back to the last successfully compiled assembly when a file has compile errors. Always rule this out first.

```
unity-cli status                          # confirm "ready"
unity-cli console --clear
unity-cli test --filter <TestClass>
unity-cli console --filter error          # compile errors = stale assembly
```

**No compile errors, tests still fail** → logic bug. Probe runtime state:

```bash
unity-cli exec 'return SystemUnderTest.Method(args).ToString()'
```

Use single quotes for `exec` C# expressions. Avoid `$` string interpolation — use `.ToString()` or concatenation.

## Quest/VR Development

For Quest-specific Unity development (OVRManager, hand tracking, passthrough, controllers, performance optimization), reference the `meta-quest` skill and use `npx -y metavr docs search` for platform documentation.
