import { Presentation } from '../../presentation-kit'
import { steps } from './steps'
import './presentation.css'
export default function Talk() {
  return <Presentation steps={steps} title="Your presentation" initialMode="browse" />
}
