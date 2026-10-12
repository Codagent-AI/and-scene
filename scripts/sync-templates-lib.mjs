import { randomUUID } from 'node:crypto'
import { rename, rm } from 'node:fs/promises'
import path from 'node:path'

export function findSnapshotDrift(expectedPaths, actualPaths) {
  const expected = new Set(expectedPaths)
  const actual = new Set(actualPaths)
  return {
    missing: [...expected].filter((file) => !actual.has(file)),
    unexpected: [...actual].filter((file) => !expected.has(file)),
  }
}

export async function replaceSnapshot(staging, target, { renamePath = rename, removePath = rm } = {}) {
  const backup = path.join(path.dirname(target), `.${path.basename(target)}-backup-${randomUUID()}`)
  let originalMoved = false
  try {
    await renamePath(target, backup)
    originalMoved = true
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }

  try {
    await renamePath(staging, target)
  } catch (error) {
    if (originalMoved) {
      try { await renamePath(backup, target) } catch (restoreError) {
        throw new AggregateError([error, restoreError], `Could not install staged snapshot or restore backup at ${backup}`)
      }
      originalMoved = false
    }
    throw error
  }
  if (originalMoved) await removePath(backup, { recursive: true, force: true })
}
