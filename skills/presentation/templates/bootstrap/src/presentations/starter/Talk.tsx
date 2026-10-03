import { Presentation } from '../../presentation-kit'
import type { Step } from '../../presentation-kit'

function Scene({ payload }: { payload: { message: string } }) {
  return <div data-starter-scene="">{payload.message}</div>
}

const steps: Step<{ message: string }>[] = [
  { id: 'welcome', era: 'Start', title: 'Your first scene', caption: 'Replace this starter with a topic and a sequence of visual states.', Scene, payload: { message: 'One scene, ready to evolve.' }, groupKey: 'starter' },
]

export default function Talk() {
  return <Presentation steps={steps} title="A new presentation" />
}
