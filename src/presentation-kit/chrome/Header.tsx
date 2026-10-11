import type { ReactNode } from 'react';
import type { StepMeta } from '../types';
export function Header({ step, index, brand }: {
    step: StepMeta;
    index: number;
    brand?: ReactNode;
}) {
    return <header data-presentation-header>{brand != null && <div data-presentation-brand>{brand}</div>}<span data-presentation-marker>{index + 1}</span><h1 data-presentation-title>{step.title}</h1></header>;
}
