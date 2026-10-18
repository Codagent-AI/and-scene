import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '../..')
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
const tracked = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean)

describe('npm scripts keep layers separate', () => {
  it('npm test runs only the fast unit directory', () => {
    expect(pkg.scripts.test).toContain('tests/unit')
    expect(pkg.scripts.test).not.toMatch(/integration|e2e/)
  })

  it('slower suites have their own commands and configuration', () => {
    expect(pkg.scripts['test:integration']).toContain('tests/integration')
    expect(pkg.scripts['test:e2e']).toContain('tests/e2e')
    expect(pkg.scripts.verify).toContain('scripts/verify.mjs')
    expect(pkg.scripts.inspect).toContain('scripts/inspect-presentation.mjs')
    const fast = readFileSync(path.join(root, 'vitest.config.mjs'), 'utf8')
    expect(fast).toContain('tests/unit/')
    expect(fast).not.toMatch(/integration|e2e/)
    const slow = readFileSync(path.join(root, 'vitest.long.config.mjs'), 'utf8')
    expect(slow).toMatch(/integration,e2e/)
  })

  it('declares playwright and the test tools', () => {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const name of ['playwright', 'vitest', 'react', 'motion', 'lucide-react', 'vite']) expect(deps[name]).toBeTruthy()
  })
})

describe('repository hygiene', () => {
  it('commits no build output, dependencies, screenshots or hosted CI configuration', () => {
    expect(tracked.filter((f) => /^(dist|node_modules|\.inspection)\//.test(f) || /\.(png|jpe?g)$/.test(f) && f.includes('inspection'))).toEqual([])
    expect(tracked.filter((f) => f.startsWith('.github/') || /(^|\/)\.(gitlab-ci|travis)\.ya?ml$|(^|\/)(Jenkinsfile|azure-pipelines\.yml)$/.test(f))).toEqual([])
    expect(existsSync(path.join(root, '.github/workflows'))).toBe(false)
  })

  it('ignores generated output', () => {
    const ignore = readFileSync(path.join(root, '.gitignore'), 'utf8')
    for (const entry of ['node_modules', 'dist', '.inspection']) expect(ignore).toContain(entry)
  })

  it('tracks the sample, the skill, the scripts and the bootstrap lock data', () => {
    for (const file of [
      'src/presentations/how-to-make-a-presentation/Talk.tsx',
      'src/presentations/how-to-make-a-presentation/meta.ts',
      'skills/presentation/SKILL.md',
      'skills/presentation/templates/bootstrap/package-lock.json',
      'scripts/verify.mjs',
      'scripts/inspect-presentation.mjs',
    ]) {
      expect(tracked, file).toContain(file)
    }
  })
})
