import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '..', '..')
const INSPECT = join(ROOT, 'scripts', 'inspect-presentation.mjs')

/** The slug reaches a recursive delete, so unsafe slugs must be refused before anything is removed. */
describe('inspection slug safety', () => {
  it.each(['..', '../src', 'a/b', 'Upper', '-leading', ''])('refuses %j without touching the project', (slug) => {
    const result = spawnSync(process.execPath, [INSPECT, slug, '--skip-build'], { cwd: ROOT, encoding: 'utf8' })
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/invalid slug|usage/)
    expect(existsSync(join(ROOT, 'src', 'main.tsx'))).toBe(true)
    expect(existsSync(join(ROOT, 'node_modules'))).toBe(true)
  }, 60_000)
})
