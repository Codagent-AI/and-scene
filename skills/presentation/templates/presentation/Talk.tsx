import { Presentation } from '../../presentation-kit/Presentation'
import { steps } from './steps'
import './presentation.css'

export default function Talk() {
  return <Presentation steps={steps} title="{{TITLE}}" initialMode="browse" />
}
