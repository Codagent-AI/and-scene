// @vitest-environment node
import { EventEmitter } from 'node:events'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { chromium } from 'playwright'
import { withBrowser } from '../scripts/browser.mjs'
vi.mock('node:child_process',()=>({spawn:vi.fn()}))
vi.mock('node:net',()=>({createServer:vi.fn()}))
vi.mock('playwright',()=>({chromium:{launch:vi.fn()}}))
let child: EventEmitter & {stdout:EventEmitter;stderr:EventEmitter;exitCode:number|null;kill:ReturnType<typeof vi.fn>}
let close:ReturnType<typeof vi.fn>
beforeEach(()=>{
  const server=Object.assign(new EventEmitter(),{
    listen:vi.fn(()=>queueMicrotask(()=>server.emit('listening'))),
    address:()=>({port:45678}),close:(done:()=>void)=>done(),
  })
  vi.mocked(createServer).mockReturnValue(server as unknown as ReturnType<typeof createServer>)
  child=Object.assign(new EventEmitter(),{stdout:new EventEmitter(),stderr:new EventEmitter(),exitCode:null as number|null,kill:vi.fn(()=>{queueMicrotask(()=>{child.exitCode=0;child.emit('exit',0)});return true})})
  vi.mocked(spawn).mockReturnValue(child as unknown as ReturnType<typeof spawn>)
  close=vi.fn().mockResolvedValue(undefined)
  vi.mocked(chromium.launch).mockResolvedValue({close,newPage:vi.fn().mockResolvedValue({})} as never)
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true}))
  vi.spyOn(console,'log').mockImplementation(()=>{})
  vi.spyOn(console,'warn').mockImplementation(()=>{})
})
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals()})
it.each([false,true])('R1 preview and listeners are cleaned when browser close rejects=%s',async rejects=>{
  if(rejects)close.mockRejectedValue(new Error('disconnected'))
  const signals=['SIGINT','SIGTERM'] as const
  const initial=signals.map(s=>process.listenerCount(s))
  const original=new Error('original render failure')
  await expect(withBrowser(async()=>{throw original})).rejects.toBe(original)
  expect(child.kill).toHaveBeenCalledExactlyOnceWith('SIGTERM')
  expect(child.exitCode).toBe(0)
  expect(console.log).toHaveBeenCalledWith('CLEANUP preview 45678')
  expect(signals.map(s=>process.listenerCount(s))).toEqual(initial)
  if(rejects)expect(console.warn).toHaveBeenCalledWith('Browser close failed: disconnected')
})
it('R1 browser-close failure does not turn successful work into failure',async()=>{
  close.mockRejectedValue(new Error('already gone'))
  await expect(withBrowser(async()=>42)).resolves.toBe(42)
  expect(child.kill).toHaveBeenCalledExactlyOnceWith('SIGTERM')
})
it('R1 listeners are removed even if waiting for preview termination fails',async()=>{
  const before=['SIGINT','SIGTERM'].map(s=>process.listenerCount(s))
  child.kill.mockImplementation(()=>{queueMicrotask(()=>child.emit('error',new Error('cannot reap')));return true})
  await expect(withBrowser(async()=>42)).rejects.toThrow('cannot reap')
  expect(['SIGINT','SIGTERM'].map(s=>process.listenerCount(s))).toEqual(before)
})
