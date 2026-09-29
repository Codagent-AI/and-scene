import { useRef } from 'react'
import { DESIGN_H, DESIGN_W } from './constants.ts'
import { usePresentationNav } from './usePresentationNav.ts'
import { Stage } from './Stage.tsx'
import { Header } from './chrome/Header.tsx'
import { Footer } from './chrome/Footer.tsx'
import { Toc } from './chrome/Toc.tsx'
import type { PresentationProps } from './types.ts'

export function Presentation<T>({ steps, title, initialMode = 'browse', designWidth = DESIGN_W, designHeight = DESIGN_H, renderHeaderBrand, className, style }: PresentationProps<T>) {
  const shellRef = useRef<HTMLElement>(null)
  const nav = usePresentationNav(steps.length, initialMode)
  const active = steps[nav.index]
  if (!active) return null
  return <main
    ref={shellRef}
    className={['presentation', className].filter(Boolean).join(' ')}
    data-presentation=""
    data-presentation-mode={nav.mode}
    onTouchStart={nav.onTouchStart}
    onTouchEnd={nav.onTouchEnd}
    style={{ position: 'relative', width: '100%', height: '100vh', minHeight: 320, overflow: 'hidden', ...style }}
  >
    <Header title={title} step={active} index={nav.index} mode={nav.mode} brand={renderHeaderBrand} onToggle={nav.toggleMode} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} goTo={nav.goTo} />}
    <Stage steps={steps} index={nav.index} mode={nav.mode} width={designWidth} height={designHeight} containerRef={shellRef} />
    <Footer steps={steps} index={nav.index} mode={nav.mode} goTo={nav.goTo} next={nav.next} prev={nav.prev} />
  </main>
}
