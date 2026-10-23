import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyWithSharedModules, materializeBootstrap, removeDir, run } from './helpers'
import { VARIANTS, writeFixtures } from './fixture-app'

/**
 * INT-002: the project-local inspection helper, run against a production preview of fixture
 * presentations, writes one settled screenshot per step and prints advisory warnings only.
 */
let app: string
let base: string

function inspect(slug: string, extra: string[] = []) {
  return run('node', ['scripts/inspect-presentation.mjs', slug, '--skip-build', ...extra], app, 300_000)
}

function warningsFor(output: string) {
  return output.split('\n').filter((line) => line.startsWith('warning:'))
}

function pngSize(path: string) {
  const bytes = readFileSync(path)
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

beforeAll(() => {
  base = materializeBootstrap('int002-base-')
  const install = run('npm', ['ci', '--no-audit', '--no-fund'], base, 900_000)
  if (install.status !== 0) throw new Error(`npm ci failed:\n${install.output}`)
  app = copyWithSharedModules(base, join(base, 'node_modules'), 'int002-app-')
  writeFixtures(app)
  const build = run('npm', ['run', 'build'], app, 300_000)
  if (build.status !== 0) throw new Error(`fixture build failed:\n${build.output}`)
}, 1_000_000)

afterAll(() => {
  if (app) removeDir(app)
  if (base) removeDir(base)
})

describe('screenshot artifacts', () => {
  it('writes one 1280x720 screenshot per step at a predictable project-local path', () => {
    const result = inspect('fixture-clean')
    expect(result.status, result.output).toBe(0)
    for (let step = 1; step <= 3; step += 1) {
      const file = join(app, '.inspection/fixture-clean', `step-0${step}.png`)
      expect(existsSync(file), file).toBe(true)
      expect(pngSize(file)).toEqual({ width: 1280, height: 720 })
    }
    expect(result.output).toContain('inspect: 3 steps captured for fixture-clean')
  }, 300_000)

  it('captures a settled completed state: the moving entity is at its final position after a zero settle', () => {
    const settled = inspect('fixture-slow', ['--positions'])
    const immediate = inspect('fixture-slow', ['--positions', '--settle', '0'])
    expect(settled.status).toBe(0)
    expect(immediate.status).toBe(0)
    const mover = (output: string, step: string) =>
      output.split('\n').find((line) => line.startsWith(`position: step ${step}`) && line.includes('mover='))
    // The zero-settle capture waits for geometry to stop changing, so it matches the settled one.
    expect(mover(immediate.output, '02')).toBe(mover(settled.output, '02'))
    // The entity really moves between steps, so the captured values are not just the start position.
    expect(mover(settled.output, '02')).not.toBe(mover(settled.output, '01'))
  }, 300_000)
})

describe('advisory overlap warnings', () => {
  it('warns for an unmarked text collision and names the step', () => {
    const result = inspect('fixture-collision')
    expect(result.status).toBe(0)
    expect(warningsFor(result.output).some((line) => line.startsWith('warning: step 1: overlap'))).toBe(true)
  }, 300_000)

  it('does not warn when both overlapping elements are inside an allow-overlap subtree', () => {
    const result = inspect('fixture-allowed')
    expect(result.status).toBe(0)
    expect(warningsFor(result.output).filter((line) => line.includes('overlap'))).toEqual([])
  }, 300_000)

  it('still warns for a marked element that collides with an unmarked outsider', () => {
    const result = inspect('fixture-mixed')
    expect(result.status).toBe(0)
    expect(warningsFor(result.output).some((line) => line.includes('overlap'))).toBe(true)
  }, 300_000)
})

describe('advisory chrome and attribution warnings', () => {
  it('warns when the active progress dot and ToC entry are indistinct from inactive ones', () => {
    const result = inspect('fixture-indistinct')
    expect(result.status).toBe(0)
    const warnings = warningsFor(result.output)
    expect(warnings.some((line) => line.includes('indistinct') && line.includes('progress-dot'))).toBe(true)
    expect(warnings.some((line) => line.includes('indistinct') && line.includes('toc-entry'))).toBe(true)
  }, 300_000)

  it('warns for a too-small attribution and names the styling hook', () => {
    const result = inspect('fixture-attribution-small')
    expect(result.status).toBe(0)
    expect(warningsFor(result.output).some((line) => line.includes('attribution') && line.includes('data-presentation-attribution'))).toBe(true)
  }, 300_000)

  it('warns for a browser-default attribution link', () => {
    const result = inspect('fixture-attribution-default')
    expect(result.status).toBe(0)
    expect(warningsFor(result.output).some((line) => line.includes('browser-default'))).toBe(true)
  }, 300_000)

  it('warns when the attribution is missing or hidden', () => {
    const result = inspect('fixture-attribution-missing')
    expect(result.status).toBe(0)
    expect(warningsFor(result.output).some((line) => line.includes('attribution link missing'))).toBe(true)
  }, 300_000)

  it('a clean styled presentation produces no warnings', () => {
    const result = inspect('fixture-clean')
    expect(warningsFor(result.output)).toEqual([])
  }, 300_000)

  it('warnings alone never change the exit code, even when several are printed together', () => {
    const result = inspect('fixture-combined')
    expect(warningsFor(result.output).length).toBeGreaterThanOrEqual(2)
    expect(result.status).toBe(0)
  }, 300_000)
})

it('every fixture variant is registered', () => {
  expect(VARIANTS.length).toBeGreaterThan(5)
})
