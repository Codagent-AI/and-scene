import type { PresentationMode } from '../types'
import { DEFAULT_ATTRIBUTION } from '../constants'

interface FooterProps { mode: PresentationMode; title: string; caption: string; index: number; count: number; onGoTo: (index: number) => void; onNext: () => void; onPrev: () => void; attribution?: { label: string; href: string } | false }

export function Footer({ mode, title, caption, index, count, onGoTo, onNext, onPrev, attribution }: FooterProps) {
  const credit = attribution === undefined ? DEFAULT_ATTRIBUTION : attribution
  return <footer data-presentation-footer style={{ position: 'absolute', left: 24, right: 24, bottom: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
    {mode === 'browse' ? <><div data-presentation-navigation style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button type="button" onClick={onPrev} disabled={index === 0} aria-label="Previous step">←</button>
      <nav data-presentation-progress aria-label="Step progress" style={{ display: 'flex', gap: 8 }}>{Array.from({ length: count }, (_, stepIndex) => <button key={stepIndex} type="button" aria-label={`Step ${stepIndex + 1}`} aria-current={stepIndex === index ? 'step' : undefined} data-presentation-active={stepIndex === index ? 'true' : undefined} onClick={() => onGoTo(stepIndex)}>{stepIndex + 1}</button>)}</nav>
      <button type="button" onClick={onNext} disabled={index === count - 1} aria-label="Next step">→</button>
    </div><p>{caption}</p></> : <p>{title}</p>}
    {credit && <a data-presentation-attribution href={credit.href} target="_blank" rel="noreferrer" style={{ position: 'fixed', right: 24, bottom: 14 }}>{credit.label}</a>}
  </footer>
}
