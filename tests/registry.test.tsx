import { expect, it } from 'vitest'
import { resolvePresentation } from '../src/presentations/resolve'
it('resolves multiple registered presentation routes and rejects unknown paths', () => {
 const entries = [{slug:'one',title:'One'}, {slug:'two',title:'Two'}]
 expect(resolvePresentation(entries,'/one')).toEqual(entries[0]); expect(resolvePresentation(entries,'/two')).toEqual(entries[1]); expect(resolvePresentation(entries,'/unknown')).toBeUndefined(); expect(resolvePresentation(entries,'/')).toBeUndefined()
})
