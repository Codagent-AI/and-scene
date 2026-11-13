import type { ReactNode } from 'react'
import type { Mode, Step } from './types'
import { usePresentationNav } from './usePresentationNav'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
export function Presentation<T>({steps,title,initialMode='browse',brand}:{steps:Step<T>[];title:string;initialMode?:Mode;brand?:ReactNode}) {
 const nav=usePresentationNav(steps.length,initialMode)
 if(!steps.length)throw new Error('A presentation requires at least one step')
 return <main data-presentation="" data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} style={{position:'relative',width:'100%',height:'100dvh',overflow:'hidden'}}>
  <Header title={nav.mode==='browse'?title:''} brand={brand}/><button data-presentation-mode-toggle="" aria-label="Toggle presentation mode" onClick={nav.toggle}>{nav.mode==='browse'?'Present ↗':'Browse ↙'}</button>
  <Stage step={steps[nav.index]} mode={nav.mode}/>{nav.mode==='browse' && <Toc steps={steps} index={nav.index} go={nav.go}/>}<Footer steps={steps} index={nav.index} mode={nav.mode} go={nav.go} next={nav.next} prev={nav.prev}/>
  <a data-presentation-attribution="" style={{position:'absolute',right:16,bottom:10}} href="https://github.com/Codagent-AI/and-scene">made by and-scene</a>
 </main>
}
