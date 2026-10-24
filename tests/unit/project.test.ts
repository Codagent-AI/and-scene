import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '../..')
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' })

describe('npm scripts', () => {
  it('keeps npm test to fast unit tests and puts browser-backed suites in separate scripts', () => {
    expect(pkg.scripts.test).toBe('vitest run')
    expect(pkg.scripts['test:integration']).toContain('vitest.integration.config.ts')
    expect(pkg.scripts['test:e2e']).toContain('vitest.e2e.config.ts')
    const unit = readFileSync(path.join(root, 'vitest.config.ts'), 'utf8')
    expect(unit).toContain('tests/unit/**')
    expect(unit).not.toMatch(/integration|e2e/)
    expect(readFileSync(path.join(root, 'vitest.integration.config.ts'), 'utf8')).toContain('tests/integration/**')
    expect(readFileSync(path.join(root, 'vitest.e2e.config.ts'), 'utf8')).toContain('tests/e2e/**')
  })

  it('exposes build, lint, verify and inspect with the documented commands', () => {
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(pkg.scripts.lint).toBe('eslint .')
    expect(pkg.scripts.verify).toBe('node scripts/verify.mjs')
    expect(pkg.scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
    expect(pkg.devDependencies).toHaveProperty(['playwright'])
  })

  it('typechecks the test fixtures as part of the build', () => {
    const refs = JSON.parse(readFileSync(path.join(root, 'tsconfig.json'), 'utf8')).references.map((r: { path: string }) => r.path)
    expect(refs).toContain('./tsconfig.test.json')
  })
})

describe('repository hygiene', () => {
  it('adds no hosted CI configuration', () => {
    expect(existsSync(path.join(root, '.github/workflows'))).toBe(false)
  })

  it('ignores generated output, dependencies and inspection screenshots, and tracks none of them', () => {
    const ignore = readFileSync(path.join(root, '.gitignore'), 'utf8').split('\n')
    for (const entry of ['node_modules', 'dist', 'inspection']) expect(ignore).toContain(entry)
    const tracked = git('ls-files').split('\n')
    expect(tracked.filter((f) => /(^|\/)(node_modules|dist|inspection)\//.test(f))).toEqual([])
    expect(tracked.filter((f) => f.endsWith('.png') && f.includes('inspection'))).toEqual([])
  })

  it('does not use localhost in verification or inspection automation', () => {
    for (const file of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib/preview.mjs', 'scripts/lib/verify-lib.mjs']) {
      expect(readFileSync(path.join(root, file), 'utf8'), file).not.toMatch(/localhost/)
    }
    expect(readFileSync(path.join(root, 'scripts/lib/preview.mjs'), 'utf8')).toContain("HOST = '127.0.0.1'")
  })

  it('warnings are advisory: neither script ties exit status to warning counts', () => {
    const inspect = readFileSync(path.join(root, 'scripts/inspect-presentation.mjs'), 'utf8')
    expect(inspect).not.toMatch(/exitCode\s*=\s*[^;]*warn/i)
    expect(readFileSync(path.join(root, 'scripts/verify.mjs'), 'utf8')).not.toMatch(/inspect-diagnostics|warningsForStep/)
  })
})
