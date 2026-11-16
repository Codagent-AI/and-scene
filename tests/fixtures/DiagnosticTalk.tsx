import { useLayoutEffect, useRef } from 'react'
import { AnimatePresence } from 'motion/react'
import { Presentation, Appear, Box, type SceneProps, type Step } from '../../presentation-kit'

function Scene({payload}:SceneProps<number>){
  const previous = useRef<{entity: Element|null; wrapper: Element|null} | null>(null)
  useLayoutEffect(()=>{
    const transitionAt=Date.now()
    const element=(name:string)=>document.querySelector(`[data-presentation-entity="fixture:${name}"]`)
    const continuing=element('continuing')
    const wrapper=continuing?.closest('[data-presentation-appear]')??null
    const sameEntity=previous.current?.entity===continuing
    const sameWrapper=previous.current?.wrapper===wrapper
    previous.current={entity:continuing,wrapper}
    const frames: {at:number;left:number;width:number;height:number;continuingOpacity:number;newOpacity:number|null;departOpacity:number|null}[]=[]
    const opacity=(name:string)=>{const node=element(name)?.closest('[data-presentation-appear]');return node?Number(getComputedStyle(node).opacity):null}
    let request=0
    function sample(){
      const rect=continuing!.getBoundingClientRect()
      frames.push({at:Date.now(),left:rect.left,width:rect.width,height:rect.height,continuingOpacity:Number(getComputedStyle(wrapper!).opacity),newOpacity:opacity('new'),departOpacity:opacity('departing')})
      if(Date.now()-transitionAt<790)request=requestAnimationFrame(sample)
      else console.info('MOTION '+JSON.stringify({index:payload,transitionAt,sameEntity,sameWrapper,frames}))
    }
    request=requestAnimationFrame(sample)
    return ()=>cancelAnimationFrame(request)
  },[payload])
  return <>
    <span style={{position:'absolute',left:50,top:50}}>Collision A</span><span style={{position:'absolute',left:50,top:50}}>Collision B</span>
    <div style={{position:'absolute',left:50,top:90}}>Nested parent<span style={{position:'absolute',left:0,top:0}}>Nested child</span></div>
    <div data-presentation-allow-overlap="true" style={{position:'absolute',left:300,top:90}}>Allowed parent<span style={{position:'absolute',left:0,top:0}}>Allowed child</span></div>
    <AnimatePresence>
      <Appear key="continuing"><Box entityId="fixture:continuing" className={payload?'emphasized':''} style={{position:'absolute',left:payload?250:50,top:payload?220:180,width:payload?160:80,height:payload?50:30}}>{payload?'Changed label':'Anchor'}</Box></Appear>
      {payload===0 && <Appear key="departing"><Box entityId="fixture:departing" style={{position:'absolute',left:720,top:220}}>Departing</Box></Appear>}
      {payload===1 && <Appear key="new"><Box entityId="fixture:new" style={{position:'absolute',left:540,top:220}}>Newcomer</Box></Appear>}
    </AnimatePresence>
  </>
}
const steps:Step<number>[]=[0,1].map(i=>({id:String(i),era:'section '+i,title:'Test '+i,caption:'Capture fixture.',Scene,payload:i,groupKey:'fixture'}))
export default function Talk(){return <Presentation title="Fixture" steps={steps}/>}
