import { describe, expect, it } from 'vitest'
import css from './index.css?raw'

// The landing page renders bare <a> elements. Without an explicit rule they
// inherit the browser default #0000EE, which sits at roughly 2:1 contrast on
// the app's near-black background — effectively illegible.
describe('app shell stylesheet', () => {
  it('gives landing links an explicit colour rather than the browser default', () => {
    expect(css).toMatch(/\[data-presentation-chrome=['"]landing['"]\][^{]*a[^{]*\{[^}]*color:/)
  })

  it('keeps the landing page off the viewport edge', () => {
    expect(css).toMatch(/\[data-presentation-chrome=['"]landing['"]\]\s*\{[^}]*padding:/)
  })
})
