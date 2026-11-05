import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
const titles = ['You have a topic','The skill interviews you','Answers become steps','The deck grows','You set the depth','It assembles the scene','It checks its own work','Changed your mind? Loop it.',"You're looking at one"]
const eras = ['the ask','the ask','the gathering','the gathering','the gathering','the build','the build','the loop','the reveal']
const captions = ['It starts with you, a topic, and mild overconfidence.','One question at a time: the topic, the look, then each beat of the story.','Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.','Same shapes, new beats. Every answer extends the story without redrawing it.','Spell out every step, or sketch a few and see how it looks. You hold the gate.','Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.','Before saying done, it builds and renders every step — and fixes what breaks.','Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.','This presentation was built exactly this way. Thanks for watching.']
function run(command, args) { return new Promise((resolve, reject) => { const p = spawn(command, args, {stdio:'inherit'}); p.on('error', reject); p.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} failed (${code})`))) }) }
let server, browser, step = 0
try {
  console.log('Checking build'); try { await run('npm', ['run','build']) } catch (error) { throw new Error(`build failed: ${error.message}`) }
  const registry = await readFile('src/presentations/index.ts','utf8')
  if (!registry.includes('how-to-make-a-presentation')) throw new Error('sample registration missing')
  server = spawn('npm', ['run','preview','--','--host','127.0.0.1','--port','4173','--strictPort'], {stdio:'ignore', detached:true})
  await new Promise(r => setTimeout(r, 500))
  if (server.exitCode !== null) throw new Error('preview failed to start')
  let ready = false
  for (let i=0;i<100;i++) { try { if ((await fetch('http://127.0.0.1:4173/')).ok) { ready = true; break } } catch {} await new Promise(r=>setTimeout(r,100)) }
  if (!ready) throw new Error('preview failed to start')
  browser = await chromium.launch({headless:true})
  const page = await browser.newPage(); const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) }); page.on('pageerror', e => errors.push(e.message))
  await page.goto('http://127.0.0.1:4173/how-to-make-a-presentation')
  const root = page.locator('[data-presentation-root]'); await root.waitFor()
  const count = Number(await root.getAttribute('data-step-count'))
  if (count !== 9) throw new Error(`sample count ${count}, expected 9`)
  for (step=0;step<count;step++) {
    await page.waitForTimeout(750)
    if (errors.length) throw new Error(errors.join('; '))
    if (Number(await root.getAttribute('data-step-index')) !== step) throw new Error('step transition failed')
    if (await page.locator('[data-presentation-toc] [aria-current]').textContent() !== eras[step] || await page.locator('[data-presentation-footer] h1').textContent() !== titles[step] || await page.locator('[data-presentation-footer] p').textContent() !== captions[step]) throw new Error('sample metadata mismatch')
    if (errors.length) throw new Error(errors.join('; '))
    if (step < count-1) await page.keyboard.press('ArrowRight')
  }
  console.log('PASS: build and nine sample steps')
} catch (error) { console.error(`FAIL at step ${step}: ${error.message}`); process.exitCode = 1 }
finally { if (browser) await browser.close(); if (server) { try { process.kill(-server.pid, 'SIGTERM') } catch (error) { if (error.code !== 'ESRCH') throw error } } }
