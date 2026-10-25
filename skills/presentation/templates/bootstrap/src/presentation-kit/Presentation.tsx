import { useMemo, type ReactNode } from 'react'
import { WIDE_QUERY } from './constants.ts'
import { Attribution } from './chrome/Attribution.tsx'
import { Footer } from './chrome/Footer.tsx'
import { Header } from './chrome/Header.tsx'
import { Toc } from './chrome/Toc.tsx'
import type { CanvasSize } from './fit.ts'
import { buildOutline } from './outline.ts'
import { Stage } from './Stage.tsx'
import type { AnyStep, Mode } from './types.ts'
import { useMediaQuery } from './useMediaQuery.ts'
import { usePresentationNav } from './usePresentationNav.ts'

export interface PresentationProps {
  steps: readonly AnyStep[]
  title: string
  initialMode?: Mode
  canvas?: CanvasSize
  /** Optional host brand for the top-left header slot. */
  brand?: ReactNode
  /** Set false to omit the default "made by and-scene" attribution. */
  attribution?: boolean
}

export function Presentation({
  steps,
  title,
  initialMode = 'present',
  canvas,
  brand,
  attribution = true,
}: PresentationProps) {
  const { entries, eras } = useMemo(() => buildOutline(steps), [steps])
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useMediaQuery(WIDE_QUERY)
  const entry = entries[nav.index]
  if (!entry) return null

  return (
    <div
      data-presentation-root=""
      data-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      data-step-id={entry.step.id}
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%', overflow: 'hidden' }}
    >
      <Header
        mode={nav.mode}
        title={title}
        number={entry.number}
        count={steps.length}
        era={entry.step.era}
        brand={brand}
      />
      <div data-presentation-body="" style={{ flex: '1 1 0', display: 'flex', minHeight: 0 }}>
        {nav.mode === 'browse' && wide ? (
          <Toc eras={eras} activeEra={entry.eraIndex} onGoto={nav.goto} />
        ) : null}
        <Stage step={entry.step} index={nav.index} mode={nav.mode} canvas={canvas} />
      </div>
      <Footer
        mode={nav.mode}
        entries={entries}
        index={nav.index}
        onPrev={nav.prev}
        onNext={nav.next}
        onGoto={nav.goto}
      />
      {attribution ? <Attribution /> : null}
    </div>
  )
}
