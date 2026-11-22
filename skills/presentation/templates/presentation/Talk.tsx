import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './presentation.css'
export default function Talk() { return <div className="__SLUG__"><Presentation steps={STEPS} title="__TITLE__" initialMode="browse" /></div> }
