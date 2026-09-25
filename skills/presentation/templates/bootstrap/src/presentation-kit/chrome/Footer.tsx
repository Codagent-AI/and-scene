import type { ReactNode } from 'react'
export function Footer({ title, caption, mode, index, count, goTo, prev, next, attribution }: { title: string; caption: string; mode: 'browse' | 'present'; index: number; count: number; goTo: (index: number) => void; prev: () => void; next: () => void; attribution: ReactNode }) {
  return <footer data-presentation-footer data-mode={mode} style={{ position: 'absolute', zIndex: 2, inset: 'auto 32px 20px', display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 24 }}>
    {mode === 'browse' ? <><div data-presentation-copy><strong data-presentation-step-title>{title}</strong><p data-presentation-caption>{caption}</p></div><div data-presentation-navigation>
      <button type="button" aria-label="Previous step" onClick={prev}>Previous</button>
      <nav aria-label="Step progress" data-presentation-progress>{Array.from({ length: count }, (_, step) => <button key={step} type="button" aria-label={`Go to step ${step + 1}`} aria-current={step === index ? 'step' : undefined} data-presentation-progress-item data-presentation-active={step === index ? 'true' : 'false'} onClick={() => goTo(step)} />)}</nav>
      <button type="button" aria-label="Next step" onClick={next}>Next</button>
    </div></> : <strong data-presentation-step-title>{title}</strong>}
    {attribution}
  </footer>
}
