import type { ReactNode } from 'react'
import type { Mode, Step } from './types'
import { STAGE_LAYOUT } from './constants'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
import './geometry.css'
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution }: { steps: Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; attribution?: ReactNode }) {
  const nav = usePresentationNav(steps.length, initialMode)
  if (!steps.length) return <p data-presentation-empty="">No presentation steps.</p>
  const geometry = STAGE_LAYOUT[nav.mode]
  return <main data-presentation-root="" data-step-count={steps.length} data-step-index={nav.index} data-mode={nav.mode} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} onTouchCancel={nav.onTouchCancel} style={{ position: 'relative', height: '100dvh', display: 'grid', gridTemplateRows: `${geometry.header}px minmax(0, 1fr) ${geometry.footer}px`, paddingInline: geometry.gutter, boxSizing: 'border-box', touchAction: 'pan-y' }}>
    <Header title={title} marker={`${String(nav.index + 1).padStart(2,'0')} / ${String(steps.length).padStart(2,'0')}`} mode={nav.mode} brand={brand} toggleMode={nav.toggleMode} />
    <Stage step={steps[nav.index]} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} go={nav.go} />}
    <Footer steps={steps} index={nav.index} mode={nav.mode} go={nav.go} next={nav.next} prev={nav.prev} />
    <div style={{ position: 'absolute', bottom: 12, right: 24 }} data-presentation-attribution-slot="">{attribution ?? <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene">made by and-scene</a>}</div>
  </main>
}
