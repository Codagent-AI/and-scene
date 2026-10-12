import { Presentation } from '../../presentation-kit/Presentation'
import { steps } from './steps/steps'

export default function Talk() {
  return <Presentation steps={steps} title="{{PRESENTATION_TITLE}}" initialMode="browse" />
}
