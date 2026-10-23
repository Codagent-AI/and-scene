import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '..', '..')
const read = (f: string) => readFileSync(join(ROOT, f), 'utf8')
const pkg = JSON.parse(read('package.json'))

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

describe('npm scripts separate fast tests from slow suites', () => {
  it('defines build, lint, verify, inspect and the separate slow test scripts', () => {
    expect(pkg.scripts).toMatchObject({
      build: 'tsc -b && vite build',
      lint: 'eslint .',
      verify: 'node scripts/verify.mjs',
      inspect: 'node scripts/inspect-presentation.mjs',
      test: 'vitest run',
      'test:integration': 'vitest run --config vitest.integration.config.ts',
      'test:e2e': 'vitest run --config vitest.e2e.config.ts',
    })
  })

  it('keeps `npm test` to tests/unit and the slow configs to their own directories', () => {
    expect(read('vitest.config.ts')).toContain("include: ['tests/unit/**/*.test.{ts,tsx}']")
    expect(read('vitest.integration.config.ts')).toContain("'tests/integration/**/*.test.ts'")
    expect(read('vitest.e2e.config.ts')).toContain("'tests/e2e/**/*.test.ts'")
  })

  it('has no browser, build or subprocess-spawning dependency in the fast unit tests', () => {
    for (const file of walk(join(ROOT, 'tests', 'unit')).filter((f) => /\.test\.tsx?$/.test(f) && !f.endsWith('repo-contract.test.ts'))) {
      const src = readFileSync(file, 'utf8')
      expect(src, relative(ROOT, file)).not.toMatch(/from 'playwright'|chromium\.launch|['"]npm['"]/)
    }
  })

  it('lints application code, scripts and tests, and type-checks all of them in the build', () => {
    const eslint = read('eslint.config.js')
    for (const glob of ['scripts/**/*.mjs', 'tests/**/*.{ts,tsx}', '**/*.{ts,tsx}']) expect(eslint).toContain(glob)
    expect(read('tsconfig.json')).toContain('tsconfig.test.json')
    expect(read('tsconfig.test.json')).toContain('"tests"')
    expect(read('tsconfig.app.json')).toContain('"src"')
  })
})

describe('repository hygiene', () => {
  const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean)

  it('ignores generated output, dependencies and inspection screenshots', () => {
    const ignore = read('.gitignore').split('\n')
    for (const pattern of ['node_modules', 'dist', '.inspection']) expect(ignore).toContain(pattern)
  })

  it('tracks no build output, dependency directories or screenshots', () => {
    expect(tracked.filter((f) => /(^|\/)(dist|node_modules|\.inspection)\//.test(f) || /\.png$/.test(f) && !/^public\//.test(f))).toEqual([])
  })

  it('adds no hosted CI configuration', () => {
    expect(existsSync(join(ROOT, '.github', 'workflows'))).toBe(false)
    expect(tracked.filter((f) => /^\.github\/workflows\/|\.gitlab-ci|\.circleci|azure-pipelines|Jenkinsfile/.test(f))).toEqual([])
  })
})
