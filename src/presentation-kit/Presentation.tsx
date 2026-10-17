import { type ReactNode, useMemo, useSyncExternalStore } from 'react'
import { WIDE_QUERY } from './constants.ts'
import { Attribution } from './chrome/Attribution.tsx'
import { Footer } from './chrome/Footer.tsx'
import { Header } from './chrome/Header.tsx'
import { Narration } from './chrome/Narration.tsx'
import { Toc } from './chrome/Toc.tsx'
import { buildSections } from './sections.ts'
import { Stage } from './Stage.tsx'
import type { AttributionOptions, Mode, Step } from './types.ts'
import { usePresentationNav } from './usePresentationNav.ts'

export interface PresentationProps<TPayload> {
  steps: ReadonlyArray<Step<TPayload>>
  title?: string
  initialMode?: Mode
  className?: string
  /** Optional host branding for the top-left slot; empty by default. */
  brand?: ReactNode
  /** Override the default bottom-right attribution, or pass `false` to omit it. */
  attribution?: AttributionOptions | false
}

function subscribeWide(callback: () => void) {
  const query = window.matchMedia?.(WIDE_QUERY)
  query?.addEventListener('change', callback)
  return () => query?.removeEventListener('change', callback)
}

function useIsWide(): boolean {
  return useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia?.(WIDE_QUERY).matches ?? true,
    () => true,
  )
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  className,
  brand,
  attribution,
}: PresentationProps<TPayload>) {
  const { index, mode, goTo, next, prev } = usePresentationNav(steps.length, initialMode)
  const sections = useMemo(() => buildSections(steps), [steps])
  const wide = useIsWide()
  const step = steps[index]
  if (!step) return null

  const browse = mode === 'browse'
  return (
    <div
      className={className}
      data-presentation-root=""
      data-presentation-mode={mode}
      data-presentation-step-count={steps.length}
      data-presentation-step-index={index}
      data-step-count={steps.length}
      data-step-index={index}
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%', overflow: 'hidden' }}
    >
      <Header title={title} mode={mode} brand={brand} />
      <div style={{ display: 'flex', flex: '1 1 0', minHeight: 0 }}>
        {browse && wide ? <Toc sections={sections} index={index} onGoTo={goTo} /> : null}
        <Stage step={step} index={index} mode={mode} />
      </div>
      <Narration step={step} index={index} mode={mode} />
      {browse ? <Footer steps={steps} index={index} onGoTo={goTo} onPrev={prev} onNext={next} /> : null}
      {attribution === false ? null : <Attribution {...attribution} />}
    </div>
  )
}
