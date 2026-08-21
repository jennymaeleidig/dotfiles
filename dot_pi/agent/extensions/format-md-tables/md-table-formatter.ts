// md-table-formatter.ts
// ─────────────────────────────────────────────────────────────────────────────
// Licensed under the MIT License.
//
// The algorithm below (formatMarkdownTables and all helpers) is reused verbatim
// from opencode-md-table-formatter (c) 2025 franlol, MIT License:
//   https://github.com/franlol/opencode-md-table-formatter
//
// Changes vs upstream (both are runtime adaptations, not vendored copies):
//  1. `Bun.stringWidth` (a Bun-only API) is replaced with a self-contained
//     Node-compatible display-width helper (`getDisplayWidth`), so this module
//     has zero external dependencies.
//  2. Width is computed from the LITERAL cell text. Upstream strips markdown
//     markup (** * ~~ links) when measuring width because opencode's
//     concealment mode hides it. pi has no concealment mode, so every literal
//     character occupies its real column; stripping would undercount styled
//     cells and misalign the columns. Wide (CJK/emoji) glyphs still count 2.
//
// The MIT License text is reproduced below in full.
//
// MIT License
//
// Copyright (c) 2025 franlol
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
// ─────────────────────────────────────────────────────────────────────────────

// Width cache for performance optimization
const widthCache = new Map<string, number>()
let cacheOperationCount = 0

/**
 * Node-compatible replacement for Bun.stringWidth.
 *
 * Computes the terminal display width of a string, counting wide (east-asian)
 * and emoji characters as 2 columns and zero-width / combining characters as 0.
 * This is a self-contained implementation with no external dependencies.
 */
function getDisplayWidth(input: string): number {
  let width = 0
  for (const char of input) {
    const codePoint = char.codePointAt(0)!
    if (codePoint === 0) continue // null character
    if (isWideCodePoint(codePoint)) {
      width += 2
    } else {
      width += 1
    }
  }
  return Math.max(0, width)
}

// East Asian Width "W" (wide) and "F" (fullwidth) ranges, plus the commonly
// encountered emoji ranges (which a terminal renders as 2 columns).
const WIDE_RANGES: ReadonlyArray<readonly [number, number]> = [
  // Hangul Jamo / Syllables
  [0x1100, 0x115f],
  [0xac00, 0xd7a3],
  [0xa960, 0xa97c],
  // CJK Radicals Supplement .. Kangxi Radicals
  [0x2e80, 0x2e99],
  [0x2e9b, 0x2ef3],
  [0x2f00, 0x2fd5],
  // CJK Symbols and Punctuation .. CJK Compatibility
  [0x3000, 0x303e],
  [0x3041, 0x3096],
  [0x3099, 0x30ff],
  [0x3105, 0x312f],
  [0x3131, 0x318e],
  [0x3190, 0x31e3],
  [0x31f0, 0x321e],
  [0x3220, 0x3247],
  [0x3250, 0x4dbf],
  [0x4e00, 0xa48c],
  [0xa490, 0xa4c6],
  // Yi Syllables .. Yi Radicals
  [0xa4d0, 0xa62b],
  // CJK Compatibility Ideographs
  [0xf900, 0xfaff],
  [0xfe10, 0xfe19],
  [0xfe30, 0xfe52],
  [0xfe54, 0xfe66],
  [0xfe68, 0xfe6b],
  // Fullwidth Forms
  [0xff01, 0xff60],
  [0xffe0, 0xffe6],
  // Emoji / Miscellaneous Symbols and Pictographs
  [0x1f300, 0x1f64f],
  [0x1f680, 0x1f6ff],
  [0x1f900, 0x1f9ff],
  [0x1fa70, 0x1faff],
  [0x2600, 0x27bf],
  [0xfe00, 0xfe0f], // variation selectors (zero/short; keep cheap)
  [0x1f1e6, 0x1f1ff], // regional indicators
  [0x231a, 0x231b],
  [0x23e9, 0x23ec],
  [0x23f0, 0x23f0],
  [0x23f3, 0x23f3],
  [0x25fd, 0x25fe],
  [0x2614, 0x2615],
  [0x2648, 0x2653],
  [0x267f, 0x267f],
  [0x2693, 0x2693],
  [0x26a1, 0x26a1],
  [0x26aa, 0x26ab],
  [0x26bd, 0x26be],
  [0x26c4, 0x26c5],
  [0x26ce, 0x26ce],
  [0x26d4, 0x26d4],
  [0x26ea, 0x26ea],
  [0x26f2, 0x26f3],
  [0x26f5, 0x26f5],
  [0x26fa, 0x26fa],
  [0x26fd, 0x26fd],
  [0x2705, 0x2705],
  [0x270a, 0x270b],
  [0x2728, 0x2728],
  [0x274c, 0x274c],
  [0x274e, 0x274e],
  [0x2753, 0x2755],
  [0x2757, 0x2757],
  [0x2795, 0x2797],
  [0x27b0, 0x27b0],
  [0x27bf, 0x27bf],
  [0x2b1b, 0x2b1c],
  [0x2b50, 0x2b50],
  [0x2b55, 0x2b55],
] as const

function isWideCodePoint(codePoint: number): boolean {
  for (const [start, end] of WIDE_RANGES) {
    if (codePoint >= start && codePoint <= end) return true
  }
  return false
}

