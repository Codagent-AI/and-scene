// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { isPortOpen } from '../helpers'

// INT-002: the screenshot helper drives a production preview of a controlled multi-step
// presentation and writes one settled screenshot per step plus advisory warnings.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const helper = join(repoRoot, 'scripts', 'inspect-presentation.mjs')
const fixtureRoot = join(repoRoot, 'tests', 'fixtures', 'inspect-app')
const RUN_TIMEOUT_MS = 240_000
// Short enough to keep the suite quick, long enough to clear the kit's 1.0s transition window.
const SETTLE_MS = 1_200
const STEP_COUNT = 4

const disposables: string[] = []

afterAll(() => {
  for (const dir of disposables) rmSync(dir, { recursive: true, force: true })
})

interface RunResult {
  status: number | null
  output: string
  outDir: string
  port: number | null
}

function runHelper(slug: string, extra: string[] = []): RunResult {
  const outDir = mkdtempSync(join(tmpdir(), 'and-scene-inspect-'))
  disposables.push(outDir)
  const run = spawnSync(
    process.execPath,
    [helper, slug, '--root', fixtureRoot, '--out', outDir, '--settle', String(SETTLE_MS), ...extra],
    { encoding: 'utf8', timeout: RUN_TIMEOUT_MS, maxBuffer: 32 * 1024 * 1024 },
  )
  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`
  if (run.status !== 0) console.error(output)
  const portMatch = output.match(/preview http:\/\/127\.0\.0\.1:(\d+)/)
  return { status: run.status, output, outDir, port: portMatch ? Number(portMatch[1]) : null }
}

function warningsFor(output: string, kind: string): string[] {
  return output.split('\n').filter((line) => line.startsWith(`warning [${kind}]`))
}

describe('INT-002 screenshot helper emits faithful artifacts and advisory warnings', () => {
  it(
    'writes one settled PNG per step, reports nothing for a clean presentation, and releases its preview',
    async () => {
      const result = runHelper('clean')
      expect(result.status).toBe(0)
      expect(result.output).toMatch(/http:\/\/127\.0\.0\.1:\d+/)
      expect(result.output).not.toMatch(/localhost/)
      expect(result.output).not.toMatch(/warning \[/)

      const files = readdirSync(join(result.outDir, 'clean')).filter((name) => name.endsWith('.png')).sort()
      expect(files).toEqual(
        Array.from({ length: STEP_COUNT }, (_, index) => `step-${String(index).padStart(2, '0')}.png`),
      )
      for (const file of files) {
        const bytes = readFileSync(join(result.outDir, 'clean', file))
        expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
      }

      const manifest = JSON.parse(readFileSync(join(result.outDir, 'clean', 'manifest.json'), 'utf8'))
      expect(manifest.steps).toHaveLength(STEP_COUNT)
      manifest.steps.forEach((step: { index: number; settledMs: number }, index: number) => {
        expect(step.index).toBe(index)
        // Capture happens only after the configured settle interval has elapsed since the step changed.
        expect(step.settledMs).toBeGreaterThanOrEqual(SETTLE_MS)
      })

      expect(result.port).not.toBeNull()
      expect(await isPortOpen(result.port as number)).toBe(false)
    },
    RUN_TIMEOUT_MS,
  )

  it(
    'names the step and both elements for an unmarked text collision',
    () => {
      const result = runHelper('collision')
      expect(result.status).toBe(0)
      const overlaps = warningsFor(result.output, 'overlap')
      expect(overlaps).toHaveLength(1)
      expect(overlaps[0]).toMatch(/step index 1 \(step 2 of 4\)/)
      expect(overlaps[0]).toMatch(/Overlapping label one/)
      expect(overlaps[0]).toMatch(/Second label collides/)
    },
    RUN_TIMEOUT_MS,
  )

  it(
    'does not warn about overlap inside an allow-overlap subtree',
    () => {
      const result = runHelper('allowed-overlap')
      expect(result.status).toBe(0)
      expect(warningsFor(result.output, 'overlap')).toEqual([])
      expect(readdirSync(join(result.outDir, 'allowed-overlap')).filter((name) => name.endsWith('.png'))).toHaveLength(STEP_COUNT)
    },
    RUN_TIMEOUT_MS,
  )

  it(
    'warns about visually indistinct active chrome and names the step',
    () => {
      const result = runHelper('indistinct')
      expect(result.status).toBe(0)
      const indistinct = warningsFor(result.output, 'active-chrome')
      expect(indistinct.length).toBeGreaterThan(0)
      expect(indistinct[0]).toMatch(/step index 0 \(step 1 of 4\)/)
      expect(indistinct[0]).toMatch(/data-presentation-(progress-item|toc-entry)/)
    },
    RUN_TIMEOUT_MS,
  )

  it(
    'warns about browser-default attribution and points at the attribution hook',
    () => {
      const result = runHelper('plain-attribution')
      expect(result.status).toBe(0)
      const attribution = warningsFor(result.output, 'attribution')
      expect(attribution.length).toBeGreaterThan(0)
      expect(attribution[0]).toMatch(/step index 0 \(step 1 of 4\)/)
      expect(attribution[0]).toMatch(/data-presentation-attribution/)
    },
    RUN_TIMEOUT_MS,
  )
})
