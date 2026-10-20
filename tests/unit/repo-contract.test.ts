// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '..', '..')
const read = (rel: string) => readFileSync(path.join(root, rel), 'utf8')
const manifest = JSON.parse(read('package.json'))
const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean)

describe('test suites', () => {
  it('keeps npm test to the fast unit suite and puts slow suites behind a separate script', () => {
    expect(manifest.scripts.test).toBe('vitest run --config vitest.config.ts')
    expect(manifest.scripts['test:integration']).toContain('vitest.integration.config.ts')
    const unit = read('vitest.config.ts')
    const slow = read('vitest.integration.config.ts')
    expect(unit).toContain("'src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}'")
    expect(unit).not.toContain('tests/integration')
    expect(slow).toContain("'tests/integration/**/*.test.ts'")
    expect(slow).not.toContain('tests/unit')
  })

  it('exposes verify and inspect commands', () => {
    expect(manifest.scripts.verify).toBe('node scripts/verify.mjs')
    expect(manifest.scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
  })

  it('declares Playwright and a way to install Chromium', () => {
    expect(manifest.devDependencies.playwright).toBeTruthy()
    expect(read('scripts/lib/common.mjs')).toContain("'install', 'chromium'")
  })
})

describe('tracked files', () => {
  it('contain no dependency directories, build output, screenshots or hosted CI config', () => {
    expect(tracked.filter((f) => /(^|\/)node_modules\//.test(f))).toEqual([])
    expect(tracked.filter((f) => /^(dist|dist-ssr)\//.test(f))).toEqual([])
    expect(tracked.filter((f) => /^inspection\//.test(f) || /\.png$/.test(f))).toEqual([])
    expect(tracked.filter((f) => f.startsWith('.github/'))).toEqual([])
  })

  it('ignores generated output', () => {
    const ignore = read('.gitignore').split('\n')
    for (const entry of ['node_modules', 'dist', 'inspection']) expect(ignore).toContain(entry)
  })
})
