import type { HTMLAttributes } from 'react'
import type { StepMeta, Mode } from '../types'
export function Footer({ steps, index, mode, next, prev, jump, ...props }: HTMLAttributes<HTMLElement> & { steps: readonly StepMeta[]; index: number; mode: Mode; next: () => void; prev: () => void; jump: (i: number) => void }) {
 return <footer data-presentation-footer="" {...props}>
  {mode === 'browse' && <><p data-presentation-caption="" style={{ whiteSpace: 'normal' }}>{steps[index].caption}</p><div data-presentation-navigation=""><button data-presentation-prev="" onClick={prev} disabled={index === 0} aria-label="Previous step">←</button><nav aria-label="Steps">{steps.map((s, i) => <button key={s.id} data-presentation-progress="" data-presentation-active={i === index ? 'true' : undefined} aria-current={i === index ? 'step' : undefined} aria-label={`Step ${i + 1}: ${s.title}`} onClick={() => jump(i)}>{i + 1}</button>)}</nav><button data-presentation-next="" onClick={next} disabled={index === steps.length - 1} aria-label="Next step">→</button></div></>}
 </footer>
}
