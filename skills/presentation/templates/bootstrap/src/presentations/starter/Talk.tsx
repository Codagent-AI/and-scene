import { Presentation } from '../../presentation-kit'
import type { Step } from '../../presentation-kit'

function Scene({ payload }: { payload: { label: string } }) {
  return <div data-starter-scene="">{payload.label}</div>
}

const steps: Step<{ label: string }>[] = [
  { id: 'welcome', era: 'Start', title: 'A presentation begins', caption: 'Replace this example with a visual explanation of your topic.', Scene, payload: { label: 'Your evolving scene' } },
]

export default function Talk() {
  return <Presentation steps={steps} title="Starter presentation" initialMode="browse" />
}
