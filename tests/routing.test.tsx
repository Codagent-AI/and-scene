// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import Landing from '../src/Landing'
import { findPresentation } from '../src/routing'
import { presentations } from '../src/presentations'
import { outline } from '../src/presentations/how-to-make-a-presentation/steps/outline'

afterEach(cleanup)

it('lists independent routes and selects only a registered lazy loader', async () => {
  const Other = () => null
  const entries = [...presentations, { slug: 'second', title: 'Second presentation', load: async () => ({ default: Other }) }]
  render(<Landing presentations={entries} />)
  for (const entry of entries) {
    const href = screen.getByRole('link', { name: entry.title }).getAttribute('href')
    expect(href).toBe(`/${entry.slug}`)
    expect(findPresentation(href!, entries)?.load).toBe(entry.load)
    expect(findPresentation(`${href}/`, entries)).toBe(entry)
  }
  expect(findPresentation('/', entries)).toBeUndefined()
  expect(findPresentation('/missing', entries)).toBeUndefined()
  await expect(findPresentation('/second', entries)?.load()).resolves.toEqual({ default: Other })
})

it('registers the reference and matches the normative outline and verification metadata', async () => {
  const entry = findPresentation('/how-to-make-a-presentation', presentations)
  expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
  expect(typeof (await entry!.load()).default).toBe('function')
  const spec = readFileSync(resolve('openspec/changes/create-and-scene/specs/presentation-verification/spec.md'), 'utf8')
  const expected = spec.split('\n').flatMap(line => {
    const match = line.match(/^\| (\d+) \| (.+?) \| "(.+?)" \| (.+?) \|/)
    return match ? [match.slice(2)] : []
  })
  expect(expected).toHaveLength(9)
  expect(outline.map(({ era, title, caption }) => [era, title, caption])).toEqual(expected)
  expect(new Set(outline.map(({ id }) => id)).size).toBe(9)
  const target = JSON.parse(readFileSync(resolve('scripts/verification-target.json'), 'utf8'))
  expect(target).toEqual({ slug: entry!.slug, steps: expected })
})
