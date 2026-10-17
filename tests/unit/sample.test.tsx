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

  describe('scene beats', () => {
    // Render each beat once and share the snapshot between the checks below.
    const beats = STEPS.map((step) => {
      const { container, unmount } = render(<SampleScene payload={step.payload} step={step} index={0} />)
      const nodes = [...container.querySelectorAll<HTMLElement>('[data-presentation-node]')].map((node) => ({
        id: node.getAttribute('data-presentation-id')!,
        kind: node.getAttribute('data-presentation-node')!,
        geometry: `${node.style.left},${node.style.top},${node.style.width},${node.style.height}`,
      }))
      unmount()
      return nodes
    })
    const kinds = (beat: number) => new Set(beats[beat - 1].map((n) => n.kind))

    it('accumulates entities without rearranging them', () => {
      const seen = new Map<string, string>()
      let previous = new Set<string>()
      beats.forEach((nodes, i) => {
        const ids = new Set(nodes.map((n) => n.id))
        for (const id of previous) expect(ids.has(id), `${id} kept at beat ${i + 1}`).toBe(true)
        for (const { id, geometry } of nodes) {
          if (seen.has(id)) expect(geometry, `${id} stays put`).toBe(seen.get(id))
          seen.set(id, geometry)
        }
        previous = ids
      })
      expect([...previous].some((id) => id.includes('frame'))).toBe(true)
    })

    it('introduces the scene entities beat by beat', () => {
      expect(kinds(1)).toEqual(new Set(['you', 'prompt']))
      for (const [beat, expected] of [
        [2, ['skill', 'arrow', 'question']],
        [3, ['tray', 'step-card']],
        [5, ['ghost-card', 'depth-control']],
        [6, ['scene-kit']],
        [7, ['verify', 'pass']],
        [8, ['edited-flag']],
        [9, ['frame']],
      ] as const) {
        for (const kind of expected) expect(kinds(beat), `beat ${beat} has ${kind}`).toContain(kind)
      }
      expect(kinds(2)).not.toContain('tray')
      expect(kinds(8)).not.toContain('frame')
    })
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
    expect((await known.findAllByText('You have a topic', {}, { timeout: 8000 })).length).toBeGreaterThan(0)
  })
})
