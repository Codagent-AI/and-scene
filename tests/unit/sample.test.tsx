import { readFileSync, existsSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Landing } from '../../src/Landing.tsx'
import { presentations } from '../../src/presentations/index.ts'
import { SampleScene } from '../../src/presentations/how-to-make-a-presentation/Scene.tsx'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps.ts'
import { lazyPresentation, resolveRoute } from '../../src/router.ts'
import { Router } from '../../src/Router.tsx'

const config = JSON.parse(readFileSync('verify.config.json', 'utf8')) as {
  reference: { slug: string; steps: { title: string; caption: string }[] }
}
const SPEC = 'openspec/changes/create-and-scene/specs/presentation-verification/spec.md'

function specTable() {
  const rows = readFileSync(SPEC, 'utf8').split('\n').filter((l) => /^\| [1-9] \|/.test(l))
  return rows.map((row) => {
    const cells = row.split('|').map((c) => c.trim())
    return { era: cells[2], title: cells[3].replace(/^"|"$/g, ''), caption: cells[4] }
  })
}

describe('reference sample', () => {
  it('is registered with the canonical slug and title', () => {
    const entry = presentations.find((p) => p.slug === config.reference.slug)
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
  })

  it('has nine ordered steps matching the verification outline exactly', () => {
    expect(STEPS.map(({ title, caption }) => ({ title, caption }))).toEqual(config.reference.steps)
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
    expect(STEPS.map((s) => s.era)).toEqual([
      'the ask', 'the ask', 'the gathering', 'the gathering', 'the gathering',
      'the build', 'the build', 'the loop', 'the reveal',
    ])
  })

  it.runIf(existsSync(SPEC))('matches the normative table in the approved spec', () => {
    const table = specTable()
    expect(table).toHaveLength(9)
    expect(STEPS.map(({ era, title, caption }) => ({ era, title, caption }))).toEqual(table)
  })

  it('keeps all steps in one persistent scene group', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
    expect(STEPS.map((s) => s.payload.beat)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('accumulates entities without rearranging them', () => {
    const seen = new Map<string, string>()
    let previous = new Set<string>()
    for (const step of STEPS) {
      const { container, unmount } = render(<SampleScene payload={step.payload} step={step} index={0} />)
      const nodes = [...container.querySelectorAll<HTMLElement>('[data-presentation-node]')]
      const ids = new Set(nodes.map((n) => n.getAttribute('data-presentation-id')!))
      for (const id of previous) expect(ids.has(id), `${id} kept at beat ${step.payload.beat}`).toBe(true)
      for (const node of nodes) {
        const id = node.getAttribute('data-presentation-id')!
        const geometry = `${node.style.left},${node.style.top},${node.style.width},${node.style.height}`
        if (seen.has(id)) expect(geometry, `${id} stays put`).toBe(seen.get(id))
        seen.set(id, geometry)
      }
      expect(ids.size).toBeGreaterThanOrEqual(previous.size)
      previous = ids
      unmount()
    }
    expect([...previous].some((id) => id.includes('frame'))).toBe(true)
  })

  it('introduces the scene entities beat by beat', () => {
    const kinds = (beat: number) => {
      const step = STEPS[beat - 1]
      const { container, unmount } = render(<SampleScene payload={step.payload} step={step} index={0} />)
      const found = new Set([...container.querySelectorAll('[data-presentation-node]')].map((n) => n.getAttribute('data-presentation-node')))
      unmount()
      return found
    }
    expect(kinds(1)).toEqual(new Set(['you', 'prompt']))
    expect(kinds(2)).toContain('skill')
    expect(kinds(2)).toContain('arrow')
    expect(kinds(2)).toContain('question')
    expect(kinds(3)).toContain('tray')
    expect(kinds(3)).toContain('step-card')
    expect(kinds(5)).toContain('ghost-card')
    expect(kinds(5)).toContain('depth-control')
    expect(kinds(6)).toContain('scene-kit')
    expect(kinds(7)).toContain('verify')
    expect(kinds(7)).toContain('pass')
    expect(kinds(8)).toContain('edited-flag')
    expect(kinds(9)).toContain('frame')
    expect(kinds(2)).not.toContain('tray')
    expect(kinds(8)).not.toContain('frame')
  })
})

describe('routing and registry', () => {
  it('resolves root, slugs, trailing slashes and unknown paths', () => {
    expect(resolveRoute('/').kind).toBe('landing')
    expect(resolveRoute('/nope').kind).toBe('landing')
    const route = resolveRoute(`/${config.reference.slug}/`)
    expect(route.kind).toBe('presentation')
    const direct = resolveRoute(`/${config.reference.slug}`)
    if (route.kind === 'presentation' && direct.kind === 'presentation') {
      expect(route.entry.slug).toBe(config.reference.slug)
      expect(direct.Component).toBe(route.Component)
    }
  })

  it('keeps registry slugs unique and lazy', () => {
    expect(new Set(presentations.map((p) => p.slug)).size).toBe(presentations.length)
    for (const entry of presentations) {
      expect(typeof entry.load).toBe('function')
      expect(lazyPresentation(entry)).toBe(lazyPresentation(entry))
    }
  })

  it('lists every registered presentation on Landing', () => {
    render(<Landing />)
    for (const entry of presentations) {
      const link = screen.getByRole('link', { name: entry.title }) as HTMLAnchorElement
      expect(link.getAttribute('href')).toBe(`/${entry.slug}`)
    }
  })

  it('renders Landing for unknown paths and lazily loads a matched presentation', async () => {
    const unknown = render(<Router pathname="/missing" />)
    expect(unknown.container.querySelector('[data-presentation-link]')).not.toBeNull()
    unknown.unmount()
    const known = render(<Router pathname={`/${config.reference.slug}`} />)
    expect(await known.findByText('You have a topic')).toBeTruthy()
  })
})
