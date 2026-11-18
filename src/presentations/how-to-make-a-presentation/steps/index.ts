import type { Step } from '../../../presentation-kit'
import { OUTLINE } from '../outline'
import { SampleScene, type SamplePayload } from './Scene'
export const STEPS: readonly Step<SamplePayload>[] = OUTLINE.map(([era, title, caption], index) => ({
  id: `beat-${index + 1}`, era, title, caption, groupKey: 'conversation-to-scene', Scene: SampleScene, payload: { beat: index + 1 },
}))
