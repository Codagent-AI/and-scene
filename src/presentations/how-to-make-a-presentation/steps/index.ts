import { REFERENCE_OUTLINE } from '../../../../scripts/reference-outline.mjs'
import type { Step } from '../../../presentation-kit'
import { SampleScene, type SamplePayload } from './Scene'

/** The nine beats; titles and captions come from the normative outline. */
export const STEPS: Step<SamplePayload>[] = REFERENCE_OUTLINE.map((o, i) => ({
  id: `step-${i + 1}`,
  era: o.era,
  title: o.title,
  caption: o.caption,
  groupKey: 'how-to-make-a-presentation',
  Scene: SampleScene,
  payload: { n: i + 1 },
}))
