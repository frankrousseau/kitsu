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
})
