import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../../src/presentation-kit/constants'
import {
  ALLOW_OVERLAP_ATTRIBUTE,
  ATTRIBUTION_MIN_FONT_PX,
  ATTRIBUTION_MIN_HIT_PX,
  BROWSER_DEFAULT_LINK_COLOR,
  formatWarnings,
} from '../../scripts/lib/diagnostics.mjs'
import { DEFAULT_SETTLE_MS, resolveSettleMs } from '../../scripts/lib/settle.mjs'

const root = join(__dirname, '..', '..')
const read = (path: string) => readFileSync(join(root, path), 'utf8')

describe('settle interval', () => {
  it('defaults to 900 ms, longer than the kit\'s longest enter plus layout time', () => {
    expect(DEFAULT_SETTLE_MS).toBe(900)
    expect(DEFAULT_SETTLE_MS).toBeGreaterThan((ENTER_DELAY + ENTER_T) * 1000)
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(resolveSettleMs({ env: {} })).toBe(DEFAULT_SETTLE_MS)
  })

  it('prefers the flag over the environment over the default', () => {
    expect(resolveSettleMs({ flag: '50', env: { INSPECT_SETTLE_MS: '700' } })).toBe(50)
    expect(resolveSettleMs({ env: { INSPECT_SETTLE_MS: '700' } })).toBe(700)
    expect(resolveSettleMs({ flag: '0', env: {} })).toBe(0)
  })

  it('ignores invalid values', () => {
    expect(resolveSettleMs({ flag: 'soon', env: { INSPECT_SETTLE_MS: '-5' } })).toBe(DEFAULT_SETTLE_MS)
  })
})

describe('advisory warning formatting', () => {
  const clean = { overlaps: [], indistinct: [], attribution: { status: 'present', fontSize: 14, height: 24, browserDefault: false }, minFont: 11, minHit: 16 }

  it('reports nothing for clean findings', () => {
    expect(formatWarnings(3, clean)).toEqual([])
  })

  it('names the step and both overlapping elements, pointing at the allow marker', () => {
    const [warning] = formatWarnings(4, { ...clean, overlaps: [{ a: '<div A>', b: '<div B>' }] })
    expect(warning.step).toBe(4)
    expect(warning.kind).toBe('overlap')
    expect(warning.message).toContain('<div A>')
    expect(warning.message).toContain('<div B>')
    expect(warning.message).toContain(ALLOW_OVERLAP_ATTRIBUTE)
  })

  it('identifies indistinct progress and ToC chrome', () => {
    const warnings = formatWarnings(1, { ...clean, indistinct: [{ kind: 'progress', hook: 'data-presentation-progress-item' }, { kind: 'toc', hook: 'data-presentation-toc-entry' }] })
    expect(warnings.map((w) => w.kind)).toEqual(['active-chrome', 'active-chrome'])
    expect(warnings[0].message).toContain('progress')
    expect(warnings[1].message).toContain('toc')
  })

  it('flags small, undersized, default-looking and missing attribution with the styling hook', () => {
    const small = formatWarnings(0, { ...clean, attribution: { status: 'present', fontSize: ATTRIBUTION_MIN_FONT_PX - 1, height: 24, browserDefault: false } })
    const atBoundary = formatWarnings(0, { ...clean, attribution: { status: 'present', fontSize: ATTRIBUTION_MIN_FONT_PX, height: ATTRIBUTION_MIN_HIT_PX, browserDefault: false } })
    const short = formatWarnings(0, { ...clean, attribution: { status: 'present', fontSize: 14, height: ATTRIBUTION_MIN_HIT_PX - 1, browserDefault: false } })
    const plain = formatWarnings(0, { ...clean, attribution: { status: 'present', fontSize: 14, height: 24, browserDefault: true } })
    const missing = formatWarnings(0, { ...clean, attribution: { status: 'missing' } })
    expect(atBoundary).toEqual([])
    for (const warnings of [small, short, plain, missing]) {
      expect(warnings).toHaveLength(1)
      expect(warnings[0].kind).toBe('attribution')
      expect(warnings[0].message).toContain('data-presentation-attribution')
    }
    expect(BROWSER_DEFAULT_LINK_COLOR).toBe('rgb(0, 0, 238)')
  })
})

describe('verification scripts', () => {
  const scriptFiles = ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', ...readdirSync(join(root, 'scripts/lib')).map((f) => `scripts/lib/${f}`)]

  it('never use the localhost name', () => {
    for (const file of scriptFiles) expect(read(file), file).not.toMatch(/localhost/i)
  })

  it('bind and probe the IPv4 loopback address', () => {
    expect(read('scripts/lib/runtime.mjs')).toContain("HOST = '127.0.0.1'")
    expect(read('scripts/lib/runtime.mjs')).toContain("'--host', HOST")
  })

  it('do not make verification depend on advisory diagnostics', () => {
    expect(read('scripts/verify.mjs')).not.toMatch(/diagnostics|inspect/)
  })

  it('exit non-zero on failure and print a final PASS or FAIL line', () => {
    const source = read('scripts/verify.mjs')
    expect(source).toContain('process.exit(1)')
    expect(source).toMatch(/log\('PASS'\)/)
    expect(source).toMatch(/FAIL phase=/)
  })
})

describe('repository hygiene', () => {
  const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean)

  it('does not track CI config, dependency directories, build output or screenshots', () => {
    for (const file of tracked) {
      expect(file, file).not.toMatch(/^\.github\/workflows\//)
      expect(file, file).not.toMatch(/(^|\/)node_modules\//)
      expect(file, file).not.toMatch(/(^|\/)dist\//)
      expect(file, file).not.toMatch(/(^|\/)\.inspection\//)
    }
  })

  it('tracks the sample, scripts, lock data and skill', () => {
    for (const file of [
      'package-lock.json',
      'scripts/verify.mjs',
      'scripts/inspect-presentation.mjs',
      'src/presentations/index.ts',
      'src/presentations/how-to-make-a-presentation/Talk.tsx',
      'src/presentations/how-to-make-a-presentation/entities.ts',
      'src/presentation-kit/Presentation.tsx',
    ]) {
      expect(tracked, file).toContain(file)
    }
  })

  it('ignores generated output in the root gitignore', () => {
    const ignore = read('.gitignore')
    for (const entry of ['node_modules', 'dist', '.inspection']) expect(ignore).toContain(entry)
    expect(existsSync(join(root, '.github'))).toBe(false)
  })
})

describe('npm scripts', () => {
  const scripts = JSON.parse(read('package.json')).scripts as Record<string, string>

  it('keeps npm test fast and puts slow suites behind separate scripts', () => {
    expect(scripts.test).toBe('vitest run')
    expect(scripts['test:integration']).toContain('vitest.integration.config.ts')
    expect(scripts.verify).toContain('scripts/verify.mjs')
    expect(scripts.inspect).toContain('scripts/inspect-presentation.mjs')
  })

  it('keeps integration tests out of the fast config and inside the slow one', () => {
    const fast = read('vitest.config.ts')
    const slow = read('vitest.integration.config.ts')
    expect(fast).not.toContain('tests/integration')
    expect(slow).toContain('tests/integration/**/*.test.ts')
    const dir = join(root, 'tests/integration')
    if (existsSync(dir)) {
      for (const name of readdirSync(dir)) {
        if (statSync(join(dir, name)).isFile() && name.endsWith('.ts')) expect(name).toMatch(/\.test\.ts$|^helpers/)
      }
    }
  })
})
