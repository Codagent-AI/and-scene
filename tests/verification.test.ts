import { expect, it } from 'vitest'
// @ts-expect-error Node verification entry point is JavaScript
import { validateSample } from '../scripts/verify.mjs'
import sample from '../scripts/reference.json'
it('I-35 rejects missing, wrong-count and malformed/out-of-order samples', () => {
 expect(() => validateSample(sample,sample,true)).not.toThrow()
 expect(() => validateSample(sample,sample,false)).toThrow()
 expect(() => validateSample([],sample,true)).toThrow()
 expect(() => validateSample([...sample].reverse(),sample,true)).toThrow()
 for (const key of ['id','era','title','caption']) expect(() => validateSample([{...sample[0],[key]:'wrong'},...sample.slice(1)],sample,true)).toThrow()
})
