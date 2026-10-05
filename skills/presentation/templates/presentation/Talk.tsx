import { Presentation } from '../../presentation-kit'
import { steps } from './steps'
import './style.css'

export default function Talk() {
  return <Presentation title="REPLACE_TITLE" steps={steps} initialMode="browse" className="REPLACE_SLUG" />
}
