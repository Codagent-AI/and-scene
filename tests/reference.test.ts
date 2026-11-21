import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'
import { reference } from '../scripts/reference.mjs'
import { steps } from '../src/presentations/how-to-make-a-presentation/steps'

test('reference metadata matches the approved nine-step outline', () => {
  const spec = readFileSync(resolve(import.meta.dirname, '../openspec/changes/create-and-scene/specs/presentation-verification/spec.md'), 'utf8')
  const rows = spec.split('\n').filter(line => /^\| [1-9] \|/.test(line))
  expect(rows).toHaveLength(9)
  const outline = rows.map(row => {
    const [, , era, title, caption] = row.split('|').map(value => value.trim())
    return [era, title.slice(1, -1), caption]
  })
  expect(reference.steps).toEqual(outline)
  expect(steps.map(({ era, title, caption }) => [era, title, caption])).toEqual(outline)
  expect(spec).toContain(`"${reference.title}"`)
})
