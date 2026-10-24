import type { Step } from '../../src/presentation-kit'

export function makeSteps(n = 5): Step[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s${i + 1}`,
    era: i < 2 ? 'first era' : 'second era',
    title: `Title ${i + 1}`,
    caption: `Caption ${i + 1}`,
    Scene: () => <div data-testid="scene">{`scene ${i + 1}`}</div>,
    payload: undefined,
  }))
}

export function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
  window.dispatchEvent(new Event('resize'))
}
