import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { WIDE_VIEWPORT } from './constants.ts'
import { Footer } from './chrome/Footer.tsx'
import type { AttributionOptions } from './chrome/Footer.tsx'
import { Header } from './chrome/Header.tsx'
import { Toc } from './chrome/Toc.tsx'
import { Stage } from './Stage.tsx'
import { usePresentationNav } from './usePresentationNav.ts'
import type { Mode, Step } from './types.ts'

export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  designW?: number
  designH?: number
  attribution?: AttributionOptions | false
  /** Host branding for the top-left header slot. Empty by default. */
  brand?: ReactNode
  /** Class for the root element so presentation-owned CSS can scope itself. */
  className?: string
}

function useIsWide() {
  const [wide, setWide] = useState(() => window.innerWidth >= WIDE_VIEWPORT)
  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= WIDE_VIEWPORT)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return wide
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  designW,
  designH,
  attribution,
  brand,
  className,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useIsWide()
  const step = steps[nav.index]

  return (
    <div
      className={className}
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{ display: 'flex', flexDirection: 'column', position: 'fixed', inset: 0 }}
    >
      <Header step={step} index={nav.index} mode={nav.mode} title={title} brand={brand} />
      <div style={{ display: 'flex', flex: '1 1 0', minHeight: 0 }}>
        {nav.mode === 'browse' && wide && <Toc steps={steps} index={nav.index} onGoTo={nav.goTo} />}
        <Stage steps={steps} index={nav.index} mode={nav.mode} designW={designW} designH={designH} />
      </div>
      <Footer
        steps={steps}
        index={nav.index}
        mode={nav.mode}
        onGoTo={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
        attribution={attribution}
      />
    </div>
  )
}
