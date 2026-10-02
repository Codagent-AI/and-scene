import { spawn } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from '@playwright/test'
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..'),host='127.0.0.1',port=Number(process.env.PREVIEW_PORT??4173),base=`http://${host}:${port}`
let preview,browser
try{
 const build=spawn('npm',['run','build'],{cwd:project,stdio:'inherit'});const code=await new Promise(resolve=>build.on('close',resolve));if(code!==0)throw new Error(`build failed (exit ${code})`)
 preview=spawn(process.execPath,[resolve(project,'node_modules/vite/bin/vite.js'),'preview','--host',host,'--port',String(port),'--strictPort'],{cwd:project,stdio:'ignore'})
 let ready=false;for(let i=0;i<80;i++){if(preview.exitCode!==null)throw new Error(`render check failed: preview exited early (code ${preview.exitCode})`);try{if((await fetch(base)).ok){ready=true;break}}catch{}await delay(250)}if(preview.exitCode!==null)throw new Error(`render check failed: preview exited early (code ${preview.exitCode})`);if(!ready)throw new Error(`render check failed: preview not ready at ${base}`)
 const {readFile}=await import('node:fs/promises'),registry=await readFile(resolve(project,'src/presentations/index.ts'),'utf8'),slug=registry.match(/slug:\s*['"]([^'"]+)['"]/)?.[1];if(!slug)throw new Error('sample check failed: no presentation is registered')
 browser=await chromium.launch({headless:true});const page=await browser.newPage(),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(e.message));await page.goto(`${base}/${slug}`,{waitUntil:'networkidle'});const p=page.locator('[data-presentation]');await p.waitFor();const count=Number(await p.getAttribute('data-step-count'));if(!Number.isInteger(count)||count<1)throw new Error('render check failed: invalid step count')
 for(let i=0;i<count;i++){if(Number(await p.getAttribute('data-step-index'))!==i){await page.keyboard.press('ArrowRight');await page.waitForFunction(i=>Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index'))===i,i,{timeout:4000}).catch(()=>{throw new Error(`render check failed on step ${i+1}: transition did not advance`)})}await page.waitForTimeout(800);if(errors.length)throw new Error(`render check failed on step ${i+1}: ${errors.join('; ')}`)}
 console.log(`PASS: build and production render through ${count} steps at ${base}/${slug}`)
}catch(error){console.error(`FAIL: ${error.message}`);process.exitCode=1}finally{await browser?.close();preview?.kill('SIGTERM')}
