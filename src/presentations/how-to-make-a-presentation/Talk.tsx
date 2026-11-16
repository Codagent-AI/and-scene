import { Presentation } from '../../presentation-kit/Presentation'
import { STEPS } from './steps'
import { CANVAS } from './entities'
import { TITLE } from './outline'
import './presentation.css'
export default function Talk() { return <div className="field-guide"><Presentation steps={STEPS} title={TITLE} canvas={CANVAS} initialMode="browse" /></div> }
