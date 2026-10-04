import { Presentation } from '../../presentation-kit'
import { step } from './steps/01-start'
import './style.css'
export default function Talk() { return <Presentation title="A Small Example" steps={[step]} /> }
