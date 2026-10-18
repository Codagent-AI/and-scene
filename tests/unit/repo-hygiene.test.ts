import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { read, ROOT } from './helpers'

const git = (...args: string[]) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' })
const pkg = JSON.parse(read(ROOT, 'package.json'))

describe('npm scripts', () => {
  it('keeps npm test to fast unit/component/contract tests', () => {
    expect(pkg.scripts.test).toBe('vitest run')
    const config = read(ROOT, 'vitest.config.ts')
    expect(config).toMatch(/src\/\*\*\/\*\.test/)
    expect(config).toMatch(/tests\/unit\/\*\*/)
    expect(config).not.toMatch(/integration|e2e|globalSetup/)
  })

  it('runs slower suites from separate scripts and configs', () => {
    expect(pkg.scripts['test:integration']).toContain('vitest.integration.config.ts')
    expect(pkg.scripts['test:e2e']).toContain('vitest.e2e.config.ts')
    expect(read(ROOT, 'vitest.integration.config.ts')).toContain('tests/integration/')
    expect(read(ROOT, 'vitest.e2e.config.ts')).toContain('tests/e2e/')
  })

  it('exposes build, lint, verify and inspect', () => {
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(pkg.scripts.lint).toBe('eslint .')
    expect(pkg.scripts.verify).toBe('node scripts/verify.mjs')
    expect(pkg.scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
  })
})

describe('build and lint coverage', () => {
  it('type-checks every presentation, the registry and the kit through one project', () => {
    const app = JSON.parse(read(ROOT, 'tsconfig.app.json').replace(/\/\*[\s\S]*?\*\//g, ''))
    expect(app.include).toEqual(['src'])
    expect(JSON.parse(read(ROOT, 'tsconfig.json')).references.map((r: { path: string }) => r.path)).toContain('./tsconfig.app.json')
  })

  it('lints the kit, app, scripts and tests rather than a placeholder', () => {
    const config = read(ROOT, 'eslint.config.js')
    expect(config).toContain('**/*.{ts,tsx}')
    expect(config).toContain('**/*.mjs')
    expect(config).toMatch(/globalIgnores\(\['dist', '\.presentation-inspection', '[^']*bootstrap'\]\)/)
  })

  it('mounts the app under React StrictMode', () => {
    expect(read(ROOT, 'src/main.tsx')).toMatch(/<StrictMode>/)
  })
})

describe('repository contents', () => {
  const tracked = git('ls-files', '-co', '--exclude-standard').split('\n').filter(Boolean)

  it('has no hosted CI configuration', () => {
    expect(tracked.filter((f) => /(^|\/)\.github\/workflows\//.test(f) || /\.(gitlab-ci|travis)\.ya?ml$|circleci|azure-pipelines|Jenkinsfile/.test(f))).toEqual([])
  })

  it('has no build output, dependencies or inspection artifacts at any depth', () => {
    expect(tracked.filter((f) => /(^|\/)(dist|node_modules|\.presentation-inspection)\//.test(f))).toEqual([])
  })

  it('ignores generated paths', () => {
    for (const p of ['dist/index.html', 'node_modules/x', '.presentation-inspection/demo/step-01.png', 'skills/presentation/templates/bootstrap/node_modules/x'])
      expect(git('check-ignore', p).trim(), p).toBe(p)
  })

  it('commits the sample and the skill', () => {
    for (const f of ['skills/presentation/SKILL.md', 'src/presentations/how-to-make-a-presentation/Talk.tsx', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs'])
      expect(tracked).toContain(f)
    expect(path.basename(ROOT)).toBeTruthy()
  })
})
