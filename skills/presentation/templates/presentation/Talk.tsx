import { Presentation } from '../../presentation-kit/Presentation'
import { STEPS } from './steps'
import './style.css'

export default function Talk() {
  return <Presentation steps={STEPS} title="Presentation title" initialMode="browse" />
}
