import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { isValidStepCount, validateReferenceOutline } from '../scripts/reference-contract.mjs'

describe('reference presentation contract', () => {
  it('requires an explicit slug when invoked outside the repository script', async () => {
    const emptyProject = await mkdtemp(path.join(tmpdir(), 'and-scene-no-slug-'))
    try {
      const result = spawnSync(process.execPath, [path.resolve('scripts/verify.mjs')], { cwd: emptyProject, encoding: 'utf8' })
      expect(result.status).not.toBe(0)
      expect(`${result.stdout}\n${result.stderr}`).toContain('Usage: node scripts/verify.mjs <presentation-slug>')
    } finally {
      await rm(emptyProject, { recursive: true, force: true })
    }
  })

  it('contains the canonical nine steps in order', async () => {
    const source = await readFile(new URL('../src/presentations/how-to-make-a-presentation/steps/index.tsx', import.meta.url), 'utf8')
    expect(validateReferenceOutline(source)).toEqual([])
  })

  it('rejects missing, nonnumeric, fractional, and unsafe step counts', () => {
    expect(isValidStepCount(Number.NaN)).toBe(false)
    expect(isValidStepCount(0)).toBe(false)
    expect(isValidStepCount(1.5)).toBe(false)
    expect(isValidStepCount(Number.MAX_SAFE_INTEGER + 1)).toBe(false)
    expect(isValidStepCount(9)).toBe(true)
  })

  it('draws entity morphs on links between accumulated cards', async () => {
    const source = await readFile(new URL('../src/presentations/how-to-make-a-presentation/steps/Scene.tsx', import.meta.url), 'utf8')
    expect(source).toContain('morph-link')
    expect(source).toContain('Morph link between consecutive steps')
  })
})
