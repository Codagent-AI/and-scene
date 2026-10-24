import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Attribution, Footer, Header, Toc, ATTRIBUTION_HREF } from '../../src/presentation-kit/index.ts'
import { eraSections } from '../../src/presentation-kit/steps.ts'
import { makeSteps } from './helpers.tsx'

const q = (sel: string) => document.querySelector(sel) as HTMLElement
const common = { className: 'mine', style: { opacity: 0.4 }, 'data-custom': 'yes' }

describe('chrome components forward className, style, and data attributes', () => {
  it('Header', () => {
    render(<Header {...common} marker="1 / 2" mode="browse" onToggleMode={() => {}} height={50} title="T" />)
    const el = q('[data-presentation-header]')
    expect([el.className, el.style.opacity, el.style.height, el.getAttribute('data-custom')]).toEqual(['mine', '0.4', '50px', 'yes'])
  })

  it('Footer in both modes', () => {
    const steps = makeSteps(2)
    for (const mode of ['browse', 'present'] as const) {
      const { unmount } = render(
        <Footer {...common} mode={mode} step={steps[0]} steps={steps} index={0} height={80} onJump={() => {}} onPrev={() => {}} onNext={() => {}} />,
      )
      const el = q('[data-presentation-footer]')
      expect([el.className, el.style.opacity, el.style.height, el.getAttribute('data-custom')], mode).toEqual(['mine', '0.4', '80px', 'yes'])
      unmount()
    }
  })

  it('Toc and Attribution', () => {
    render(<Toc {...common} sections={eraSections(makeSteps(2))} activeSection={0} width={200} onJump={() => {}} />)
    const toc = q('[data-presentation-toc]')
    expect([toc.className, toc.style.width, toc.getAttribute('data-custom')]).toEqual(['mine', '200px', 'yes'])
    render(<Attribution {...common} />)
    const link = q('[data-presentation-attribution]')
    expect([link.className, link.getAttribute('data-custom'), link.getAttribute('href'), link.style.position]).toEqual(['mine', 'yes', ATTRIBUTION_HREF, 'fixed'])
  })

  it('keep their required hooks and wiring when callers pass their own props', () => {
    const onToggle = vi.fn()
    render(<Header {...common} marker="m" mode="present" onToggleMode={onToggle} height={10} />)
    q('[data-presentation-mode-toggle]').click()
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(q('[data-presentation-header]').hasAttribute('data-presentation-header')).toBe(true)
  })
})
