import type { Step } from '../../../presentation-kit'
import outline from '../outline.json'
import { ReferenceScene } from './Scene'
export const STEPS: Step<number>[] = outline.map((meta, index) => ({
  ...meta,
  groupKey: 'how-to:conversation',
  Scene: ReferenceScene,
  payload: index + 1,
}))
