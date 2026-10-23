// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const tracked = () => execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { encoding: 'utf8' }).split('\n').filter(Boolean)

describe('repository hygiene (L-79, L-80)', () => {
  it('keeps npm test to fast unit tests and puts browser tests in separate scripts', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    expect(pkg.scripts.test).toBe('vitest run')
    expect(pkg.scripts['test:integration']).toMatch(/vitest\.integration\.config/)
    expect(pkg.scripts['test:e2e']).toMatch(/vitest\.e2e\.config/)
    expect(pkg.scripts.verify).toBe('node scripts/verify.mjs')
    expect(pkg.scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
    for (const s of ['build', 'lint']) expect(pkg.scripts[s]).toBeTruthy()
    const unit = readFileSync('vitest.config.ts', 'utf8')
    expect(unit).toMatch(/tests\/unit\/\*\*/)
    expect(unit).not.toMatch(/tests\/(integration|e2e)/)
    expect(readFileSync('vitest.integration.config.ts', 'utf8')).toMatch(/tests\/integration\//)
    expect(readFileSync('vitest.e2e.config.ts', 'utf8')).toMatch(/tests\/e2e\//)
  })

  it('commits no CI configuration, build output, dependencies or screenshots', () => {
    const files = tracked()
    expect(files.filter((f) => /(^|\/)\.github\//.test(f) || /(^|\/)(\.gitlab-ci|\.circleci|azure-pipelines|Jenkinsfile)/.test(f))).toEqual([])
    expect(files.filter((f) => /(^|\/)(node_modules|dist|dist-ssr|inspection)\//.test(f))).toEqual([])
    expect(files.filter((f) => /\.(png|jpe?g|webp)$/.test(f) && !/templates\//.test(f))).toEqual([])
  })

  it('ignores generated output in .gitignore', () => {
    const ignore = readFileSync('.gitignore', 'utf8').split('\n')
    for (const pattern of ['node_modules', 'dist', 'inspection']) expect(ignore).toContain(pattern)
    const template = readFileSync('skills/presentation/templates/bootstrap/_gitignore', 'utf8').split('\n')
    for (const pattern of ['node_modules', 'dist', 'inspection']) expect(template).toContain(pattern)
  })
})
