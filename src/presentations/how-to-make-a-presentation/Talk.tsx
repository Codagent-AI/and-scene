import { Presentation, type Step } from '../../presentation-kit'
import { OUTLINE, PRESENTATION_TITLE } from './outline'

// Placeholder scene; replaced by the real accumulating scene.
const steps: Step<number>[] = OUTLINE.map((row, i) => ({
  ...row,
  groupKey: 'scene',
  Scene: () => null,
  payload: i,
}))

export default function Talk() {
  return <Presentation steps={steps} title={PRESENTATION_TITLE} initialMode="browse" />
}
