import { Presentation } from '../../presentation-kit'
import { step } from './steps/step'
import './styles.css'

export default function Talk() {
  return <Presentation title="Your presentation" steps={[step]} initialMode="browse" className="presentation" />
}
