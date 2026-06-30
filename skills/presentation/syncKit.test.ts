import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// @ts-expect-error - plain-JS CLI module, no type declarations
import { diffKit, readKit } from './sync-kit.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..', '..')
const CANONICAL = join(repoRoot, 'src/presentation-kit')
const SNAPSHOT = join(repoRoot, 'skills/presentation/templates/bootstrap/src/presentation-kit')

const map = (entries: Record<string, string>) => new Map(Object.entries(entries))

describe('diffKit', () => {
  it('reports an empty diff for identical kits', () => {
    const kit = map({ 'a.ts': '1', 'b/c.ts': '2' })
    expect(diffKit(kit, new Map(kit))).toEqual({
      added: [],
      changed: [],
      removed: [],
      identical: ['a.ts', 'b/c.ts'],
    })
  })

  it('classifies added, changed, removed, and identical files', () => {
    const snapshot = map({ keep: 'same', edit: 'new', fresh: 'added' })
    const target = map({ keep: 'same', edit: 'old', stale: 'local' })
    expect(diffKit(snapshot, target)).toEqual({
      added: ['fresh'],
      changed: ['edit'],
      removed: ['stale'],
      identical: ['keep'],
    })
  })

  it('treats the snapshot as the source of truth (target-only files are "removed")', () => {
    const snapshot = map({})
    const target = map({ 'local-only.ts': 'x' })
    const { added, removed } = diffKit(snapshot, target)
    expect(added).toEqual([])
    expect(removed).toEqual(['local-only.ts'])
  })
})

describe('readKit', () => {
  it('reads the shipped snapshot and excludes test files', () => {
    const snapshot = readKit(SNAPSHOT)
    expect(snapshot.size).toBeGreaterThan(0)
    expect([...snapshot.keys()].some((p) => /\.test\./.test(p))).toBe(false)
    expect(snapshot.has('Presentation.tsx')).toBe(true)
  })

  it('returns an empty map for a missing directory', () => {
    expect(readKit(join(SNAPSHOT, 'does-not-exist')).size).toBe(0)
  })
})

describe('snapshot ↔ canonical parity (agrees with the drift guard)', () => {
  it('shows no drift between the shipped snapshot and the canonical kit', () => {
    const { added, changed, removed } = diffKit(readKit(SNAPSHOT), readKit(CANONICAL))
    expect({ added, changed, removed }).toEqual({ added: [], changed: [], removed: [] })
  })
})
