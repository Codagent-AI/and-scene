import { expect, test } from 'vitest'
import { reference } from '../scripts/reference.mjs'
import { presentations } from '../src/presentations'
import { steps } from '../src/presentations/how-to-make-a-presentation/steps'

test('reference metadata and registry match the permanent nine-step verification contract', () => {
  expect(reference.steps).toHaveLength(9)
  expect(steps.map(({ era, title, caption }) => [era, title, caption])).toEqual(reference.steps)

  const entry = presentations.find(({ slug }) => slug === reference.slug)
  expect(entry?.title).toBe(reference.title)
})
