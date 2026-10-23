import { copyFileSync, existsSync, readFileSync } from 'node:fs'
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

  it('captures a settled completed state: a zero-settle image is byte-identical to the default-settle image, and the configured interval is honored', () => {
    const copyStep2 = (name: string) => {
      const dest = join(app, `${name}.png`)
      copyFileSync(join(app, '.inspection/fixture-slow/step-02.png'), dest)
      return readFileSync(dest)
    }
    const settled = inspect('fixture-slow', ['--positions'])
    const settledPng = copyStep2('settled-default')
    const immediate = inspect('fixture-slow', ['--positions', '--settle', '0'])
    const immediatePng = copyStep2('settled-zero')
    expect(settled.status).toBe(0)
    expect(immediate.status).toBe(0)
    // Completed state, not mid-transition: the two captures are the same pixels.
    expect(immediatePng.equals(settledPng)).toBe(true)
    // The configured interval is honored, and the report says what was waited.
    const waited = (output: string) => Number(/settled: step 02 waited (\d+)ms \(configured settle (\d+)ms\)/.exec(output)?.[1])
    expect(waited(settled.output)).toBeGreaterThanOrEqual(2000)
    const slow = inspect('fixture-slow', ['--settle', '1500'])
    expect(/configured settle 1500ms/.test(slow.output)).toBe(true)
    expect(waited(slow.output)).toBeGreaterThanOrEqual(1500)
    // The moving entity really moves between steps; the captures are not just the start position.
    const mover = (output: string, step: string) =>
      output.split('\n').find((line) => line.startsWith(`position: step ${step}`) && line.includes('mover='))
    expect(mover(immediate.output, '02')).toBe(mover(settled.output, '02'))
    expect(mover(settled.output, '02')?.split('mover=')[1]).not.toBe(mover(settled.output, '01')?.split('mover=')[1])
  }, 300_000)
})

describe('advisory overlap warnings', () => {
  it('warns for an unmarked text collision and names the step', () => {
    const result = inspect('fixture-collision')
    expect(result.status).toBe(0)
    expect(warningsFor(result.output).some((line) => line.startsWith('warning: step 1: overlap'))).toBe(true)
  }, 300_000)

  it('warns when text overlaps an empty progress dot (chrome without text)', () => {
    const result = inspect('fixture-chrome-overlap')
    expect(result.status).toBe(0)
    expect(warningsFor(result.output).some((line) => line.startsWith('warning: step 1: overlap') && line.includes('progress dot'))).toBe(true)
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

  it('warns when the attribution element is absent from the page', () => {
    const result = inspect('fixture-attribution-absent')
    expect(result.status).toBe(0)
    expect(warningsFor(result.output).some((line) => line.includes('attribution link missing'))).toBe(true)
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
