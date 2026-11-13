import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { chromium } from 'playwright'
import { setTimeout as delay } from 'node:timers/promises'
import path from 'node:path'
export const HOST = '127.0.0.1'
export const SETTLE_MS = 900
export async function command(cmd, args, root) {
 const child = spawn(cmd,args,{cwd:root,stdio:'inherit'})
 const [code] = await once(child,'exit')
 if (code !== 0) throw new Error(`build: ${cmd} ${args.join(' ')} exited ${code}`)
}
export async function startPreview(root) {
 const socket=createServer(); socket.listen(0,HOST); await once(socket,'listening')
 const port=socket.address().port; await new Promise(resolve=>socket.close(resolve))
 const url=`http://${HOST}:${port}`
 const child=spawn(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'preview','--host',HOST,'--port',String(port),'--strictPort'],{cwd:root,stdio:['ignore','pipe','pipe']})
 let output=''; child.stdout.on('data',chunk=>{output+=chunk});child.stderr.on('data',chunk=>{output+=chunk})
 const stop=async()=>{if(child.exitCode!==null || child.signalCode!==null)return; const exited=once(child,'exit');child.kill('SIGTERM');await exited}
 try {
  for(let attempt=0;attempt<150;attempt++) {
   if(child.exitCode!==null)throw new Error(`preview: exited ${child.exitCode}: ${output}`)
   try {const response=await fetch(url,{signal:AbortSignal.timeout(500)});if(response.ok){console.log(`preview: ${url} pid=${child.pid}`);return {url,pid:child.pid,stop}}} catch { /* wait until preview is ready */ }
   await delay(100)
  }
  throw new Error(`preview: readiness timeout at ${url}: ${output}`)
 } catch(error) {await stop();throw error}
}
export async function withBrowser(root, task, viewport={width:1440,height:900}) {
 const preview=await startPreview(root)
 let browser
 const interrupt=()=>{ void browser?.close(); void preview.stop() }
 process.once('SIGINT',interrupt);process.once('SIGTERM',interrupt)
 try {browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport});return await task(page,preview)}
 finally {process.off('SIGINT',interrupt);process.off('SIGTERM',interrupt);await browser?.close();await preview.stop();console.log(`cleanup: preview pid=${preview.pid} stopped`)}
}
export function captureErrors(page) {
 const errors=[]
 page.on('console',message=>{if(message.type()==='error')errors.push(`console: ${message.text()}`)})
 page.on('pageerror',error=>errors.push(`pageerror: ${error.message}`))
 return () => {if(errors.length)throw new Error(errors.join('; '))}
}
export async function waitStep(page,index) {
 await page.locator(`[data-presentation-root][data-step-index="${index}"]`).waitFor({timeout:5000})
 await page.waitForTimeout(SETTLE_MS)
}
