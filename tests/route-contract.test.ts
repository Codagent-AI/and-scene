import { expect, it } from 'vitest'
import { presentationSlug } from '../src/presentation-route.mjs'
it('accepts safe registered route segments including underscores', () => {
  for (const slug of ['team_intro', 'sample-route', 'Team2']) expect(presentationSlug(slug)).toBe(slug)
})
it.each(['', '.', '..', '../other', 'a/b', 'a\\b', '%2f', '?query', '#hash', 'a"b', undefined])('rejects unsafe segment %s', slug => {
  expect(() => presentationSlug(slug)).toThrow('Invalid presentation slug')
})
