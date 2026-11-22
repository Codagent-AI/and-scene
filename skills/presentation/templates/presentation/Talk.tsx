import { Presentation } from '../../presentation-kit'
import { steps } from './steps'
export default function Talk() {
  return <Presentation title="An evolving scene" steps={steps} initialMode="browse" />
}
