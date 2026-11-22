import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, go, next, prev }: {
  steps: readonly StepMeta[]; index: number; mode: Mode
  go: (index: number) => void; next: () => void; prev: () => void
}) {
  const step = steps[index]
  return <footer data-presentation-footer="" style={{ position: 'absolute', bottom: 48, left: 32, right: 32 }}>
    <div data-presentation-marker="">{String(index + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</div>
    <h1 data-presentation-title="">{step.title}</h1>
    {mode === 'browse' && <>
      <p data-presentation-caption="">{step.caption}</p>
      <nav data-presentation-navigation="" aria-label="Steps">
        <button data-presentation-prev="" type="button" onClick={prev} disabled={index === 0}>Previous</button>
        <div data-presentation-progress="">{steps.map((item, position) =>
          <button key={item.id} type="button" onClick={() => go(position)}
            aria-label={`Step ${position + 1}: ${item.title}`} aria-current={index === position ? 'step' : undefined}
            data-presentation-progress-entry="" data-active={index === position}>{position + 1}</button>)}</div>
        <button data-presentation-next="" type="button" onClick={next} disabled={index === steps.length - 1}>Next</button>
      </nav>
    </>}
  </footer>
}
