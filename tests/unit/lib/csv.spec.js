import { vi } from 'vitest'

// Some lib imports transitively pull the root store; stub it so no Vuex
// store is built.
vi.mock('@/store', () => ({ default: {} }))

import csv from '@/lib/csv'

describe('lib/csv', () => {
  describe('turnEntriesToCsvString', () => {
    test('escapes spreadsheet formula cells (SEC-8)', () => {
      const entries = [
        ['name', 'description'],
        ['SH010', '=HYPERLINK("http://evil.test";"click")'],
        ['SH020', '+cmd|calc'],
        ['SH030', '@SUM(1;2)'],
        ['SH040', 'plain text']
      ]

      const result = csv.turnEntriesToCsvString(entries)
      const lines = result.split('\n')

      expect(lines[1]).toContain('"\'=HYPERLINK')
      expect(lines[2]).toContain('"\'+cmd|calc"')
      expect(lines[3]).toContain('"\'@SUM(1;2)"')
      // Plain values stay untouched.
      expect(lines[4]).toContain('"plain text"')
      expect(lines[4]).not.toContain("'plain")
    })

    test('keeps the export format: ; delimiter and quoted cells', () => {
      const result = csv.turnEntriesToCsvString([['a', 'b']])
      expect(result).toBe('"a";"b"')
    })
  })

  describe('getNewEntityNames', () => {
    const parsedCsv = [
      ['Sequence', 'Name', 'Description'],
      ['SEQ01', 'SH001', 'A shot'],
      ['SEQ01', 'SH002', 'Another shot'],
      ['SEQ02', 'SH001', 'Yet another shot']
    ]
    const indexMatchers = [0, 1]

    test('returns lines that do not match any existing entity', () => {
      const database = { SEQ01SH001: true }
      expect(csv.getNewEntityNames(parsedCsv, indexMatchers, database)).toEqual(
        ['SEQ01 / SH002', 'SEQ02 / SH001']
      )
    })

    test('returns no name when every line matches', () => {
      const database = {
        SEQ01SH001: true,
        SEQ01SH002: true,
        SEQ02SH001: true
      }
      expect(csv.getNewEntityNames(parsedCsv, indexMatchers, database)).toEqual(
        []
      )
    })

    test('detects names altered by the spreadsheet (issue #771)', () => {
      const database = { SEQ01SH001: true, SEQ01SH002: true }
      const alteredCsv = [
        ['Sequence', 'Name'],
        ['SEQ01', 'SH1'],
        ['SEQ01', 'SH002']
      ]
      expect(
        csv.getNewEntityNames(alteredCsv, indexMatchers, database)
      ).toEqual(['SEQ01 / SH1'])
    })

    test('deduplicates lines sharing the same matcher key', () => {
      const duplicatedCsv = [
        ['Sequence', 'Name'],
        ['SEQ01', 'SH001'],
        ['SEQ01', 'SH001']
      ]
      expect(csv.getNewEntityNames(duplicatedCsv, indexMatchers, {})).toEqual([
        'SEQ01 / SH001'
      ])
    })

    test('ignores empty and single-cell lines', () => {
      const sparseCsv = [
        ['Sequence', 'Name'],
        [''],
        ['SEQ01', 'SH001'],
        ['', '']
      ]
      expect(csv.getNewEntityNames(sparseCsv, indexMatchers, {})).toEqual([
        'SEQ01 / SH001'
      ])
    })

    test('handles matcher columns missing from the line', () => {
      const shortCsv = [
        ['Sequence', 'Name', 'Description'],
        ['SEQ01', 'SH001']
      ]
      expect(csv.getNewEntityNames(shortCsv, [0, 5], {})).toEqual(['SEQ01'])
    })
  })
})
