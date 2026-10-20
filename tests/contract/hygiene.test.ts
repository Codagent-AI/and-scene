import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ROOT, read, readJson } from '../helpers/repo.ts'

// Tracked files plus untracked files that git would not ignore: what a commit would contain.
const committable = () =>
  execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter(Boolean)

describe('repository hygiene', () => {
  it('commits no build output, dependencies, or inspection screenshots', () => {
    const files = committable()
    expect(files.filter((f) => /^(dist|node_modules|inspection|test-results)\//.test(f) || /\/node_modules\//.test(f))).toEqual([])
    expect(files.filter((f) => /\.png$/.test(f) && !f.startsWith('public/'))).toEqual([])
  })

  it('ignores the generated directories', () => {
    const ignore = read(join(ROOT, '.gitignore'))
    for (const dir of ['node_modules', 'dist', 'inspection']) expect(ignore).toMatch(new RegExp(`^${dir}$`, 'm'))
    expect(read(join(ROOT, 'skills/presentation/templates/bootstrap/.gitignore'))).toMatch(/^inspection$/m)
  })

  it('adds no hosted CI configuration', () => {
    expect(existsSync(join(ROOT, '.github/workflows'))).toBe(false)
    expect(committable().filter((f) => /^\.github\/|\.gitlab-ci|\.circleci|azure-pipelines|Jenkinsfile/.test(f))).toEqual([])
  })

  it('commits the sample sources', () => {
    const files = committable()
    for (const file of ['entities.ts', 'Talk.tsx', 'Scene.tsx', 'steps/steps.ts', 'styles.css']) {
      expect(files).toContain(`src/presentations/how-to-make-a-presentation/${file}`)
    }
  })
})

describe('test tiers', () => {
  const pkg = readJson(join(ROOT, 'package.json'))

  it('keeps npm test to the fast unit and contract suite', () => {
    expect(pkg.scripts.test).toBe('vitest run')
    const config = read(join(ROOT, 'vitest.config.ts'))
    expect(config).not.toMatch(/integration|e2e/)
    expect(config).toContain("'tests/contract/**/*.test.ts'")
  })

  it('puts slower suites in separate scripts', () => {
    expect(pkg.scripts['test:integration']).toContain('vitest.integration.config.ts')
    expect(pkg.scripts['test:e2e']).toContain('vitest.e2e.config.ts')
    expect(read(join(ROOT, 'vitest.integration.config.ts'))).toContain('tests/integration/')
    expect(read(join(ROOT, 'vitest.e2e.config.ts'))).toContain('tests/e2e/')
  })

  it('wires the documented scripts', () => {
    expect(pkg.scripts).toMatchObject({
      build: 'tsc -b && vite build',
      lint: 'eslint .',
      verify: 'node scripts/verify.mjs',
      inspect: 'node scripts/inspect-presentation.mjs',
    })
  })
})
