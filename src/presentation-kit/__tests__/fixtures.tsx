/* eslint-disable react-refresh/only-export-components */
import { useId } from 'react'
import type { AnyStep, SceneProps, Step } from '../types'

export function Counter({ payload }: SceneProps<{ label: string }>) {
  const instance = useId()
  return (
    <div data-testid="counter" data-instance={instance}>
      {payload.label}
    </div>
  )
}

export function Plain({ step }: SceneProps) {
  return <div data-testid="plain">{step.title}</div>
}

export const groupedSteps: Step<{ label: string }>[] = [
  { id: 'a', era: 'One', title: 'A', caption: 'cap a', Scene: Counter, groupKey: 'g', payload: { label: 'a' } },
  { id: 'b', era: 'One', title: 'B', caption: 'cap b', Scene: Counter, groupKey: 'g', payload: { label: 'b' } },
]

export const deck: AnyStep[] = [
  { id: 's1', era: 'Alpha', title: 'T1', caption: 'C1', Scene: Plain },
  { id: 's2', era: 'Alpha', title: 'T2', caption: 'C2', Scene: Plain },
  { id: 's3', era: 'Beta', title: 'T3', caption: 'C3', Scene: Plain },
  { id: 's4', era: 'Beta', title: 'T4', caption: 'C4', Scene: Plain },
  { id: 's5', era: 'Gamma', title: 'T5', caption: 'C5', Scene: Plain },
]
