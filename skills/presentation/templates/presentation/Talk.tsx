import { Presentation } from '../../presentation-kit'
import type { Step } from '../../presentation-kit'
import './style.css'

// Replace the example payload, scenes, and copy with the gathered presentation plan.
const steps: Step<{ message: string }>[] = [
  { id: 'opening', era: 'Opening', title: 'Introduce the central idea', caption: 'State the first useful idea and what the audience should notice.', Scene: ({ payload }) => <div className="example-scene">{payload.message}</div>, payload: { message: 'The scene begins here.' } },
]

export default function Talk() {
  return <Presentation steps={steps} title="Presentation title" initialMode="browse" />
}
