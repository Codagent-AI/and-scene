import { step as ask } from './steps/step-01'
import { step as interview } from './steps/step-02'
import { step as gather } from './steps/step-03'
import { step as growth } from './steps/step-04'
import { step as depth } from './steps/step-05'
import { step as assemble } from './steps/step-06'
import { step as verify } from './steps/step-07'
import { step as modify } from './steps/step-08'
import { step as reveal } from './steps/step-09'

export const steps = [ask, interview, gather, growth, depth, assemble, verify, modify, reveal] as const
