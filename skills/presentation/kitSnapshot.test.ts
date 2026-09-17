import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Drift guard for the deliberately-duplicated scene kit: the canonical kit at
 * `src/presentation-kit/` and the snapshot the skill vendors at
 * `skills/presentation/templates/bootstrap/src/presentation-kit/` must stay
 * byte-identical, excluding test files (which only the canonical copy carries).
 */

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const CANONICAL_KIT = join(REPO_ROOT, 'src/presentation-kit')
const SNAPSHOT_KIT = join(REPO_ROOT, 'skills/presentation/templates/bootstrap/src/presentation-kit')

function isTestFile(path: string): boolean {
  return /(^|\/)[^/]+\.test\.[^/]+$/.test(path)
}

function walkFiles(root: string, dir = root, excludeTests = true): string[] {
  return readdirSync(dir)
    .flatMap((entry) => {
      const fullPath = join(dir, entry)
      const stats = statSync(fullPath)
      if (stats.isDirectory()) {
        return walkFiles(root, fullPath, excludeTests)
      }
      if (!stats.isFile()) {
        return []
      }
      const path = relative(root, fullPath)
      return excludeTests && isTestFile(path) ? [] : [path]
    })
    .sort()
}

function formatDriftMessage(missingFromSnapshot: string[], extraInSnapshot: string[], changed: string[]) {
  const lines = [
    'presentation-kit snapshot drifted from src/presentation-kit.',
    'src/presentation-kit is canonical: copy changed files from it into the bootstrap snapshot.',
    'Do not run `sync-kit.mjs --apply` here; it copies the snapshot into a consuming',
    "project's vendored src/presentation-kit and would overwrite canonical changes.",
    '',
  ]

  if (missingFromSnapshot.length > 0) {
    lines.push('Only in src/presentation-kit:', ...missingFromSnapshot.map((file) => `  ${file}`))
  }
  if (extraInSnapshot.length > 0) {
    lines.push('Only in bootstrap snapshot:', ...extraInSnapshot.map((file) => `  ${file}`))
  }
  if (changed.length > 0) {
    lines.push('Different contents:', ...changed.map((file) => `  ${file}`))
  }

  return lines.join('\n')
}

describe('presentation kit bootstrap snapshot', () => {
  it('matches the canonical kit byte-for-byte, excluding tests', () => {
    const canonicalFiles = walkFiles(CANONICAL_KIT)
    const snapshotFiles = walkFiles(SNAPSHOT_KIT)
    const canonicalSet = new Set(canonicalFiles)
    const snapshotSet = new Set(snapshotFiles)

    const missingFromSnapshot = canonicalFiles.filter((file) => !snapshotSet.has(file))
    const extraInSnapshot = snapshotFiles.filter((file) => !canonicalSet.has(file))
    const sharedFiles = canonicalFiles.filter((file) => snapshotSet.has(file))
    const changed = sharedFiles.filter(
      (file) => !readFileSync(join(CANONICAL_KIT, file)).equals(readFileSync(join(SNAPSHOT_KIT, file))),
    )

    const drifted =
      missingFromSnapshot.length > 0 || extraInSnapshot.length > 0 || changed.length > 0

    expect(
      drifted,
      drifted ? formatDriftMessage(missingFromSnapshot, extraInSnapshot, changed) : undefined,
    ).toBe(false)
  })

  it('keeps canonical tests out of the bootstrap snapshot', () => {
    const canonicalTests = walkFiles(CANONICAL_KIT, CANONICAL_KIT, false).filter(isTestFile)
    const snapshotFiles = new Set(walkFiles(SNAPSHOT_KIT, SNAPSHOT_KIT, false))

    expect(canonicalTests.length).toBeGreaterThan(0)
    expect(canonicalTests.filter((file) => snapshotFiles.has(file))).toEqual([])
  })
})
