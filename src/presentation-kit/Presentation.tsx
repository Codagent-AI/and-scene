import { useState } from 'react'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

export function Presentation<T>({ steps, title, initialMode = 'browse', designSize, brand }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const [touchX, setTouchX] = useState<number | null>(null)
  const step = steps[nav.index]
  return <main className="presentation" data-presentation="" data-mode={nav.mode} onTouchStart={(event) => setTouchX(event.touches[0]?.clientX ?? null)} onTouchEnd={(event) => { if (touchX === null) return; const dx = (event.changedTouches[0]?.clientX ?? touchX) - touchX; if (Math.abs(dx) > 48) (dx < 0 ? nav.next : nav.prev)(); setTouchX(null) }} style={{ position: 'fixed', inset: 0 }}>
    <Header title={title} mode={nav.mode} brand={brand} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} onGoTo={nav.goTo} />}
    <Stage step={step} mode={nav.mode} width={designSize?.width} height={designSize?.height} />
    <Footer steps={steps} index={nav.index} mode={nav.mode} onPrev={nav.prev} onNext={nav.next} onGoTo={nav.goTo} onToggle={nav.toggleMode} />
  </main>
}
