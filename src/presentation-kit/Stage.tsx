import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useId } from 'react'
import type { Mode, Step } from './types'
import { DESIGN_W, DESIGN_H, STAGE_LAYOUT } from './constants'
import { useFitScale } from './useFitScale'
const identities = new WeakMap<object, number>()
let sequence=0
function identity(component: object) { if(!identities.has(component))identities.set(component,++sequence);return identities.get(component) }
export function Stage<T>({step,mode}:{step:Step<T>;mode:Mode}) {
 const scale=useFitScale(mode), id=useId(), Scene=step.Scene
 const key=`${identity(Scene)}:${step.groupKey ?? step.id}`
 const geometry=STAGE_LAYOUT[mode]
 return <div data-presentation-stage="" style={{position:'absolute',inset:`${geometry.top}px 0 ${geometry.bottom}px`,display:'grid',placeItems:'center',overflow:'hidden'}}>
  <div data-presentation-canvas="" style={{position:'relative',width:DESIGN_W,height:DESIGN_H,transform:`scale(${scale})`,flexShrink:0}}>
   <LayoutGroup id={id}><AnimatePresence initial={false} mode="sync"><motion.div key={key} data-presentation-scene="" style={{position:'absolute',inset:0}} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.2}}><Scene payload={step.payload}/></motion.div></AnimatePresence></LayoutGroup>
  </div>
 </div>
}
