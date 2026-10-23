// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Attribution } from '../chrome/Attribution'
import { Footer } from '../chrome/Footer'
import { Header } from '../chrome/Header'
import { Toc } from '../chrome/Toc'
import { Arrow, SceneLayer } from '../index'
import { makeSteps } from './fixtureData'

describe('forwarding of class, style, and data hooks', () => {
  it('passes class, literal style, and custom data through every chrome part', () => {
    const steps = makeSteps()
    const view = render(
      <>
        <Header mode="browse" deckTitle="Deck" className="h" style={{ marginTop: 3 }} data-custom="header" />
        <Toc steps={steps} activeIndex={0} onJump={() => {}} className="t" style={{ width: 90 }} data-custom="toc" />
        <Footer mode="browse" steps={steps} index={0} last={3} onJump={() => {}} onPrev={() => {}} onNext={() => {}} className="f" data-custom="footer" />
        <Attribution className="a" style={{ fontSize: 14 }} data-custom="attribution" />
      </>,
    )
    const header = view.container.querySelector<HTMLElement>('[data-presentation-header]')!
    expect(header.className).toBe('h')
    expect(header.style.marginTop).toBe('3px')
    expect(header.getAttribute('data-custom')).toBe('header')
    expect(header.style.display).toBe('flex')
    const toc = view.container.querySelector<HTMLElement>('[data-presentation-toc]')!
    expect(toc.className).toBe('t')
    expect(toc.style.width).toBe('90px')
    expect(toc.getAttribute('data-custom')).toBe('toc')
    const footer = view.container.querySelector<HTMLElement>('[data-presentation-footer]')!
    expect(footer.className).toBe('f')
    expect(footer.getAttribute('data-custom')).toBe('footer')
    const attribution = view.container.querySelector<HTMLElement>('[data-presentation-attribution]')!
    expect(attribution.className).toBe('a')
    expect(attribution.style.fontSize).toBe('14px')
    expect(attribution.style.right).toBe('0px')
    expect(attribution.getAttribute('data-custom')).toBe('attribution')
  })

  it('passes class, style, and data through the scene layer and an arrow', () => {
    const view = render(
      <SceneLayer name="layer" className="layer-class" style={{ zIndex: 4 }} data-custom="layer">
        <Arrow from={{ x: 0, y: 0 }} to={{ x: 40, y: 0 }} className="arrow-class" style={{ zIndex: 2 }} data-custom="arrow" />
      </SceneLayer>,
    )
    const layer = view.container.querySelector<HTMLElement>('[data-presentation-layer="layer"]')!
    expect(layer.className).toBe('layer-class')
    expect(layer.style.zIndex).toBe('4')
    expect(layer.getAttribute('data-custom')).toBe('layer')
    expect(layer.style.position).toBe('absolute')
    const arrow = view.container.querySelector<SVGElement>('[data-presentation-arrow]')!
    expect(arrow.getAttribute('class')).toContain('arrow-class')
    expect(arrow.style.zIndex).toBe('2')
    expect(arrow.style.position).toBe('absolute')
    expect(arrow.getAttribute('data-custom')).toBe('arrow')
  })
})
