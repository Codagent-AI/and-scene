import { describe, expect, it } from 'vitest'
import { OUTLINE } from '../src/presentations/how-to-make-a-presentation/outline'
import {
  EXPECTED_SAMPLE,
  SAMPLE_SLUG,
  checkRegistration,
  describeStep,
  formatFailure,
  parseArgs,
} from './verify.mjs'

describe('verify pure helpers', () => {
  it('expects the nine normative steps in order', () => {
    expect(EXPECTED_SAMPLE).toHaveLength(9)
    expect(EXPECTED_SAMPLE.map((row) => row.title)).toEqual(OUTLINE.map((row) => row.title))
    expect(EXPECTED_SAMPLE.map((row) => row.caption)).toEqual(OUTLINE.map((row) => row.caption))
  })

  it('detects the sample slug only as a registry entry', () => {
    const registry = `export const presentations = [\n  {\n    slug: '${SAMPLE_SLUG}',\n    title: 'x',\n  },\n]`
    expect(checkRegistration(registry, SAMPLE_SLUG)).toBe(true)
    expect(checkRegistration('// removed: slug: "how-to-make-a-presentation"', SAMPLE_SLUG)).toBe(false)
    expect(checkRegistration(`slug: 'other-talk'`, SAMPLE_SLUG)).toBe(false)
  })

  it('numbers steps 1-based and keeps the 0-based index', () => {
    expect(describeStep(2)).toBe('step 3 (index 2)')
    expect(formatFailure('render', 'boom', 0)).toBe('FAIL [render] step 1 (index 0): boom')
    expect(formatFailure('build', 'npm run build failed')).toBe('FAIL [build] npm run build failed')
  })

  it('parses --root in both forms and rejects unknown arguments', () => {
    expect(parseArgs(['--root', '/tmp/app']).root).toBe('/tmp/app')
    expect(parseArgs(['--root=/tmp/app']).root).toBe('/tmp/app')
    expect(parseArgs([]).root).toBe(process.cwd())
    expect(() => parseArgs(['--bogus'])).toThrow(/unknown argument/)
  })
})
