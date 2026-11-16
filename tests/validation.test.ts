import { describe, expect, it } from 'vitest'
import { validateCount, validateSample } from '../scripts/lib/validation.mjs'
import reference from '../scripts/lib/reference.json'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { presentations } from '../src/presentations'
describe('I-28 canonical metadata', () => {
  it('has exactly nine ordered normative eras titles and captions and explicit registration', () => {
    expect(STEPS.map(({era,title,caption})=>[era,title,caption])).toEqual(reference)
    expect(STEPS).toHaveLength(9)
    expect(presentations.find(p=>p.slug==='how-to-make-a-presentation')?.title).toBe('How to Use This Skill to Make a Presentation')
    expect(()=>validateSample(STEPS)).not.toThrow()
  })
})
describe('I-31 sample validation failures', () => {
  it.each(['missing','count','order','title','caption','era'])('rejects %s sample data', fault => {
    const sample=STEPS.map(s=>({...s}))
    if(fault==='missing') sample.length=0
    if(fault==='count') sample.pop()
    if(fault==='order') [sample[0],sample[1]]=[sample[1],sample[0]]
    if(fault==='title') sample[0].title='wrong'
    if(fault==='caption') sample[0].caption='wrong'
    if(fault==='era') sample[0].era='wrong'
    expect(()=>validateSample(sample)).toThrow('sample:')
  })
})
describe('render count validation', () => {
  it.each([0,-1,NaN,1.5,1001])('rejects invalid public count %s', count => { expect(()=>validateCount(count)).toThrow('invalid data-step-count') })
  it('accepts valid counts', () => { expect(validateCount(9)).toBe(9) })
})
