import { mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { materializeTemplate, output, REPO, removeScratch, run, scratch } from '../support'
import { FIXTURE_FILES } from './fixtures/inspection'

// INT-002: the screenshot helper writes one settled image per step and prints step-specific
// advisory warnings, without failing the run on warnings alone.
let work: string
let app: string

beforeAll(() => {
  work = scratch('inspection')
  app = join(work, 'app')
  materializeTemplate(app)
  for (const [path, content] of Object.entries(FIXTURE_FILES)) {
    mkdirSync(join(app, path, '..'), { recursive: true })
    writeFileSync(join(app, path), content)
  }
  // The fixture reuses the repository's installed dependencies instead of reinstalling them.
  symlinkSync(join(REPO, 'node_modules'), join(app, 'node_modules'), 'dir')
}, 120_000)

afterAll(() => {
  removeScratch(work)
})

function warningsFor(text: string): string[] {
  return text.split('\n').filter((line) => line.startsWith('WARNING '))
}

describe('inspection helper on the fixture presentations', () => {
  it('writes one settled PNG per step and reports step-specific warnings for the unpolished variant', () => {
    const result = run('node', [join(app, 'scripts/inspect-presentation.mjs'), 'fixture-plain'], { cwd: app })
    const text = output(result)
    expect(result.status, text).toBe(0)

    const images = readdirSync(join(app, 'inspection/fixture-plain')).sort()
    expect(images).toEqual(['step-01.png', 'step-02.png', 'step-03.png'])
    const header = readFileSync(join(app, 'inspection/fixture-plain/step-01.png')).subarray(0, 24)
    expect(header.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))).toBe(true)
    expect({ width: header.readUInt32BE(16), height: header.readUInt32BE(20) }).toEqual({ width: 1440, height: 900 })

    const warnings = warningsFor(text)
    expect(warnings.some((line) => line.includes('step 1') && line.includes('"collide-a" overlaps "collide-b"'))).toBe(true)
    expect(warnings.some((line) => line.includes('step 2') && line.includes('overlaps'))).toBe(false)
    expect(warnings.some((line) => line.includes('inside'))).toBe(false)
    for (const step of [1, 2, 3]) {
      expect(warnings.some((line) => line.includes(`step ${step}:`) && line.includes('attribution'))).toBe(true)
      expect(warnings.some((line) => line.includes(`step ${step}:`) && line.includes('progress indicator'))).toBe(true)
      expect(warnings.some((line) => line.includes(`step ${step}:`) && line.includes('table-of-contents entry'))).toBe(true)
    }
    // Each capture waits for the settle interval after the previous one (default 1800 ms).
    const captures = text.split('\n').filter((line) => line.startsWith('captured step-')).map((line) => Number(/at (\d+) ms/.exec(line)![1]))
    expect(captures).toHaveLength(3)
    for (let index = 1; index < captures.length; index += 1) {
      expect(captures[index]! - captures[index - 1]!).toBeGreaterThanOrEqual(1800)
    }
  }, 280_000)

  it('stays quiet about legible, distinct chrome and marked overlaps in the polished variant', () => {
    const result = run('node', [join(app, 'scripts/inspect-presentation.mjs'), 'fixture-polished'], { cwd: app })
    const text = output(result)
    expect(result.status, text).toBe(0)
    const warnings = warningsFor(text)
    expect(warnings.some((line) => line.includes('attribution'))).toBe(false)
    expect(warnings.some((line) => line.includes('indistinct'))).toBe(false)
    expect(warnings.some((line) => line.includes('table-of-contents entry'))).toBe(false)
    expect(warnings.some((line) => line.includes('step 2') && line.includes('overlaps'))).toBe(false)
    expect(warnings.some((line) => line.includes('step 1') && line.includes('"collide-a" overlaps "collide-b"'))).toBe(true)
  }, 280_000)

  it('writes narrow screenshots to a separate predictable directory', () => {
    const result = run('node', [join(app, 'scripts/inspect-presentation.mjs'), 'fixture-polished', '--narrow'], { cwd: app })
    expect(result.status, output(result)).toBe(0)
    const header = readFileSync(join(app, 'inspection/fixture-polished-narrow/step-03.png')).subarray(0, 24)
    expect({ width: header.readUInt32BE(16), height: header.readUInt32BE(20) }).toEqual({ width: 390, height: 844 })
  }, 280_000)
})
