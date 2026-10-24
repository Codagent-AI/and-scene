import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './styles.css'

export default function Talk() {
  return <Presentation className="example" steps={STEPS} title="Example presentation" initialMode="browse" />
}
