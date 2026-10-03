import { Presentation } from '../../presentation-kit'
import { steps } from './steps'
import './style.css'

export default function Talk() {
  return <Presentation steps={steps} title="A first evolving scene" initialMode="browse" />
}
