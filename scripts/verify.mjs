import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from '@playwright/test'
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const host = '127.0.0.1'
const port = Number(process.env.PREVIEW_PORT ?? 4173)
const base = `http://${host}:${port}`
const slug = 'how-to-make-a-presentation'
const expected = [
['the ask','You have a topic','It starts with you, a topic, and mild overconfidence.'],
['the ask','The skill interviews you','One question at a time: the topic, the look, then each beat of the story.'],
['the gathering','Answers become steps','Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
['the gathering','The deck grows','Same shapes, new beats. Every answer extends the story without redrawing it.'],
['the gathering','You set the depth','Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
['the build','It assembles the scene','Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
['the build','It checks its own work','Before saying done, it builds and renders every step — and fixes what breaks.'],
['the loop','Changed your mind? Loop it.','Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
['the reveal',"You're looking at one",'This presentation was built exactly this way. Thanks for watching.'],
]
let preview, browser
let currentStep = 'startup'
try {
  const build = spawn('npm', ['run','build'], { cwd: project, stdio: 'inherit' })
  const code = await new Promise((resolve, reject) => {
    build.once('error', reject)
    build.once('close', resolve)
  })
  if (code !== 0) throw new Error(`build failed (exit ${code})`)
  const registry = await readFile(resolve(project,'src/presentations/index.ts'),'utf8')
  const source = await readFile(resolve(project,`src/presentations/${slug}/steps/index.tsx`),'utf8')
  if (!registry.includes(`slug: '${slug}'`) || !registry.includes(`./${slug}/Talk`)) throw new Error(`sample check failed: ${slug} is not registered`)
  for (const [section,title,caption] of expected) for (const value of [section,title,caption]) if (!source.includes(value)) throw new Error(`sample check failed: missing canonical text: ${title}`)
  if ((source.match(/\['the ask'|\['the gathering'|\['the build'|\['the loop'|\['the reveal'/g) ?? []).length !== 9) throw new Error('sample check failed: expected exactly nine ordered steps')
  preview = spawn(process.execPath,[resolve(project,'node_modules/vite/bin/vite.js'),'preview','--host',host,'--port',String(port),'--strictPort'],{cwd:project,stdio:'ignore'})
  let previewError
  preview.once('error', (error) => { previewError = error })
  let ready=false
  for(let i=0;i<80;i++){
    if(previewError)throw new Error(`render check failed: preview could not start: ${previewError.message}`)
    if(preview.exitCode!==null)throw new Error(`render check failed: preview exited early (code ${preview.exitCode})`)
    try{if((await fetch(base)).ok){ready=true;break}}catch{}
    await delay(250)
  }
  if(previewError)throw new Error(`render check failed: preview could not start: ${previewError.message}`)
  if(!ready)throw new Error(`render check failed: preview not ready at ${base}`)
  browser=await chromium.launch({headless:true})
  const page=await browser.newPage({viewport:{width:1440,height:1000}})
  const errors=[]
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(`${base}/${slug}`,{waitUntil:'networkidle'})
  const presentation=page.locator('[data-presentation]')
  await presentation.waitFor()
  const count=Number(await presentation.getAttribute('data-step-count'))
  if(count!==9)throw new Error(`render check failed on step 1: expected 9 steps, got ${count}`)
  for(let i=0;i<count;i++){
    currentStep=`step ${i+1}`
    if(Number(await presentation.getAttribute('data-step-index'))!==i){await page.keyboard.press('ArrowRight');await page.waitForFunction(expected=>Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index'))===expected,i,{timeout:4000}).catch(()=>{throw new Error(`render check failed on ${currentStep}: transition did not advance`)})}
    await page.waitForTimeout(900)
    const title=await page.locator('[data-presentation-step-title]').innerText()
    if(title!==expected[i][1])throw new Error(`render check failed on ${currentStep}: expected "${expected[i][1]}", got "${title}"`)
    if(errors.length)throw new Error(`render check failed on ${currentStep}: ${errors.join('; ')}`)
  }
  console.log(`PASS: build, canonical sample, and production render through all 9 steps at ${base}/${slug}`)
} catch(error){console.error(`FAIL: ${error.message}`);process.exitCode=1} finally {await browser?.close();if(preview&&!preview.killed)preview.kill('SIGTERM')}
