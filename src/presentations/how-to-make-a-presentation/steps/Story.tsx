import { AnimatePresence } from 'motion/react'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Appear } from '../../../presentation-kit/nodes/Appear'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import type { SceneProps, Step } from '../../../presentation-kit/types'
import { entitiesAt, sampleMeta } from '../entities'
function Story({payload}:SceneProps<number>) {
 return <SceneLayer>{<AnimatePresence>{entitiesAt(payload).map(e=><Appear key={e.id} style={{position:'absolute',left:e.x,top:e.y,width:e.w,height:e.h}}><Box id={`how-to:${e.id}`} data-entity={e.id} className={`entity ${e.kind}`} style={{width:'100%',height:'100%'}}>{e.kind==='arc'?<svg width="225" height="162" viewBox="0 0 225 162" aria-label="Edit loop from conversation to step"><path d="M105 6 C225 6 225 150 145 150 C105 150 70 115 40 90 M40 90 l16 4 M40 90 l4 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4"/></svg>:<span>{e.label}</span>}{e.kind==='card' && <small>title · caption · visual</small>}</Box></Appear>)}</AnimatePresence>}</SceneLayer>
}
export const STEPS:Step<number>[] = sampleMeta.map((s,i)=>({...s,Scene:Story,groupKey:'story',payload:i}))
