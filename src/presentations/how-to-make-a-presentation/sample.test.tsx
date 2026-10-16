import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PRESENTATIONS } from '..'
import Talk from './Talk'
import { STEPS } from './steps'

const config = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../../scripts/verify.config.json'), 'utf8'),
) as { required: { slug: string; steps: { title: string; caption: string }[] }[] }

describe('reference sample', () => {
  const ref = config.required[0]

  it('is registered under its slug', () => {
    expect(PRESENTATIONS.some((p) => p.slug === ref.slug)).toBe(true)
  })

  it('implements the nine normative steps in order, under the outline eras', () => {
    expect(STEPS.map((s) => ({ title: s.title, caption: s.caption }))).toEqual(ref.steps)
    expect(STEPS.map((s) => s.era)).toEqual([
      'the ask', 'the ask', 'the gathering', 'the gathering', 'the gathering',
      'the build', 'the build', 'the loop', 'the reveal',
    ])
  })

  it('shares one evolving scene so continuing entities persist', () => {
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
  })

  it('renders through the kit public API with presentation-owned styling', () => {
    render(<Talk />)
    expect(document.querySelector('[data-presentation-root]')?.getAttribute('data-step-count')).toBe('9')
    const css = readFileSync(path.resolve(__dirname, 'talk.css'), 'utf8')
    expect(css).toContain('data-presentation-active')
    expect(css).toContain('data-presentation-attribution')
  })
})
