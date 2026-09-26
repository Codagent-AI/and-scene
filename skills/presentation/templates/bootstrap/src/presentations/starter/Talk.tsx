import { Presentation, SceneLayer, Label } from '../../presentation-kit/index.js'
import type { Step } from '../../presentation-kit/index.js'
import './style.css'

const steps: Step[] = [{
  id: 'welcome', era: 'start', title: 'Start with a topic', caption: 'A presentation begins with a question worth exploring.', payload: undefined,
  scene: () => <SceneLayer><Label id="starter-topic" className="starter-topic">Your topic</Label></SceneLayer>,
}]

export default function Talk() { return <Presentation title="Starter presentation" steps={steps} /> }
