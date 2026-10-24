import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(__dirname, '../..')
const read = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8')
const git = (...args: string[]) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' })
const pkg = JSON.parse(read('package.json'))
const jsonc = (rel: string) => JSON.parse(read(rel).replace(/\/\*[\s\S]*?\*\//g, ''))

describe('npm scripts and test tiers', () => {
  it('keeps npm test to fast unit/contract tests and slow suites on a separate script', () => {
    expect(pkg.scripts.test).toBe('vitest run')
    expect(pkg.scripts['test:integration']).toBe('vitest run -c vitest.slow.config.ts tests/slow/int-')
    expect(pkg.scripts['test:e2e']).toBe('vitest run -c vitest.slow.config.ts tests/slow/e2e-')
    expect(pkg.scripts['test:slow']).toBe('npm run test:integration && npm run test:e2e')
    const fast = read('vitest.config.ts')
    const slow = read('vitest.slow.config.ts')
    expect(fast).toContain("include: ['tests/unit/**/*.test.{ts,tsx}']")
    expect(slow).toContain("include: ['tests/slow/**/*.test.ts']")
    expect(fast).not.toContain('slow')
  })

  it('wires build, lint, verify, and inspect', () => {
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(pkg.scripts.lint).toBe('eslint .')
    expect(pkg.scripts.verify).toBe('node scripts/verify.mjs')
    expect(pkg.scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
  })

  it('compiles every source and test file so an excluded file cannot hide a type error', () => {
    const refs = JSON.parse(read('tsconfig.json')).references.map((r: { path: string }) => r.path)
    expect(refs).toEqual(expect.arrayContaining(['./tsconfig.app.json', './tsconfig.node.json', './tsconfig.test.json']))
    expect(jsonc('tsconfig.app.json').include).toEqual(['src'])
    expect(jsonc('tsconfig.test.json').include).toEqual(expect.arrayContaining(['tests', 'src']))
    expect(jsonc('tsconfig.app.json').exclude).toBeUndefined()
  })

  it('keeps the payload type fixture honest: no casts, any, or suppressions beyond the expected errors', () => {
    const source = read('tests/types/payload.fixture.tsx').replace(/^\s*\/\/.*$/gm, '')
    expect(source).not.toMatch(/\bas\s+(?!const\b)\w/)
    expect(source).not.toMatch(/\bany\b|@ts-ignore|@ts-nocheck|unknown\s+as/)
    expect(read('tests/types/payload.fixture.tsx').match(/^\s*\/\/ @ts-expect-error:/gm)).toHaveLength(3)
    for (const file of ['src/presentation-kit/Presentation.tsx', 'src/presentation-kit/Stage.tsx', 'src/presentation-kit/types.ts', 'src/presentations/how-to-make-a-presentation/Talk.tsx']) {
      expect(read(file), file).not.toMatch(/@ts-(ignore|nocheck|expect-error)|\bas any\b|:\s*any\b/)
    }
  })
})

describe('repository hygiene', () => {
  it('adds no CI configuration', () => {
    expect(existsSync(path.join(ROOT, '.github/workflows'))).toBe(false)
    expect(git('ls-files', '.github').trim()).toBe('')
  })

  it('ignores generated output and dependencies, and tracks none of them', () => {
    const ignored = git('check-ignore', 'dist/index.html', 'node_modules/x', 'inspection/talk/step-01.png', 'dist/assets/a.js').split('\n').filter(Boolean)
    expect(ignored).toHaveLength(4)
    const tracked = git('ls-files').split('\n')
    expect(tracked.filter((f) => /^(dist|node_modules|inspection)\//.test(f) || /\.png$/.test(f) && f.includes('step-'))).toEqual([])
  })
})
