import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './style.css'

export default function Talk() {
  return <Presentation title="Replace with presentation title" steps={STEPS} initialMode="browse" />
}
