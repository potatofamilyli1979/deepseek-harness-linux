/** Electron reports missing archive entries as null where Node documents undefined. */

/**
 * Wrap an `lstatSync` implementation so a missing archive entry reads as `undefined`.
 * LibreOfficeKit probes for its Linux engine package with
 * `lstatSync(path, { throwIfNoEntry: false }) !== undefined`, so Electron's `null` makes an
 * absent native engine look installed and prevents the WebAssembly fallback.
 * @param lstatSync - Implementation to wrap, usually `node:fs`'s export.
 * @returns A function with the same calling convention that maps `null` to `undefined`.
 */
export function missingEntryAwareLstat<T extends (...args: never[]) => unknown>(
  lstatSync: T,
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return (...args) => {
    const result = lstatSync(...args)
    return result === null ? undefined : result as ReturnType<T>
  }
}

/** Marker on the wrapped export so repeated installs replace nothing. */
interface PatchedLstat {
  readonly archiveMissingEntryAware?: true
}

/**
 * Restore Node's documented result for missing paths in the current process.
 * Existing `node:fs` importers observe the wrapper after `syncBuiltinESMExports`.
 * @param fs - Mutable `node:fs` module object.
 * @param syncBuiltinExports - Refreshes ESM bindings of builtin modules.
 * @returns Nothing.
 */
export function restoreMissingArchiveEntryResults(
  fs: { lstatSync: typeof import('node:fs').lstatSync },
  syncBuiltinExports: () => void,
): void {
  const current = fs.lstatSync as typeof fs.lstatSync & PatchedLstat
  if (current.archiveMissingEntryAware === true) return
  const wrapped = missingEntryAwareLstat(current) as typeof fs.lstatSync & PatchedLstat
  Object.defineProperty(wrapped, 'archiveMissingEntryAware', { value: true })
  fs.lstatSync = wrapped
  syncBuiltinExports()
}
