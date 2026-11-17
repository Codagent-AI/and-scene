import { Presentation } from '../../presentation-kit'
import { intro } from './steps/intro'
export default function Talk() { return <Presentation title="Presentation" steps={[intro]} /> }
