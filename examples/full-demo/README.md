# Full Demo

A complete scene showcasing what popcorn can do — scripted annotations, typing animations, paste, highlights, split view, and focus, all in one recording.

**Story**: refactoring a legacy `createUser` function (untyped, untestable, with generic errors) into clean TypeScript using explicit interfaces, a factory function with dependency injection, and zod for validation.

## Demo

![demo](demo.gif)

## What's demonstrated

| Command | Used for |
|---|---|
| `Annotate` | Narrating each step with emoji overlays |
| `Paste` | Dropping the legacy code instantly |
| `Highlight` | Pointing out the problem areas |
| `Type` | Animating the refactored code being written |
| `Split Right` | Opening a second panel for the new service |
| `Focus` | Switching between the before/after files |
| `Unsplit` | Returning to a single panel for the outro |
| `Sleep` | Giving the viewer time to read each annotation |

## Scene structure

```
scene.pop
├── Scene 1 — paste the legacy createUser and highlight its problems
├── Scene 2 — type explicit types and the Database interface (user.types.ts)
├── Scene 3 — paste the zod validation schema (user.schema.ts)
├── Scene 4 — type the factory function with injected db (user.repository.ts)
└── Scene 5 — compare before/after side-by-side, then Unsplit
```

## Editor setup

```pop
Editor {
  "language": "typescript",
  "theme": "Monokai",
  "fontSize": 16,
  "fontFamily": "JetBrains Mono",
  "minimap": { "enabled": false },
  "lineNumbers": "off",
  "roundedSelection": false,
  "scrollBeyondLastLine": false
}
```

## Render it yourself

```bash
popcorn render examples/full-demo/scene.pop -o demo.gif -f gif
```

---

[← Back to Examples](../README.md)
