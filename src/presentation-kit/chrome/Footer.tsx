import type { StepMeta } from '../types'
export function Footer({ steps, index, jump, next, prev }: { steps: readonly StepMeta[]; index: number; jump: (n: number) => void; next: () => void; prev: () => void }) {
 return <footer data-presentation-footer><p data-presentation-caption>{steps[index].caption}</p><nav aria-label="Steps" data-presentation-progress>
 <button onClick={prev} disabled={index === 0} aria-label="Previous step">←</button>
 {steps.map((s, i) => <button key={s.id} aria-label={`Step ${i + 1}: ${s.title}`} aria-current={i === index ? 'step' : undefined} data-presentation-active={i === index} onClick={() => jump(i)}>{i + 1}</button>)}
 <button onClick={next} disabled={index === steps.length - 1} aria-label="Next step">→</button></nav></footer>
}
