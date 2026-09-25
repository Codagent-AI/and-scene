import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { startPreview } from './preview-server.mjs'

const slug='how-to-make-a-presentation'
const titles=['You have a topic','The skill interviews you','Answers become steps','The deck grows','You set the depth','It assembles the scene','It checks its own work','Changed your mind? Loop it.',"You're looking at one"]
const captions=['It starts with you, a topic, and mild overconfidence.','One question at a time: the topic, the look, then each beat of the story.','Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.','Same shapes, new beats. Every answer extends the story without redrawing it.','Spell out every step, or sketch a few and see how it looks. You hold the gate.','Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.','Before saying done, it builds and renders every step — and fixes what breaks.','Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.','This presentation was built exactly this way. Thanks for watching.']
const run=(cmd,args)=>new Promise((resolve,reject)=>{const p=spawn(cmd,args,{stdio:'inherit',shell:process.platform==='win32'});p.once('error',reject);p.once('exit',code=>code===0?resolve():reject(new Error(`${cmd} exited ${code}`)))})
let phase='sample validation', preview, browser
try {
 const registry=await readFile('src/presentations/index.ts','utf8'); const talk=await readFile(`src/presentations/${slug}/steps/index.tsx`,'utf8')
 if(!registry.includes(`slug: '${slug}'`)||!registry.includes(`import('./${slug}/Talk')`)) throw Error('Reference sample is missing or not registered')
 for(let i=0;i<titles.length;i++) if(!talk.includes(titles[i])||!talk.includes(captions[i])) throw Error(`Reference sample outline mismatch at step ${i+1}: ${titles[i]}`)
 phase='build'; await run('npm',['run','build'])
 phase='preview startup'; preview=await startPreview(4179)
 phase='browser launch'; browser=await chromium.launch({headless:true})
 const page=await browser.newPage(); let index=0; const errors=[]
 page.on('console',m=>{if(m.type()==='error')errors.push({step:index+1,message:m.text()})}); page.on('pageerror',e=>errors.push({step:index+1,message:e.message}))
 phase='route render'; await page.goto(`http://127.0.0.1:4179/${slug}`,{waitUntil:'networkidle'})
 await page.waitForSelector('[data-step-count]',{timeout:5000}).catch(()=>{})
 if(errors.length)throw Error(`Browser error on step 1: ${errors[0].message}`)
 const count=Number(await page.locator('[data-step-count]').getAttribute('data-step-count')); if(count!==9)throw Error(`Expected 9 steps, found ${count}`)
 for(index=0;index<count;index++) { await page.waitForFunction(i=>Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index'))===i,index); if(errors.length)throw Error(`Browser error on step ${index+1}: ${errors[0].message}`); if(index+1<count){await page.keyboard.press('ArrowRight');try{await page.waitForFunction(i=>Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index'))===i,index+1,{timeout:2500})}catch{throw Error(`Failed transition at step ${index+1} to ${index+2}`)}} }
 if(errors.length)throw Error(`Browser error on step ${errors[0].step}: ${errors[0].message}`)
 console.log('PASS: build, registered canonical sample, and all 9 production browser steps verified on 127.0.0.1')
} catch(e) { console.error(`FAIL [${phase}]: ${e.message}`); process.exitCode=1 } finally { await browser?.close(); await preview?.stop() }
