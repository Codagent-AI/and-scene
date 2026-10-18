import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './styles.css'

export default function Talk() {
  return <Presentation className="starter" steps={STEPS} title="Starter Presentation" initialMode="browse" />
}
