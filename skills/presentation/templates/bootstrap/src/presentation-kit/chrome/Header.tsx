import type { ReactNode } from 'react'
import { STAGE_LAYOUT } from '../constants.ts'
import { stepMarker } from '../steps.ts'
import type { Mode, StepMeta } from '../types.ts'

/** Marker row; host branding is opt-in and the title shows in browse mode only. */
export function Header({ meta, mode, brand }: { meta: StepMeta; mode: Mode; brand?: ReactNode }) {
  return (
    <header
      data-presentation-header=""
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: STAGE_LAYOUT[mode].top }}
    >
      {brand ? <div data-presentation-brand="">{brand}</div> : null}
      <span data-presentation-marker="">{stepMarker(meta.index)}</span>
      <span data-presentation-era="">{meta.era}</span>
      {mode === 'browse' ? <h1 data-presentation-header-title="">{meta.title}</h1> : null}
    </header>
  )
}
