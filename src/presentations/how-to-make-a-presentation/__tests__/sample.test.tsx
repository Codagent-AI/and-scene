// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { presentations } from '../../index.ts'
import { E, entityIdsAt } from '../entities.ts'
import { STEPS } from '../steps/index.ts'
import Talk from '../Talk.tsx'

const outline = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, '../../../../scripts/reference-outline.json'), 'utf8'),
)

describe('reference sample', () => {
  it('is registered under its slug and loads lazily', async () => {
    const entry = presentations.find((p) => p.slug === outline.slug)
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
    expect((await entry!.load()).default).toBe(Talk)
  })

  it('implements the nine normative steps in order', () => {
    expect(STEPS).toHaveLength(9)
    expect(STEPS.map(({ era, title, caption }) => ({ era, title, caption }))).toEqual(outline.steps)
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
  })

  it('is one persistent scene: every step shares the same group and scene component', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
  })

  it('accumulates entities without removing or renaming any between steps', () => {
    for (let stage = 1; stage < 9; stage++) {
      const before = new Set(entityIdsAt(stage))
      const after = new Set(entityIdsAt(stage + 1))
      for (const id of before) expect(after.has(id), `${id} survives step ${stage + 1}`).toBe(true)
      expect(after.size).toBeGreaterThan(before.size)
    }
    expect(entityIdsAt(9)).toContain(E.reveal)
    expect(new Set(entityIdsAt(9)).size).toBe(entityIdsAt(9).length)
  })

  it('renders the scene entities matching each stage while stepping through the deck', () => {
    const { container } = render(<Talk />)
    for (let stage = 1; stage <= 9; stage++) {
      const present = [...container.querySelectorAll('[data-presentation-entity]')].map((e) =>
        e.getAttribute('data-presentation-entity'),
      )
      for (const id of entityIdsAt(stage)) expect(present, `stage ${stage}`).toContain(id)
      if (stage < 9) act(() => void fireEvent.keyDown(window, { key: 'ArrowRight' }))
    }
  })

  it('opens in browse mode so captions are visible', () => {
    const { container } = render(<Talk />)
    expect(container.querySelector('[data-presentation-mode="browse"]')).not.toBeNull()
  })
})
