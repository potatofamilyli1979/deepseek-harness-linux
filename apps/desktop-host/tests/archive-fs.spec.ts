import { expect, it, vi } from 'vitest'
import { missingEntryAwareLstat, restoreMissingArchiveEntryResults } from '../src/archive-fs.ts'

it('reports a missing entry as undefined instead of Electron’s null', () => {
  const stats = { size: 1 }
  const probe = vi.fn((path: unknown) => (path === 'present' ? stats : null))
  const lstat = missingEntryAwareLstat(probe as unknown as typeof import('node:fs').lstatSync)
  expect(lstat('present' as never)).toBe(stats)
  expect(lstat('missing' as never)).toBeUndefined()
})

it('wraps the module export once and refreshes builtin bindings', () => {
  const fs = { lstatSync: vi.fn(() => null) as unknown as typeof import('node:fs').lstatSync }
  const sync = vi.fn()
  restoreMissingArchiveEntryResults(fs, sync)
  const installed = fs.lstatSync
  expect(sync).toHaveBeenCalledTimes(1)
  restoreMissingArchiveEntryResults(fs, sync)
  expect(fs.lstatSync).toBe(installed)
  expect(sync).toHaveBeenCalledTimes(1)
  expect(installed('anything' as never)).toBeUndefined()
})
