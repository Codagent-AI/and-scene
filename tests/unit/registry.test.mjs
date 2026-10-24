import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { findRegistry as skillFindRegistry } from '../../skills/presentation/scripts/anchors.mjs'
import { findRegistry, registeredSlugs } from '../../scripts/lib/registry.mjs'
import { tmpDir, write } from './helpers.mjs'

const entries = (...slugs) => `export const presentations = [\n${slugs.map((s) => `  { slug: '${s}', load: () => import('./${s}/Talk') },`).join('\n')}\n]\n`

describe('registry lookup shared by the skill and verify', () => {
  it('lists the slugs of a registry that is not named index', () => {
    const dir = write(tmpDir(), { 'src/presentations/registry.ts': entries('one', 'two') })
    expect(registeredSlugs(dir)).toEqual(['one', 'two'])
    expect(findRegistry(dir)).toBe(path.join(dir, 'src/presentations/registry.ts'))
  })

  it('prefers index and ignores other modules, so verify and register agree on one file', () => {
    const dir = write(tmpDir(), {
      'src/presentations/index.ts': entries('real'),
      'src/presentations/other.ts': entries('stray'),
      'src/blog/routes.ts': entries('posts'),
    })
    expect(registeredSlugs(dir)).toEqual(['real'])
    expect(skillFindRegistry(dir)).toBe(findRegistry(dir))
  })

  it('reports no registry when none exports one', () => {
    const dir = write(tmpDir(), { 'src/blog/routes.ts': entries('posts'), 'src/presentations/notes.ts': 'export const n = 1\n' })
    expect(findRegistry(dir)).toBeNull()
    expect(registeredSlugs(dir)).toBeNull()
  })
})
