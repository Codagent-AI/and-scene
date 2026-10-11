import type { StepMeta } from '../types';
export function Toc({ steps, index, jump }: {
    steps: readonly StepMeta[];
    index: number;
    jump: (index: number) => void;
}) {
    const eras = [...new Set(steps.map(step => step.era))];
    return <nav data-presentation-toc aria-label="Sections">{eras.map(era => <button key={era} data-presentation-toc-item data-presentation-active={steps[index].era === era ? 'true' : undefined} aria-current={steps[index].era === era ? 'step' : undefined} onClick={() => jump(steps.findIndex(step => step.era === era))}>{era}</button>)}</nav>;
}
