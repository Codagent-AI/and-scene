import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '..')

describe('verify entry point', () => {
  it('package.json exposes npm run verify', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
    expect(pkg.scripts?.verify).toBe('node --experimental-strip-types scripts/verify.mjs')
  })

  it('verify script exists', () => {
    expect(() => readFileSync(join(ROOT, 'scripts/verify.mjs'), 'utf-8')).not.toThrow()
  })

  it('package.json exposes npm run inspect for visual screenshots', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
    expect(pkg.scripts?.inspect).toBe(
      'node --experimental-strip-types scripts/inspect-presentation.mjs',
    )
  })

  it('inspect script exists', () => {
    expect(() => readFileSync(join(ROOT, 'scripts/inspect-presentation.mjs'), 'utf-8')).not.toThrow()
  })

  it('inspect warns when the required attribution is missing', () => {
    for (const path of [
      join(ROOT, 'scripts/inspect-presentation.mjs'),
      join(ROOT, 'skills/presentation/templates/bootstrap/scripts/inspect-presentation.mjs'),
    ]) {
      const script = readFileSync(path, 'utf-8')
      expect(script).toContain('required attribution is missing')
      expect(script).toMatch(/if \(!isVisible\(attribution\)\)/)
    }
  })

  it('playwright is listed as a dev dependency', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
    expect(pkg.devDependencies?.playwright).toBeDefined()
  })
})
