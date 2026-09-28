import { Presentation, type Step } from '../../presentation-kit'
import { Opening } from './steps/Opening'
import './style.css'

const steps: Step<Record<string, never>>[] = [
  { id: 'opening', era: 'begin', title: 'A scene begins', caption: 'A presentation is one scene that changes over time.', Scene: Opening, payload: {} },
]

export default function Talk() {
  return <Presentation steps={steps} title="Your presentation" />
}
