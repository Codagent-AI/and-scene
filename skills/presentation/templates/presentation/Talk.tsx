import { Presentation } from '../../presentation-kit'
import type { Step } from '../../presentation-kit'
import './presentation.css'

type Model = { label: string }
function Scene({ payload }: { payload: Model }) {
  return <section className="scene" data-presentation-allow-overlap="">
    <p className="scene-label">{payload.label}</p>
  </section>
}

const steps: Step<Model>[] = [
  { id: 'opening', era: 'Opening', title: 'A clear title', caption: 'One sentence that explains this moment.', Scene, payload: { label: 'The visual idea' }, groupKey: 'main' },
]

export default function Talk() {
  return <Presentation steps={steps} title="Presentation title" initialMode="browse" />
}
