import { Presentation } from '../../presentation-kit'
import { steps } from './steps'
import './presentation.css'

export default function Talk() {
  return <Presentation steps={steps} title="Presentation title" initialMode="browse" />
}
