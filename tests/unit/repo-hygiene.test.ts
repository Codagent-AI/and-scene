import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' })
const isIgnored = (path: string): boolean => {
  try {
    execFileSync('git', ['check-ignore', '-q', '--no-index', path], { cwd: root })
    return true
  } catch {
    return false
  }
}

describe('generated output and hosted CI (AGENTS.md change guidelines)', () => {
  it('ignores build output, dependency directories and inspection screenshots, including nested paths', () => {
    for (const path of [
      'dist/index.html',
      'node_modules/react/index.js',
      '.inspection/how-to-make-a-presentation/step-01.png',
      'skills/presentation/templates/bootstrap/dist/index.html',
      'skills/presentation/templates/bootstrap/node_modules/react/index.js',
      'skills/presentation/templates/bootstrap/.inspection/starter/step-01.png',
    ]) {
      expect(isIgnored(path), path).toBe(true)
    }
  })

  it('does not ignore the template .gitignore or sources it must ship', () => {
    for (const path of [
      'skills/presentation/templates/bootstrap/.gitignore',
      'skills/presentation/templates/bootstrap/package-lock.json',
      'skills/presentation/templates/bootstrap/src/presentation-kit/index.ts',
      'skills/presentation/templates/bootstrap/scripts/verify.mjs',
    ]) {
      expect(isIgnored(path), path).toBe(false)
    }
  })

  it('bootstrap .gitignore covers dist, node_modules and .inspection', () => {
    const lines = readFileSync(join(root, 'skills/presentation/templates/bootstrap/.gitignore'), 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
    for (const entry of ['dist', 'node_modules', '.inspection']) expect(lines).toContain(entry)
  })

  it('tracks no ignored files (build output, dependencies or screenshots)', () => {
    expect(git('ls-files', '-ci', '--exclude-standard').trim()).toBe('')
  })

  it('adds no hosted CI configuration', () => {
    expect(existsSync(join(root, '.github/workflows'))).toBe(false)
    const tracked = git('ls-files').split('\n')
    expect(tracked.filter((f) => /^\.github\/workflows\/|^\.gitlab-ci|^\.circleci\/|^azure-pipelines|^Jenkinsfile|^\.travis/.test(f))).toEqual([])
  })
})

describe('npm script split', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const config = (name: string) => readFileSync(join(root, name), 'utf8')

  it('npm test runs only the fast unit config', () => {
    expect(pkg.scripts.test).toBe('vitest run')
    const unit = config('vitest.config.ts')
    expect(unit).toMatch(/include:\s*\['tests\/unit\/\*\*/)
    expect(unit).not.toMatch(/integration|e2e/)
  })

  it('integration and end-to-end suites are a separate script and config', () => {
    expect(pkg.scripts['test:integration']).toContain('vitest.integration.config.ts')
    const integration = config('vitest.integration.config.ts')
    expect(integration).toContain('tests/integration/')
    expect(integration).toContain('tests/e2e/')
    expect(integration).not.toContain('tests/unit')
  })

  it('exposes lint, build, verify, inspect and template sync entry points', () => {
    for (const name of ['lint', 'build', 'verify', 'inspect', 'sync:templates']) {
      expect(pkg.scripts[name], name).toEqual(expect.any(String))
    }
  })
})
