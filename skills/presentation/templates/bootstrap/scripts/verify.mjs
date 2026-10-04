import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
const host='127.0.0.1',port=Number(process.env.AND_SCENE_VERIFY_PORT??4178),base=`http://${host}:${port}`,slug=process.argv[2]||'example'
let server,browser
const run=(cmd,args)=>new Promise((resolve,reject)=>{const child=spawn(cmd,args,{stdio:'inherit',shell:process.platform==='win32'});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error(`${cmd} failed (${code})`)))})
try{
 await run('npm',['run','build'])
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host',host,'--port',String(port),'--strictPort'],{stdio:'ignore'})
 let ready=false
 for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break}}catch{}await delay(250);if(server.exitCode!==null)throw Error('vite preview exited before becoming ready')}
 if(!ready)throw Error('preview did not become ready')
 browser=await chromium.launch({headless:true});const page=await browser.newPage(),errors=[];let step=1
 page.on('pageerror',e=>errors.push({step,message:e.message}));page.on('console',m=>{if(m.type()==='error')errors.push({step,message:m.text()})})
 await page.goto(`${base}/${encodeURIComponent(slug)}`,{waitUntil:'networkidle'})
 const root=page.locator('[data-presentation]');await root.waitFor({state:'attached',timeout:10000}).catch(()=>{throw Error(errors.length?`browser render failed: ${errors.map(e=>`step ${e.step}: ${e.message}`).join('; ')}`:`render check failed: registered ${slug} route did not render`)})
 const count=Number(await root.getAttribute('data-step-count'));if(!count)throw Error('render check failed: presentation reported no steps')
 for(let index=0;index<count;index++){
  step=index+1
  if(Number(await root.getAttribute('data-step-index'))!==index){await page.keyboard.press('ArrowRight');await page.waitForFunction(i=>Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index'))===i,index,{timeout:4000}).catch(()=>{throw Error(`step ${step} transition failed`)})}
  await page.waitForTimeout(450)
  const current=errors.filter(e=>e.step===step);if(current.length)throw Error(`step ${step} render failed: ${current.map(e=>e.message).join('; ')}`)
 }
 console.log(`PASS: build and registered example route render cleanly (${count} steps)`)
}catch(e){console.error(`FAIL: ${e.message}`);process.exitCode=1}finally{await browser?.close();if(server&&server.exitCode===null){server.kill('SIGTERM');await new Promise(resolve=>server.once('exit',resolve))}}
