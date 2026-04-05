# Paste

Inserts text instantly, preserving exact whitespace and formatting. Unlike `Type`, there is no per-character delay — the entire block appears at once. Supports single-line and triple-quoted multi-line strings. Only valid inside `File` blocks.

## Syntax

```
# Single line
Paste "text"

# Multi-line
Paste """
line one
line two
"""
```

## Example

```pop
File "utils.ts" {
  Paste """
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}
"""
  Sleep 2s
}
```

## Demo

![demo](demo.gif)

---

[← Back to Examples](../README.md)