export function formatMarkdownTables(text: string): string {
  const lines = text.split("\n")
  const result: string[] = []
  let i = 0
  // Reused verbatim from upstream, with one contained addition to the scan
  // loop only: track fenced code blocks so tables that appear inside a fence
  // (``` or ~~~) are treated as literal text and never reformatted. All of the
  // table detection / formatting helpers below are upstream-verbatim.
  let inFence = false

  while (i < lines.length) {
    const line = lines[i]

    // Toggle fenced code block boundaries. Inside a fence, tables are literal.
    if (/^(```+|~~~+)/.test(line.trim())) {
      inFence = !inFence
      result.push(line)
      i++
      continue
    }

    if (!inFence && isTableRow(line)) {
      const tableLines: string[] = [line]
      i++

      while (i < lines.length && isTableRow(lines[i])) {
        tableLines.push(lines[i])
        i++
      }

      if (isValidTable(tableLines)) {
        result.push(...formatTable(tableLines))
      } else {
        result.push(...tableLines)
        result.push("<!-- table not formatted: invalid structure -->")
      }
    } else {
      result.push(line)
      i++
    }
  }

  incrementOperationCount()
  return result.join("\n")
}

function isTableRow(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.split("|").length > 2
}

function isSeparatorRow(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return false
  const cells = trimmed.split("|").slice(1, -1)
  return cells.length > 0 && cells.every((cell) => /^\s*:?-+:?\s*$/.test(cell))
}

function isValidTable(lines: string[]): boolean {
  if (lines.length < 2) return false

  const rows = lines.map((line) =>
    line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim()),
  )

  if (rows.length === 0 || rows[0].length === 0) return false

  const firstRowCellCount = rows[0].length
  const allSameColumnCount = rows.every((row) => row.length === firstRowCellCount)
  if (!allSameColumnCount) return false

  const hasSeparator = lines.some((line) => isSeparatorRow(line))
  return hasSeparator
}

function formatTable(lines: string[]): string[] {
  const separatorIndices = new Set<number>()
  for (let i = 0; i < lines.length; i++) {
    if (isSeparatorRow(lines[i])) separatorIndices.add(i)
  }

  const rows = lines.map((line) =>
    line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim()),
  )

  if (rows.length === 0) return lines

  const colCount = Math.max(...rows.map((row) => row.length))

  const colAlignments: Array<"left" | "center" | "right"> = Array(colCount).fill("left")
  for (const rowIndex of separatorIndices) {
    const row = rows[rowIndex]
    for (let col = 0; col < row.length; col++) {
      colAlignments[col] = getAlignment(row[col])
    }
  }

  const colWidths: number[] = Array(colCount).fill(3)
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    if (separatorIndices.has(rowIndex)) continue
    const row = rows[rowIndex]
    for (let col = 0; col < row.length; col++) {
      const displayWidth = calculateDisplayWidth(row[col])
      colWidths[col] = Math.max(colWidths[col], displayWidth)
    }
  }

  return rows.map((row, rowIndex) => {
    const cells: string[] = []
    for (let col = 0; col < colCount; col++) {
      const cell = row[col] ?? ""
      const align = colAlignments[col]

      if (separatorIndices.has(rowIndex)) {
        cells.push(formatSeparatorCell(colWidths[col], align))
      } else {
        cells.push(padCell(cell, colWidths[col], align))
      }
    }
    return "| " + cells.join(" | ") + " |"
  })
}

function getAlignment(delimiterCell: string): "left" | "center" | "right" {
  const trimmed = delimiterCell.trim()
  const hasLeftColon = trimmed.startsWith(":")
  const hasRightColon = trimmed.endsWith(":")

  if (hasLeftColon && hasRightColon) return "center"
  if (hasRightColon) return "right"
  return "left"
}

function calculateDisplayWidth(text: string): number {
  if (widthCache.has(text)) {
    return widthCache.get(text)!
  }

  const width = getStringWidth(text)
  widthCache.set(text, width)
  return width
}

// pi has no concealment mode (unlike opencode), so a cell's visible width is
// its literal text — markdown markup such as `**`, backticks, and links all
// occupy their real columns. Only wide (CJK/emoji) glyphs count double.
function getStringWidth(text: string): number {
  return getDisplayWidth(text)
}

function padCell(text: string, width: number, align: "left" | "center" | "right"): string {
  const displayWidth = calculateDisplayWidth(text)
  const totalPadding = Math.max(0, width - displayWidth)

  if (align === "center") {
    const leftPad = Math.floor(totalPadding / 2)
    const rightPad = totalPadding - leftPad
    return " ".repeat(leftPad) + text + " ".repeat(rightPad)
  } else if (align === "right") {
    return " ".repeat(totalPadding) + text
  } else {
    return text + " ".repeat(totalPadding)
  }
}

function formatSeparatorCell(width: number, align: "left" | "center" | "right"): string {
  if (align === "center") return ":" + "-".repeat(Math.max(1, width - 2)) + ":"
  if (align === "right") return "-".repeat(Math.max(1, width - 1)) + ":"
  return "-".repeat(width)
}

function incrementOperationCount() {
  cacheOperationCount++

  if (cacheOperationCount > 100 || widthCache.size > 1000) {
    cleanupCache()
  }
}

function cleanupCache() {
  widthCache.clear()
  cacheOperationCount = 0
}
