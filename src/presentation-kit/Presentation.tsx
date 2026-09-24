import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import type { CSSProperties } from 'react'
import type { PresentationProps } from './types'

const rootStyle: CSSProperties = { minHeight: '100vh', display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr) auto', position: 'relative' }

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', className = '', showAttribution = true }: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  if (steps.length === 0) return <main className={`presentation ${className}`} data-presentation style={rootStyle} />
  const activeStep = steps[nav.index]
  const layoutGroupId = `presentation-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return <main className={`presentation ${className}`} data-presentation data-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} style={{ ...rootStyle, overflow: 'hidden' }}>
    <Header title={title} index={nav.index} mode={nav.mode} onToggleMode={nav.toggleMode} />
    <Stage step={activeStep} index={nav.index} mode={nav.mode} touchHandlers={nav.touchHandlers} showAttribution={showAttribution} layoutGroupId={layoutGroupId} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} onSelect={nav.goTo} />}
    <Footer step={activeStep} index={nav.index} steps={steps} mode={nav.mode} onSelect={nav.goTo} onNext={nav.next} onPrev={nav.prev} />
  </main>
}
