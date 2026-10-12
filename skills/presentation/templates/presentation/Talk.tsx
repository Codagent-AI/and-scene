import { Presentation } from '../../presentation-kit/Presentation'
import { STEPS } from './steps'
import './presentation.css'

export default function Talk() {
  return <Presentation steps={STEPS} title="Your presentation title" initialMode="browse" />
}
