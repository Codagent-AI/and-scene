import type { Step } from '../../../presentation-kit'
import { Diagram } from './Diagram'
import type { DiagramState } from './Diagram'

export const steps: readonly Step<DiagramState>[] = [
  {
    id: 'start', era: 'Introduction', title: 'Start with one idea',
    caption: 'Introduce the entity that continues through the scene.',
    groupKey: 'diagram', Scene: Diagram, payload: { expanded: false },
  },
  {
    id: 'expand', era: 'Development', title: 'Extend the idea',
    caption: 'Move the original entity and introduce the next part.',
    groupKey: 'diagram', Scene: Diagram, payload: { expanded: true },
  },
]
