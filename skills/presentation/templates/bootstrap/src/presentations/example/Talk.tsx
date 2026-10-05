import { Presentation } from '../../presentation-kit'
import { steps } from './steps'
import './style.css'

export default function Talk() {
  return <Presentation title="A First Presentation" steps={steps} className="example-presentation" />
}
