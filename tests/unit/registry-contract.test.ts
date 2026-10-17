import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PRESENTATIONS } from '../../src/presentations'

describe('presentation registry source', () => {
  it('is an explicit array with a literal import per entry, not auto-discovery', () => {
    const source = readFileSync(join(__dirname, '..', '..', 'src/presentations/index.ts'), 'utf8')
    expect(source).not.toMatch(/import\.meta\.glob|require\.context/)
    const imports = [...source.matchAll(/import\('(\.\/[^']+)'\)/g)].map((m) => m[1])
    expect(imports).toHaveLength(PRESENTATIONS.length)
    expect(imports).toEqual(PRESENTATIONS.map((p) => `./${p.slug}/Talk`))
  })
})
