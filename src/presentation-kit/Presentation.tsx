import { useEffect, useState } from 'react'
import { Stage } from './Stage'
import { STAGE_LAYOUT } from './constants'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'
import { validateSteps } from './types'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution = { label: 'made by and-scene', href: 'https://github.com/Codagent-AI/and-scene' } }: PresentationProps<T>) {
  validateSteps(steps)
  const nav = usePresentationNav(steps.length, initialMode)
  const [wide, setWide] = useState(() => window.innerWidth >= 1100)
  useEffect(() => {
    const resize = () => setWide(window.innerWidth >= 1100)
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  const step = steps[nav.index]
  const geometry = STAGE_LAYOUT[nav.mode]
  return <main aria-label={title} data-presentation-root="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} data-step-id={step.id} data-step-era={step.era} data-step-title={step.title} data-step-caption={step.caption} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} onTouchCancel={nav.onTouchCancel} style={{ position: 'relative', height: '100dvh', display: 'grid', gridTemplateRows: `${geometry.header}px minmax(0, 1fr) ${geometry.footer}px`, overflow: 'hidden' }}>
    <div><Header step={step} index={nav.index} count={steps.length} mode={nav.mode} brand={brand} toggle={nav.toggle} />
      {nav.mode === 'browse' && <h1 data-presentation-title="">{step.title}</h1>}
    </div>
    <div style={{ display: 'grid', minHeight: 0, gridTemplateColumns: nav.mode === 'browse' && wide ? '140px minmax(0, 1fr)' : 'minmax(0, 1fr)' }}>{nav.mode === 'browse' && wide && <div aria-hidden="true" />}<Stage step={step} /></div>
    <Footer {...nav} step={step} steps={steps} />
    {nav.mode === 'browse' && wide && <div style={{ position: 'absolute', left: 0, top: geometry.header }}><Toc steps={steps} index={nav.index} jump={nav.jump} /></div>}
    {attribution !== false && <a data-presentation-attribution="" style={{ position: 'absolute', right: 0, bottom: 0 }} href={attribution.href}>{attribution.label}</a>}
  </main>
}
