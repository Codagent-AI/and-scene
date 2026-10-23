import type { Step } from '../../../src/presentation-kit'

export interface P {
  n: number
}

export function makeSteps(
  eras: readonly string[],
  Scene: Step<P>['Scene'] = () => null,
  group?: string,
): Step<P>[] {
  return eras.map((era, i) => ({
    id: `s${i}`,
    era,
    title: `Title ${i}`,
    caption: `Caption ${i}`,
    Scene,
    payload: { n: i },
    groupKey: group,
  }))
}

export const key = (k: string, target: EventTarget = document.body) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))

export function swipe(dx: number, dy = 0, target: EventTarget = document.body) {
  const touch = (x: number, y: number) =>
    ({ clientX: x, clientY: y, identifier: 0, target }) as unknown as Touch
  const ev = (type: string, x: number, y: number) => {
    const e = new Event(type, { bubbles: true }) as Event & { touches: Touch[]; changedTouches: Touch[] }
    e.touches = type === 'touchend' ? [] : [touch(x, y)]
    e.changedTouches = [touch(x, y)]
    target.dispatchEvent(e)
  }
  ev('touchstart', 200, 200)
  ev('touchend', 200 + dx, 200 + dy)
}

export function setViewport(width: number, height = 800) {
  Object.assign(window, { innerWidth: width, innerHeight: height })
  window.dispatchEvent(new Event('resize'))
}
