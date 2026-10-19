import type { ReactNode } from 'react'
import type { Mode } from './constants'
import { Stage } from './Stage'
import { Attribution } from './chrome/Attribution'
import { Footer } from './chrome/Footer'
import type { ChromeHooks } from './chrome/forward'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { tocEntries } from './chrome/tocEntries'
import type { Step } from './types'
import { isWide, useViewport } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'

export interface PresentationProps<TPayload> {
  steps: ReadonlyArray<Step<TPayload>>
  title: string
  initialMode?: Mode
  /** Host-provided branding for the top-left header slot. */
  brand?: ReactNode
  /** Set to false to remove the default bottom-right attribution. */
  attribution?: boolean
  /** Class, style and data-* hooks forwarded to each chrome part's root element. */
  chrome?: {
    header?: ChromeHooks
    footer?: ChromeHooks
    toc?: ChromeHooks
    attribution?: ChromeHooks
  }
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
  brand,
  attribution = true,
  chrome = {},
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const viewport = useViewport()
  const step = steps[nav.index]
  if (!step) return null
  const showToc = nav.mode === 'browse' && isWide(viewport)
  return (
    <div
      data-presentation-root=""
      data-presentation-title-text={title}
      data-presentation-mode={nav.mode}
      data-presentation-step-count={steps.length}
      data-presentation-step-index={nav.index}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}
    >
      <Header {...chrome.header} brand={brand} era={step.era} />
      {showToc ? <Toc {...chrome.toc} entries={tocEntries(steps)} activeIndex={nav.index} onJump={nav.goTo} /> : null}
      <Stage step={step} stepIndex={nav.index} mode={nav.mode} />
      <Footer
        {...chrome.footer}
        mode={nav.mode}
        index={nav.index}
        count={steps.length}
        title={step.title}
        caption={step.caption}
        stepTitles={steps.map((s) => s.title)}
        onJump={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
        onToggleMode={nav.toggleMode}
      />
      {attribution ? <Attribution {...chrome.attribution} /> : null}
    </div>
  )
}
