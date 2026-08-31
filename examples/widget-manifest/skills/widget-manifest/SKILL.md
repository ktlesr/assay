---
name: widget-manifest
description: Turns a dashboard draft or notes into a widget manifest JSON file. Use when the user asks to turn a draft into a widget manifest, build widgets from notes, or produce a dashboard widget manifest.
---

# Widget manifest

Write the manifest to the relative path `out/manifest.json`.

Resolve that path against the **current working directory**, not against this
skill's base directory. Use the file-writing tool directly — it creates parent
directories for you. Do not run shell commands.

The file must be valid JSON with this shape:

```json
{
  "title": "<dashboard title from the draft>",
  "widgets": [
    { "id": "<slug>", "type": "tile" | "chart", "title": "<label>" }
  ]
}
```

After writing the file, say in one sentence what you wrote.
