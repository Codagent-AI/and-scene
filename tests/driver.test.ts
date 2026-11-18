import { it, expect } from 'vitest'
import { EventEmitter } from 'node:events'
import { HOST, collectErrors, advance } from '../scripts/browser.mjs'
it('I-39 driver declares the IPv4 host used for bind probe and URL', () => { expect(HOST).toBe('127.0.0.1') })
it('I-40 driver collects console and page faults with active step and times out stalled transitions', async () => {
  const page = new EventEmitter(); let step=0
  const check=collectErrors(page,()=>step)
  page.emit('console',{type:()=> 'log',text:()=> 'ordinary log'}); expect(check).not.toThrow()
  step=2; page.emit('console',{type:()=> 'error',text:()=> 'bad console'}); expect(check).toThrow('step 2: console: bad console')
  const page2=new EventEmitter(); const check2=collectErrors(page2,()=>3); page2.emit('pageerror',new Error('bad render')); expect(check2).toThrow('step 3: page: bad render')
  const keys:string[]=[]; await expect(advance({ keyboard:{press:async(key:string)=>keys.push(key)},waitForFunction:async()=>{throw new Error('timeout')} },4)).rejects.toThrow('step 4: transition failed')
  expect(keys).toEqual(['ArrowRight'])
})
