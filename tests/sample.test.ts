import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { entities, layoutId } from '../src/presentations/how-to-make-a-presentation/entities'
import type { EntityId } from '../src/presentations/how-to-make-a-presentation/entities'
import { steps } from '../src/presentations/how-to-make-a-presentation/steps'
import { DESIGN_H, DESIGN_W } from '../src/presentation-kit'
import { fitScale } from '../src/presentation-kit/useFitScale'

const expectedBeats: EntityId[][] = [
  ['you', 'prompt'],
  ['skill', 'conversation', 'question'],
  ['tray', 'first'],
  ['firstLink', 'morph', 'second', 'secondLink', 'third'],
  ['ghostLink', 'ghost', 'depth'],
  ['kit'],
  ['checkLink', 'verify'],
  ['modify', 'modifyLabel', 'edited'],
  ['reveal', 'revealLabel'],
]

describe('reference scene continuity', () => {
  it('accumulates each beat with stable IDs and fixed placements in one scene group', () => {
    expect(steps).toHaveLength(expectedBeats.length)
    const placements = new Map<string, (typeof entities)[EntityId]>()

    steps.forEach((step, index) => {
      expect(step.groupKey).toBe(steps[0].groupKey)
      expect(step.Scene).toBe(steps[0].Scene)
      expect(step.payload.entityIds).toEqual(expectedBeats.slice(0, index + 1).flat())

      for (const id of step.payload.entityIds) {
        const placement = entities[id]
        const identity = layoutId(id)
        if (placements.has(identity)) expect(placement).toBe(placements.get(identity))
        placements.set(identity, placement)
      }
    })

    expect(placements.size).toBe(Object.keys(entities).length)
  })

  it('contains the diagram and aligns its kit and verification nodes', () => {
    for (const { left, top, width, height } of Object.values(entities)) {
      expect(left).toBeGreaterThanOrEqual(0)
      expect(top).toBeGreaterThanOrEqual(0)
      expect(left + width).toBeLessThanOrEqual(880)
      expect(top + height).toBeLessThanOrEqual(380)
    }

    expect(entities.kit.top).toBeLessThanOrEqual(entities.tray.top + entities.tray.height)
    expect(entities.kit.left + entities.kit.width / 2).toBe(entities.tray.left + entities.tray.width / 2)
    expect(entities.verify.top).toBe(entities.first.top)
    expect(entities.verify.height).toBe(entities.first.height)
    expect(entities.verify.left).toBeGreaterThan(entities.ghost.left + entities.ghost.width)
    expect(entities.reveal.left).toBeLessThan(entities.tray.left)
    expect(entities.reveal.left + entities.reveal.width).toBeGreaterThan(entities.tray.left + entities.tray.width)
  })

  it('keeps every accumulated diagram label at least 13px after narrow fit scaling', () => {
    const stepIndex = steps.length - 1
    const { Scene, payload } = steps[stepIndex]
    const scene = renderToStaticMarkup(createElement(Scene, { payload, stepIndex }))
    const stylesheet = readFileSync(
      new URL('../src/presentations/how-to-make-a-presentation/presentation.css', import.meta.url),
      'utf8',
    )
    const { window } = new JSDOM(`<style>${stylesheet}</style>${scene}`)
    // The 390px viewport leaves approximately 379px after the sample's stage margins.
    const scale = fitScale(379, DESIGN_H, DESIGN_W, DESIGN_H)
    const labels: string[] = []

    try {
      const root = window.document.querySelector('.sample-scene')!
      const text = window.document.createTreeWalker(root, window.NodeFilter.SHOW_TEXT)
      for (let node = text.nextNode(); node; node = text.nextNode()) {
        const label = node.textContent?.trim()
        if (!label) continue
        labels.push(label)
        const fontSize = Number.parseFloat(window.getComputedStyle(node.parentElement!).fontSize)
        expect(fontSize * scale, label).toBeGreaterThanOrEqual(13)
      }
      expect(labels).toEqual(expect.arrayContaining(['A topic', 'Caption', 'Build +', 'Render', 'This scene']))
    } finally {
      window.close()
    }
  })
})
