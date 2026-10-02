import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from '@playwright/test'
import { inspectWarnings } from './inspection-diagnostics.mjs'
import { assertPreviewPortAvailable } from './preview-port.mjs'
const slug=process.argv[2];if(!slug)throw new Error('Usage: npm run inspect -- <presentation-slug>')
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..'),host='127.0.0.1',port=Number(process.env.PREVIEW_PORT??4174),base=`http://${host}:${port}`
let preview
let previewError
let browser
try{
 await assertPreviewPortAvailable(host,port)
 preview=spawn(process.execPath,[resolve(project,'node_modules/vite/bin/vite.js'),'preview','--host',host,'--port',String(port),'--strictPort'],{cwd:project,stdio:'ignore'})
 preview.once('error',error=>{previewError=error})
 let ready=false
 for(let i=0;i<80;i++){
  if(previewError)throw new Error(`preview could not start: ${previewError.message}`)
  if(preview.exitCode!==null)throw new Error(`preview exited early (port in use?) with code ${preview.exitCode}`)
  try{if((await fetch(base)).ok){await delay(250);if(previewError)throw new Error(`preview could not start: ${previewError.message}`);if(preview.exitCode!==null)throw new Error(`preview exited early (port in use?) with code ${preview.exitCode}`);ready=true;break}}catch(error){if(error.message.startsWith('preview '))throw error}
  await delay(250)
 }
 if(previewError)throw new Error(`preview could not start: ${previewError.message}`)
 if(preview.exitCode!==null)throw new Error(`preview exited early (port in use?) with code ${preview.exitCode}`)
 if(!ready)throw new Error(`preview did not start at ${base}`)
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[]
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
 page.on('pageerror',error=>errors.push(error.message))
 await page.goto(`${base}/${slug}`,{waitUntil:'networkidle'})
 const presentation=page.locator('[data-presentation]');await presentation.waitFor();const total=Number(await presentation.getAttribute('data-step-count'));if(!Number.isInteger(total)||total<1)throw new Error('presentation has no valid data-step-count')
 const directory=resolve(project,`artifacts/inspection/${slug}`);await mkdir(directory,{recursive:true})
 for(let index=0;index<total;index++){
  if(Number(await presentation.getAttribute('data-step-index'))!==index){await page.keyboard.press('ArrowRight');await page.waitForFunction(i=>Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index'))===i,index)}
  await delay(Number(process.env.INSPECT_SETTLE_MS??1000));await page.screenshot({path:`${directory}/step-${String(index+1).padStart(2,'0')}.png`,fullPage:true})
  const warnings=await inspectWarnings(page);for(const warning of warnings)console.warn(`WARN step ${index+1}: ${warning}`)
  if(errors.length)console.warn(`WARN step ${index+1}: browser errors: ${errors.splice(0).join('; ')}`)
 }
 console.log(`Captured ${total} settled screenshots in ${directory}`)
}finally{await browser?.close();preview?.kill('SIGTERM')}
