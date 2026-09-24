import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { validateReferenceOutline } from '../scripts/reference-contract.mjs'

describe('reference presentation contract', () => {
  it('contains the canonical nine steps in order', async () => {
    const source = await readFile(new URL('../src/presentations/how-to-make-a-presentation/steps/index.tsx', import.meta.url), 'utf8')
    expect(validateReferenceOutline(source)).toEqual([])
  })

  it('draws entity morphs on links between accumulated cards', async () => {
    const source = await readFile(new URL('../src/presentations/how-to-make-a-presentation/steps/Scene.tsx', import.meta.url), 'utf8')
    expect(source).toContain('morph-link')
    expect(source).toContain('Morph link between consecutive steps')
  })
})
