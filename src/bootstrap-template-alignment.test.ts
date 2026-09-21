import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = new URL('..', import.meta.url).pathname
const bootstrap = join(root, 'skills/presentation/templates/bootstrap')

function sourceFiles(dir: string, base = dir): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return sourceFiles(path, base)
    return entry.includes('.test.') ? [] : [path.slice(base.length + 1)]
  })
}

describe('bootstrap template stays aligned with the canonical copies', () => {
  it('vendors a byte-identical scene kit', () => {
    const canonical = sourceFiles(join(root, 'src/presentation-kit'))
    expect(sourceFiles(join(bootstrap, 'src/presentation-kit')).sort()).toEqual(canonical.sort())
    for (const file of canonical) {
      expect(readFileSync(join(bootstrap, 'src/presentation-kit', file), 'utf8'), file)
        .toBe(readFileSync(join(root, 'src/presentation-kit', file), 'utf8'))
    }
  })

  it('vendors a byte-identical inspection script', () => {
    expect(readFileSync(join(bootstrap, 'scripts/inspect-presentation.mjs'), 'utf8'))
      .toBe(readFileSync(join(root, 'scripts/inspect-presentation.mjs'), 'utf8'))
  })
})
