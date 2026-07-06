# Substring Search for Indexing

## Problem

Users cannot search in the middle of a name. Searching `andes` won't find
`Caminandes` because the current indexing system only stores prefixes
(`c`, `ca`, `cam`, ..., `caminandes`).

## Current behavior

In `indexWords` (`src/lib/indexing.js`), only prefixes of each word are indexed:

```js
for (let i = 1; i <= lowerWord.length; i++) {
  const prefix = lowerWord.substring(0, i)
```

## Proposed fix

Change `indexWords` to index all substrings instead of just prefixes:

```js
for (let start = 0; start < lowerWord.length; start++) {
  for (let i = 1; i <= lowerWord.length - start; i++) {
    const substr = lowerWord.substring(start, start + i)
```

This is a single-function change. No other code needs to be modified —
`indexSearch`, `buildAssetIndex`, `buildShotIndex`, and all other build/search
functions stay the same.

## Memory impact

A word of length L goes from L index entries to L*(L+1)/2:

| Word length | Prefix-only entries | Substring entries | Ratio |
|-------------|--------------------:|------------------:|------:|
| 5           | 5                   | 15                | 3x    |
| 10          | 10                  | 55                | 5.5x  |
| 15          | 15                  | 120               | 8x    |

With thousands of entities this is still very manageable (a few extra MB at
most). Entity names in production are typically short (shot codes, asset names).

## Why not use a library

The current custom indexer is well-suited to the project:
- Direct object references in results (no ID-to-object mapping needed)
- Tight integration with Vuex store rebuild cycle
- Zero dependencies, ~255 lines
- No need for fuzzy search, stemming, or relevance scoring

Adding substring support keeps all these advantages with a minimal change.
