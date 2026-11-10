import type { StepMeta } from '../types'
export function Footer({ steps, index, browse, jump, prev, next }: { steps: readonly StepMeta[]; index: number; browse: boolean; jump: (i: number) => void; prev: () => void; next: () => void }) {
  return <footer data-presentation-footer="" style={{ position: 'absolute', bottom: 40, left: 0, right: 0 }}>
    <h1 data-presentation-title="" style={browse ? undefined : { whiteSpace: 'nowrap' }}>{steps[index].title}</h1>
    {browse && <><p data-presentation-caption="">{steps[index].caption}</p>
      <nav data-presentation-navigation="" aria-label="Steps"><button onClick={prev} disabled={index === 0} aria-label="Previous step">←</button>
        <div data-presentation-progress="">{steps.map((s, i) => <button key={s.id} onClick={() => jump(i)} aria-label={`Step ${i + 1}: ${s.title}`} aria-current={index === i ? 'step' : undefined} data-presentation-active={index === i ? 'true' : 'false'}>{i + 1}</button>)}</div>
        <button onClick={next} disabled={index === steps.length - 1} aria-label="Next step">→</button>
      </nav></>}
  </footer>
}
