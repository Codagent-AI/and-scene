import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '..')

describe('verify entry point', () => {
  it('package.json exposes npm run verify', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
    expect(pkg.scripts?.verify).toBe('node scripts/verify.mjs')
  })

  it('verify script exists', () => {
    expect(() => readFileSync(join(ROOT, 'scripts/verify.mjs'), 'utf-8')).not.toThrow()
  })

  it('playwright is listed as a dev dependency', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
    expect(pkg.devDependencies?.playwright).toBeDefined()
  })
})
