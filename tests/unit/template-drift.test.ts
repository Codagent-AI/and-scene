// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(import.meta.dirname, '../..')
const BOOTSTRAP = path.join(ROOT, 'skills/presentation/templates/bootstrap')

function files(dir: string, base = dir): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n)
    return statSync(p).isDirectory() ? files(p, base) : [path.relative(base, p)]
  })
}
const same = (rel: string) => expect(readFileSync(path.join(BOOTSTRAP, rel)).equals(readFileSync(path.join(ROOT, rel))), `${rel} drifted from its canonical copy; update the template snapshot`).toBe(true)

describe('template snapshot drift', () => {
  it('src/presentation-kit is byte-identical to the bootstrap snapshot', () => {
    const canonical = files(path.join(ROOT, 'src/presentation-kit')).sort()
    expect(files(path.join(BOOTSTRAP, 'src/presentation-kit')).sort()).toEqual(canonical)
    canonical.forEach((f) => same(path.join('src/presentation-kit', f)))
  })

  it.each([
    'scripts/verify.mjs',
    'scripts/inspect-presentation.mjs',
    'scripts/preview-lib.mjs',
    'src/main.tsx',
    'src/Landing.tsx',
    'src/RouteBoundary.tsx',
    'src/routes.ts',
    'tsconfig.json',
    'tsconfig.app.json',
  ])('%s is aligned with the bootstrap copy', same)

  it('bootstrap differs from root only in the documented project-specific files', () => {
    const verifyCfg = JSON.parse(readFileSync(path.join(BOOTSTRAP, 'scripts/verify.config.json'), 'utf8'))
    expect(verifyCfg.slug).toBe('starter')
    const registry = readFileSync(path.join(BOOTSTRAP, 'src/presentations/index.ts'), 'utf8')
    expect(registry.match(/slug:/g)?.filter((m) => m).length).toBe(2) // interface field + exactly one entry
    expect(registry).toContain("slug: 'starter'")
  })
})
