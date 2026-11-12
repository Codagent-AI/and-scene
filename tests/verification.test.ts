import { describe, expect, it } from 'vitest'
// @ts-expect-error JavaScript scripts deliberately run directly in Node.
import { validateReference } from '../scripts/reference.mjs'
// @ts-expect-error JavaScript scripts deliberately run directly in Node.
import { diagnose } from '../scripts/diagnostics.mjs'

const EXPECTED_OUTLINE = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]
const canonical = () => EXPECTED_OUTLINE.map(([era, title, caption]: string[]) => ({ era, title, caption }))
describe('reference outline validation', () => {
  it('accepts exact normative metadata and rejects missing, reordered, or malformed steps', () => {
    expect(() => validateReference(canonical())).not.toThrow()
    expect(() => validateReference([])).toThrow('nine')
    const reversed = canonical().reverse()
    expect(() => validateReference(reversed)).toThrow('step 0')
    for (const field of ['era', 'title', 'caption']) {
      const malformed = canonical()
      malformed[4][field] = 'wrong'
      expect(() => validateReference(malformed)).toThrow(`step 4: ${field}`)
    }
  })
})
describe('advisory visual diagnostics', () => {
  it('reports text collision and ignores separated or touching rectangles', () => {
    const texts = [{ name: 'one', x: 0, y: 0, width: 10, height: 10 }, { name: 'two', x: 5, y: 5, width: 10, height: 10 }]
    const input = { texts, controls: [], attribution: { fontSize: 14, color: 'rgb(1, 2, 3)', decoration: 'none', fontFamily: 'Arial' } }
    expect(diagnose(input)).toEqual(['overlap: one / two'])
    texts[1].x = 10
    expect(diagnose(input)).toEqual([])
  })
  it('distinguishes active chrome and classifies missing, small, default, and polished attribution', () => {
    const input = { texts: [], controls: [{ group: 'progress', name: 'active', active: true, appearance: 'same' }, { group: 'progress', name: 'inactive', active: false, appearance: 'same' }], attribution: null as null | { fontSize: number, color: string, decoration: string, fontFamily: string } }
    expect(diagnose(input).join(' ')).toContain('indistinct active chrome')
    expect(diagnose(input).join(' ')).toContain('missing attribution')
    input.controls[0].appearance = 'distinct'
    for (const attribution of [{ fontSize: 8, color: 'black', decoration: 'none', fontFamily: 'Arial' }, { fontSize: 16, color: 'rgb(0, 0, 238)', decoration: 'underline', fontFamily: 'serif' }, { fontSize: 16, color: 'black', decoration: 'none', fontFamily: 'Times New Roman' }]) {
      input.attribution = attribution
      expect(diagnose(input).join(' ')).toContain('unpolished attribution')
    }
    input.attribution = { fontSize: 14, color: 'black', decoration: 'none', fontFamily: 'Arial' }
    expect(diagnose(input)).toEqual([])
  })
})
