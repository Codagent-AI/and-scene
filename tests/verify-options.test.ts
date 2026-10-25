// @vitest-environment node
import { expect, test } from 'vitest'
// @ts-expect-error Production CLI is a JavaScript module.
import { parseVerifyArgs } from '../scripts/verify.mjs'

test('I-31 I-45 explicit target overrides bootstrap npm script default', () => {
  expect(parseVerifyArgs(['--slug', 'example', '--slug', 'another'])).toEqual({ slug: 'another', skipBuild: false })
  expect(parseVerifyArgs(['--slug', 'old', '--slug', 'middle', '--slug', 'requested', '--no-build'])).toEqual({ slug: 'requested', skipBuild: true })
})
test('I-31 I-45 implicit reference and bootstrap defaults remain available', () => {
  expect(parseVerifyArgs([])).toEqual({ slug: 'how-to-make-a-presentation', skipBuild: false })
  expect(parseVerifyArgs(['--slug', 'example'])).toEqual({ slug: 'example', skipBuild: false })
})
test('I-31 I-45 invalid explicit target fails rather than falling back to a default route', () => {
  for (const args of [['--slug'], ['--slug', 'example', '--slug'], ['--slug', '--no-build'], ['--slug', '../other']]) {
    expect(() => parseVerifyArgs(args)).toThrow('--slug requires')
  }
})
