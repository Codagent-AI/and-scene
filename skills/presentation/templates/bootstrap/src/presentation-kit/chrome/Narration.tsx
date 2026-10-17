import { formatMarker } from '../sections.ts'
import type { Mode, Step } from '../types.ts'

interface NarrationProps {
  step: Pick<Step<unknown>, 'title' | 'caption'>
  index: number
  mode: Mode
}

/** Marker + one-line title in both modes; the caption only in browse mode. */
export function Narration({ step, index, mode }: NarrationProps) {
  return (
    <section data-presentation-narration="" data-presentation-chrome="" style={{ flex: '0 0 auto' }}>
      <span data-presentation-marker="">{formatMarker(index)}</span>
      <h1 data-presentation-title="">{step.title}</h1>
      {mode === 'browse' ? <p data-presentation-caption="">{step.caption}</p> : null}
    </section>
  )
}
