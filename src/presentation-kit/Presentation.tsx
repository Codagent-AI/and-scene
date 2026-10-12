import { useEffect, useState, type ReactNode } from 'react'
import { usePresentationNav } from './usePresentationNav'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { Attribution, type AttributionOptions } from './Attribution'
import type { PresentationMode, Step } from './types'
export interface PresentationProps<T> { steps: readonly Step<T>[]; title: string; initialMode?: PresentationMode; attribution?: AttributionOptions; brand?: ReactNode }
export function Presentation<T>({ steps, title, initialMode='present', attribution, brand }: PresentationProps<T>) {
 const nav=usePresentationNav(steps.length,initialMode); const step=steps[nav.stepIndex]!
 const [isWide, setIsWide] = useState(() => window.innerWidth >= 900)
 useEffect(() => { const resize = () => setIsWide(window.innerWidth >= 900); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize) }, [])
 return <main aria-label={title} data-presentation-root data-step-count={steps.length} data-step-index={nav.stepIndex} data-presentation-mode={nav.mode} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} style={{position:'relative',width:'100vw',height:'100vh',overflow:'hidden'}}>
 <Header title={step.title} mode={nav.mode} stepNumber={nav.stepIndex + 1} brand={brand}/><Stage steps={steps} index={nav.stepIndex} mode={nav.mode}/>{nav.mode==='browse'&&isWide&&<Toc steps={steps} index={nav.stepIndex} onJump={nav.jumpTo}/>}<Footer mode={nav.mode} caption={step.caption} index={nav.stepIndex} count={steps.length} onJump={nav.jumpTo} onPrev={nav.prev} onNext={nav.next}/><Attribution options={attribution}/><button type="button" aria-label="Toggle presentation mode" onClick={nav.toggleMode} data-presentation-mode-toggle style={{position:'absolute',right:0,top:0}}>Mode</button></main>
}
