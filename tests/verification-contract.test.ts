import { describe, expect, it } from 'vitest'
import { beats } from '../src/presentations/how-to-make-a-presentation/beats.mjs'
import { validateReferenceContract } from '../scripts/verification-contract.mjs'

const registry = `export const presentations = [{ slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') }]`

describe('reference verification contract', () => {
  it('accepts the registered sample with canonical structured beats', () => {
    expect(() => validateReferenceContract(registry, beats)).not.toThrow()
  })

  it('rejects missing registration and a beat whose title/caption pair differs', () => {
    expect(() => validateReferenceContract(registry.replace('how-to-make-a-presentation', 'other'), beats)).toThrow(/sample.*registered/i)
    const alteredBeats = beats.map((beat, index) => index === 0 ? ([beat[0], 'Changed first title', beat[2]] as const) : beat)
    expect(() => validateReferenceContract(registry, alteredBeats)).toThrow(/sample contract mismatch/i)
  })
})
