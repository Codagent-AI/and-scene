import type { Step, PresentationMode } from '../types.ts'
interface FooterProps<T> { steps: readonly Step<T>[]; index: number; mode: PresentationMode; goTo: (index: number) => void; next: () => void; prev: () => void }
export function Footer<T>({ steps, index, mode, goTo, next, prev }: FooterProps<T>) {
  const active = steps[index]
  return <footer className="presentation-footer" data-presentation-footer="" data-step-count={steps.length} data-step-index={index} style={{ position: 'absolute', zIndex: 1, inset: 'auto 0 0' }}>
    {mode === 'browse' && <>
      <p className="presentation-caption" data-presentation-caption="">{active?.caption}</p>
      <nav className="presentation-progress" aria-label="Presentation steps" data-presentation-progress="">
        {steps.map((step, position) => <button key={step.id} type="button" className="presentation-progress-item" data-presentation-progress-item="" data-presentation-active={position === index ? 'true' : 'false'} aria-label={`Go to step ${position + 1}: ${step.title}`} aria-current={position === index ? 'step' : undefined} onClick={() => goTo(position)} />)}
      </nav>
      <div className="presentation-step-controls">
        <button type="button" data-presentation-prev="" onClick={prev} disabled={index === 0} aria-label="Previous step">Previous</button>
        <button type="button" data-presentation-next="" onClick={next} disabled={index === steps.length - 1} aria-label="Next step">Next</button>
      </div>
    </>}
    <a className="presentation-attribution" data-presentation-attribution="" href="https://github.com/and-scene" target="_blank" rel="noreferrer">made by and-scene</a>
  </footer>
}
