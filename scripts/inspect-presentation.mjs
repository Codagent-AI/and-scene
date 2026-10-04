import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
import { diagnosePresentation } from './inspection-diagnostics.mjs'
const slug = process.argv[2]
if (!slug) { console.error('Usage: npm run inspect -- <presentation-slug>'); process.exit(2) }
const host='127.0.0.1', port=4179, base=`http://${host}:${port}`, out=`artifacts/inspection/${slug}`
await mkdir(out,{recursive:true})
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host',host,'--port',String(port),'--strictPort'],{stdio:'ignore'})
let browser
try {
  let ready=false
  for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break}}catch{} await delay(250);if(server.exitCode!==null)throw Error('preview exited before becoming ready')}
  if(!ready)throw Error('preview did not become ready')
  browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:960}})
  await page.goto(`${base}/${encodeURIComponent(slug)}`,{waitUntil:'networkidle'})
  const root=page.locator('[data-presentation]');if(!(await root.count()))throw Error(`No presentation route found for ${slug}`)
  const count=Number(await root.getAttribute('data-step-count'))
  for(let i=0;i<count;i++){
    if(Number(await root.getAttribute('data-step-index'))!==i)await page.locator('[data-presentation-progress-item]').nth(i).click()
    await page.waitForTimeout(900);await page.screenshot({path:`${out}/step-${String(i+1).padStart(2,'0')}.png`})
    const warnings=await page.evaluate(diagnosePresentation)
    for(const warning of warnings)console.warn(`WARNING step ${i+1}: ${warning}`)
  }
  console.log(`Captured ${count} settled step screenshots in ${out}`)
} finally {await browser?.close();if(server.exitCode===null){server.kill('SIGTERM');await new Promise(resolve=>server.once('exit',resolve))}}
