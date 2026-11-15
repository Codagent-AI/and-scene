import type { Mode, StepMeta } from '../types'
export function Footer({ steps, index, mode, go, next, prev, compact = false }: { compact?: boolean; steps: readonly StepMeta[]; index: number; mode: Mode; go: (index: number) => void; next: () => void; prev: () => void }) {
  return <footer data-presentation-footer="" style={compact ? { position: 'relative', margin: '0 24px 48px' } : { position: 'absolute', bottom: 48, left: 24, right: 24 }}>
    {mode === 'present' ? <h1 data-presentation-title="">{steps[index].title}</h1> : <><p data-presentation-caption="">{steps[index].caption}</p><nav aria-label="Step navigation" data-presentation-navigation=""><button onClick={prev} disabled={index === 0}>Previous</button><div data-presentation-progress="">{steps.map((s, i) => <button key={s.id} aria-label={`Step ${i + 1}: ${s.title}`} aria-current={i === index ? 'step' : undefined} data-presentation-active={i === index ? 'true' : 'false'} onClick={() => go(i)}>{i + 1}</button>)}</div><button onClick={next} disabled={index === steps.length - 1}>Next</button></nav></>}
  </footer>
}
