# Themes

Theme material is stored here, per the Theme concept in `CONTEXT.md`:
canonical theme files live in this directory; each app config carries its
own format-specific copy next to the app that consumes it.

Current theme: **Monokai Pro**.

| File                                          | Format                            | Consumed by                                         |
| --------------------------------------------- | --------------------------------- | --------------------------------------------------- |
| `monokai-pro.json`                            | Shiki / TextMate (VS Code colors) | syntax highlighting (e.g. opencode markdown, shiki) |
| `dot_config/opencode/themes/monokai-pro.json` | opencode theme schema             | opencode UI                                         |
| `dot_config/ghostty/themes/Monokai Pro`       | ghostty theme                     | ghostty terminal                                    |
| `dot_config/bat/themes/Monokai Pro.tmTheme`   | tmTheme                           | bat syntax highlighting                             |

Keep the copies in sync with the canonical material here when the theme changes.
