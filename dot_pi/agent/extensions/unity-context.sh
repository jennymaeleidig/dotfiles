#!/bin/bash
set -e

# Validate we're in a Unity project
if [ ! -f "ProjectSettings/ProjectVersion.txt" ]; then
  echo "Error: Not in a Unity project directory (ProjectSettings/ProjectVersion.txt not found)" >&2
  exit 1
fi

UNITY_VERSION=$(awk 'NR==1{print $2}' ProjectSettings/ProjectVersion.txt)

# Determine render pipeline from GraphicsSettings
GS="ProjectSettings/GraphicsSettings.asset"
PIPELINE_KEY=$(grep 'm_RenderPipelineGlobalSettingsMap:' "$GS" -A1 2>/dev/null | tail -1 | sed 's/^[[:space:]]*- first: //;s/:.*//;s/^[[:space:]]*//')

case "${PIPELINE_KEY,,}" in
  *universal*)  PIPELINE="URP" ;;
  *high-definition*|*highdefinition*|*hdrenderpipeline*) PIPELINE="HDRP" ;;
  "")           PIPELINE="Built-in" ;;
  *)            PIPELINE="custom" ;;
esac

# Determine Unity template (for additional context)
TEMPLATE=$(grep 'templatePackageId:' ProjectSettings/ProjectSettings.asset 2>/dev/null | sed 's/.*templatePackageId: //' || echo "unknown")

# Determine 2D vs 3D from EditorSettings
DIMENSION="null"
if [ -f "ProjectSettings/EditorSettings.asset" ]; then
  BEHAVIOR_MODE=$(grep 'm_DefaultBehaviorMode:' ProjectSettings/EditorSettings.asset 2>/dev/null | sed 's/.*m_DefaultBehaviorMode: //;s/[[:space:]]*$//')
  case "$BEHAVIOR_MODE" in
    0) DIMENSION='"3D"' ;;
    1) DIMENSION='"2D"' ;;
    *) DIMENSION="null" ;;
  esac
fi

# Heuristic package categorization
categorize() {
  local name="$1"
  local ver="$2"
  local cat=""

  case "$name" in
    *xr*|*oculus*|*arcore*|*arkit*|*openxr*|*arfoundation*|*magicleap*)
      cat="xr" ;;
    *inputsystem*)
      cat="input" ;;
    *render-pipeline*|*shadergraph*|*vfx*|*visualeffectgraph*)
      cat="rendering" ;;
    *mcp*|*ml-agent*|*sentis*|*openai*|*llm*)
      cat="ai_integration" ;;
    *netcode*|*transport*|*multiplayer*|*mirror*|*photon*|*fishnet*)
      cat="networking" ;;
    *probuilder*|*polybrush*|*cinemachine*|*recorder*)
      cat="editor" ;;
    *entities*|*jobs*|*burst*|*dots*|*mathematics*|*collections*)
      cat="ecs" ;;
    *addressable*|*adaptive*|*mobile*)
      cat="mobile" ;;
    *)
      cat="other" ;;
  esac

  echo "$cat:$name:$ver"
}

# Read Packages/manifest.json dependencies
declare -A caps
other_pkgs=()

if [ -f "Packages/manifest.json" ]; then
  # Use jq if available, fall back to grep/sed
  if command -v jq &>/dev/null; then
    # Parse with jq: extract key-value pairs
    while IFS=$'\t' read -r name ver; do
      # Skip ignored packages
      if [[ "$name" == com.unity.modules.* ]] || [[ "$name" == com.unity.ide.* ]] || [[ "$name" == "com.unity.test-framework" ]] || [[ "$name" == "com.unity.2d.sprite" ]] || [[ "$name" == "com.unity.ai.navigation" ]] || [[ "$name" == "com.unity.timeline" ]] || [[ "$name" == "com.unity.ugui" ]] || [[ "$name" == "com.unity.visualscripting" ]]; then
        continue
      fi

      result=$(categorize "$name" "$ver")
      cat=$(echo "$result" | cut -d: -f1)
      pkg_entry="$name@$ver"

      if [ "$cat" = "other" ]; then
        other_pkgs+=("\"$pkg_entry\"")
      else
        if [ -z "${caps[$cat]}" ]; then
          caps[$cat]="\"$pkg_entry\""
        else
          caps[$cat]="${caps[$cat]}, \"$pkg_entry\""
        fi
      fi
    done < <(jq -r '.dependencies | to_entries[] | "\(.key)\t\(.value)"' Packages/manifest.json 2>/dev/null)
  else
    # Fallback: grep/sed extraction (less reliable but functional)
    while IFS=':' read -r name ver; do
      name=$(echo "$name" | sed 's/^[[:space:]]*"//;s/"[[:space:]]*$//;s/",[[:space:]]*$//')
      ver=$(echo "$ver" | sed 's/^[[:space:]]*"//;s/"[[:space:],]*$//;s/",[[:space:]]*$//')
      [ -z "$name" ] && continue

      # Skip ignored packages
      if [[ "$name" == com.unity.modules.* ]] || [[ "$name" == com.unity.ide.* ]] || [[ "$name" == "com.unity.test-framework" ]] || [[ "$name" == "com.unity.2d.sprite" ]] || [[ "$name" == "com.unity.ai.navigation" ]] || [[ "$name" == "com.unity.timeline" ]] || [[ "$name" == "com.unity.ugui" ]] || [[ "$name" == "com.unity.visualscripting" ]]; then
        continue
      fi

      result=$(categorize "$name" "$ver")
      cat=$(echo "$result" | cut -d: -f1)
      pkg_entry="$name@$ver"

      if [ "$cat" = "other" ]; then
        other_pkgs+=("\"$pkg_entry\"")
      else
        if [ -z "${caps[$cat]}" ]; then
          caps[$cat]="\"$pkg_entry\""
        else
          caps[$cat]="${caps[$cat]}, \"$pkg_entry\""
        fi
      fi
    done < <(grep -E '^[[:space:]]*"[^"]+":' Packages/manifest.json 2>/dev/null | grep -v 'dependencies' | grep -v '{' | grep -v '}')
  fi
fi

# Build capabilities JSON (only non-empty categories)
CAPABILITIES_JSON="{}"
first_cap=true
for cat in xr input rendering ai_integration networking editor ecs mobile other; do
  pkgs=""
  if [ "$cat" = "other" ]; then
    if [ ${#other_pkgs[@]} -gt 0 ]; then
      pkgs=$(IFS=,; echo "${other_pkgs[*]}")
    fi
  else
    pkgs="${caps[$cat]}"
  fi

  if [ -n "$pkgs" ]; then
    if $first_cap; then
      CAPABILITIES_JSON=$(printf '{\n    "%s": [%s]' "$cat" "$pkgs")
      first_cap=false
    else
      CAPABILITIES_JSON=$(printf '%s,\n    "%s": [%s]' "$CAPABILITIES_JSON" "$cat" "$pkgs")
    fi
  fi
done
if ! $first_cap; then
  CAPABILITIES_JSON="$CAPABILITIES_JSON"$'\n  }'
fi

cat << EOF
{
  "unityVersion": "$UNITY_VERSION",
  "renderPipeline": "$PIPELINE",
  "dimension": $DIMENSION,
  "template": "$TEMPLATE",
  "projectPath": "$(pwd)",
  "capabilities": $CAPABILITIES_JSON
}
EOF
