import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
import type { Mode, Step } from './types'

export interface PresentationProps<T> {
  steps: readonly Step<T>[]
  title: string
  initialMode?: Mode
  className?: string
  style?: CSSProperties
  brand?: ReactNode
  attribution?: ReactNode
  width?: number
  height?: number
}
export function Presentation<T>({ steps, title, initialMode = 'browse', className, style, brand, attribution, width, height }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const [wide, setWide] = useState(() => window.innerWidth >= 1100)
  useEffect(() => {
    const resize = () => setWide(window.innerWidth >= 1100)
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  if (!steps.length) throw new Error('A presentation requires at least one step')
  return <main data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} className={className} style={{ position: 'relative', width: '100%', height: '100dvh', minHeight: 420, ...style }} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} onTouchCancel={nav.onTouchCancel}>
    <Header step={steps[nav.index]} index={nav.index} title={title} brand={brand} toggle={nav.toggle} mode={nav.mode} />
    {nav.mode === 'browse' && wide && <Toc steps={steps} index={nav.index} jump={nav.jump} />}
    <Stage step={steps[nav.index]} mode={nav.mode} width={width} height={height} />
    <Footer steps={steps} index={nav.index} mode={nav.mode} prev={nav.prev} next={nav.next} jump={nav.jump} />
    {attribution === undefined ? <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene" style={{ position: 'absolute', right: 24, bottom: 16 }}>made by and-scene</a> : attribution}
  </main>
}
