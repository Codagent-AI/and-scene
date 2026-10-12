import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, fitScale } from './useFitScale'
import { clampStep, navigationKeyAction, shouldIgnoreNavigationKey, swipeAction } from './usePresentationNav'
import { findPresentation, resolveRoute } from '../presentations/index'

describe('scene-kit contracts', () => {
  it('uses the fixed design canvas and uniformly fits both axes', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(fitScale(440, 380)).toBe(0.5)
    expect(fitScale(1760, 190)).toBe(0.5)
  })
  it('does not hijack keys from interactive controls or editable content', () => {
    expect(shouldIgnoreNavigationKey({ tagName: 'BUTTON' } as HTMLElement)).toBe(true)
    expect(shouldIgnoreNavigationKey({ tagName: 'DIV', isContentEditable: true } as HTMLElement)).toBe(true)
    expect(shouldIgnoreNavigationKey({ tagName: 'DIV', isContentEditable: false } as HTMLElement)).toBe(false)
  })
  it('clamps navigation at both ends', () => {
    expect(clampStep(-1, 3)).toBe(0)
    expect(clampStep(9, 3)).toBe(2)
  })
  it('maps navigation keys and horizontal swipes', () => {
    expect(['ArrowRight', ' ', 'PageDown'].map((key) => navigationKeyAction(key))).toEqual(['next', 'next', 'next'])
    expect(['ArrowLeft', 'PageUp'].map((key) => navigationKeyAction(key))).toEqual(['prev', 'prev'])
    expect(navigationKeyAction('p')).toBe('toggle')
    expect(navigationKeyAction('ArrowRight', { tagName: 'BUTTON' } as HTMLElement)).toBeNull()
    expect(swipeAction(-80)).toBe('next')
    expect(swipeAction(80)).toBe('prev')
    expect(swipeAction(20)).toBeNull()
  })
  it('resolves the landing, known routes, and unknown routes', () => {
    expect(resolveRoute('/')).toEqual({ kind: 'landing' })
    expect(findPresentation('example')?.title).toBe('Example')
    expect(resolveRoute('/example')).toEqual({ kind: 'presentation', slug: 'example' })
    expect(resolveRoute('/missing')).toEqual({ kind: 'landing' })
  })
})
