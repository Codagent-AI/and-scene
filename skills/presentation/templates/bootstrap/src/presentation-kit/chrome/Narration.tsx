import { formatMarker } from '../sections.ts'
import type { Mode, Step } from '../types.ts'

type Narrated = Pick<Step<unknown>, 'title' | 'caption'>

interface NarrationProps {
  steps: ReadonlyArray<Narrated>
  index: number
  mode: Mode
}

/**
 * Marker + one-line title in both modes; the caption only in browse mode.
 * Every step's text is laid out in the same grid cell (inactive ones invisible, styled by the same hooks), so the block is as
 * tall as the tallest step and the stage above it keeps one scale for the whole presentation.
 */
export function Narration({ steps, index, mode }: NarrationProps) {
  const step = steps[index]
  const browse = mode === 'browse'
  return (
    <section data-presentation-narration="" data-presentation-chrome="" style={{ flex: '0 0 auto' }}>
      <span data-presentation-marker="">{formatMarker(index)}</span>
      <div style={{ display: 'grid' }}>
        <div style={{ gridArea: '1 / 1' }}>
          <h1 data-presentation-title="">{step.title}</h1>
          {browse ? <p data-presentation-caption="">{step.caption}</p> : null}
        </div>
        {steps.map((other, i) => (
          <div
            key={i}
            aria-hidden="true"
            data-presentation-sizer=""
            style={{ gridArea: '1 / 1', visibility: 'hidden', pointerEvents: 'none' }}
          >
            <h1 data-presentation-title="">{other.title}</h1>
            {browse ? <p data-presentation-caption="">{other.caption}</p> : null}
          </div>
        ))}
      </div>
    </section>
  )
}
