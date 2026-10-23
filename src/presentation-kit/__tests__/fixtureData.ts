import type { Step } from '../types'
import { LabelScene } from './fixtures'

export interface Payload {
  label: string
}

export function makeSteps(extra: Partial<Step<Payload>> = {}): Step<Payload>[] {
  return [
    { id: 'a', era: 'one', title: 'First title', caption: 'First caption', Scene: LabelScene, payload: { label: 'A' }, ...extra },
    { id: 'b', era: 'one', title: 'Second title', caption: 'Second caption', Scene: LabelScene, payload: { label: 'B' }, ...extra },
    { id: 'c', era: 'two', title: 'Third title', caption: 'Third caption', Scene: LabelScene, payload: { label: 'C' }, ...extra },
    { id: 'd', era: 'two', title: 'Fourth title', caption: 'Fourth caption', Scene: LabelScene, payload: { label: 'D' }, ...extra },
  ]
}

export function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
}
