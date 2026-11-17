import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { metadata } from '../src/presentations/how-to-make-a-presentation/metadata'
import { entities, entityId, visibleEntities } from '../src/presentations/how-to-make-a-presentation/entities'
import { Scene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { presentations, findPresentation } from '../src/presentations'
import { Landing } from '../src/Landing'
afterEach(cleanup)
it('I-32 explicit registry resolves coexisting routes and fallback', async () => {
  const registry = [...presentations, { slug: 'another', title: 'Another', load: async () => ({ default: () => null }) }]
  expect(findPresentation('/another', registry)?.title).toBe('Another'); expect(findPresentation('/how-to-make-a-presentation/', registry)).toBe(presentations[0]); expect(findPresentation('/missing', registry)).toBeUndefined(); expect((await presentations[0].load()).default).toBeTypeOf('function'); render(<Landing />); expect(screen.getByRole('link').getAttribute('href')).toBe('/how-to-make-a-presentation')
})
it('I-41 reference metadata equals normative nine-step table', () => {
  const spec = readFileSync('openspec/changes/create-and-scene/specs/presentation-verification/spec.md', 'utf8')
  const expected = spec.split('\n').filter(line => /^\| \d+ \|/.test(line)).map(line => { const c = line.split('|').map(x => x.trim()); return { id: `step-${c[1]}`, era: c[2], title: c[3].slice(1, -1), caption: c[4] } })
  expect(metadata).toEqual(expected); expect(STEPS).toHaveLength(9); expect(presentations[0].title).toBe('How to Use This Skill to Make a Presentation')
})
it('I-42 opening conversation and first card expose normative content', () => { render(<Scene payload={{ beat: 3 }} />); for (const id of ['you', 'prompt', 'skill', 'question', 'conversation', 'tray', 'card-1']) expect(document.querySelector(`[data-entity="${id}"]`)).toBeTruthy(); expect(screen.getByText('title · caption · visual')).toBeTruthy(); expect(document.querySelector('[data-entity="card-1"]')?.textContent).not.toContain('morphs') })
it('I-43 gathering accumulates depth ghost and shared-kit socket without tray frame', () => { render(<Scene payload={{ beat: 6 }} />); for (const id of ['card-2','card-3','ghost','depth','kit','link-1','link-2']) expect(document.querySelector(`[data-entity="${id}"]`)).toBeTruthy(); expect(document.querySelector('[data-entity="tray"]')?.getAttribute('data-presentation-node')).toBe('box'); const kit=entities.find(e=>e.id==='kit')!, tray=entities.find(e=>e.id==='tray')!; expect(kit.y).toBe(tray.y+tray.h); expect(screen.getByText('partial ↔ full')).toBeTruthy() })
it('I-44 verify modify and reveal extend existing diagram', () => { render(<Scene payload={{ beat: 9 }} />); expect(screen.getByText('✓ verify')).toBeTruthy(); expect(screen.getByText('build + render')).toBeTruthy(); expect(screen.getByText('↙ modify in place')).toBeTruthy(); expect(screen.getByText('edited ↙')).toBeTruthy(); expect(document.querySelector('[data-entity="reveal"]')?.getAttribute('data-presentation-node')).toBe('frame'); const verify=entities.find(e=>e.id==='verify')!, card=entities.find(e=>e.id==='card-3')!; expect(verify.y).toBe(card.y); expect(verify.x).toBeGreaterThan(card.x+card.w) })
it('I-45 all nine states accumulate unchanged entity coordinates and identities', () => {
  let previous: ReturnType<typeof visibleEntities> = []
  for (let beat=1;beat<=9;beat++) { const current=visibleEntities(beat); for (const entity of previous) expect(current.find(e=>e.id===entity.id)).toBe(entity); previous=current }
  expect(new Set(entities.map(e=>entityId(e.id))).size).toBe(entities.length); expect(new Set(STEPS.map(s=>s.Scene)).size).toBe(1); expect(new Set(STEPS.map(s=>s.groupKey)).size).toBe(1)
})
