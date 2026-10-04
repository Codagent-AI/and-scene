import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const slug = 'how-to-make-a-presentation'
const titles = ['You have a topic', 'The skill interviews you', 'Answers become steps', 'The deck grows', 'You set the depth', 'It assembles the scene', 'It checks its own work', 'Changed your mind? Loop it.', "You're looking at one"]
const captions = [
  'It starts with you, a topic, and mild overconfidence.',
  'One question at a time: the topic, the look, then each beat of the story.',
  'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  'Same shapes, new beats. Every answer extends the story without redrawing it.',
  'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  'Before saying done, it builds and renders every step — and fixes what breaks.',
  'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  'This presentation was built exactly this way. Thanks for watching.',
]
const fail = (phase, message, step) => { throw new Error(`${phase}${step === undefined ? '' : ` at step ${step + 1}`}: ${message}`) }
let preview, browser
try {
  console.log('BUILD: running npm run build')
  const build = spawn('npm', ['run', 'build'], { stdio: 'inherit' })
  const status = await new Promise((resolve, reject) => { build.once('error', reject); build.once('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0))) })
  if (status !== 0) fail('BUILD FAILED', `npm run build exited ${status}`)

  const [registry, talk] = await Promise.all([
    readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/presentations/how-to-make-a-presentation/Talk.tsx', import.meta.url), 'utf8'),
  ])
  if (!registry.includes(`slug: '${slug}'`) || !registry.includes("import('./how-to-make-a-presentation/Talk')")) fail('SAMPLE CHECK FAILED', `registered route /${slug} is missing`)
  for (const [kind, values] of [['title', titles], ['caption', captions]]) {
    let cursor = -1
    for (const value of values) {
      const next = talk.indexOf(value, cursor + 1)
      if (next < 0) fail('SAMPLE CHECK FAILED', `canonical ${kind} missing or out of order: ${value}`)
      cursor = next
    }
  }

  console.log('RENDER: starting production preview on 127.0.0.1:4173')
  preview = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: 'inherit' })
  const started = Date.now()
  let ready = false
  while (!ready && Date.now() - started < 20000) {
    if (preview.exitCode !== null) fail('PREVIEW FAILED', `preview exited ${preview.exitCode}`)
    try { ready = (await fetch('http://127.0.0.1:4173/')).ok } catch {}
    if (!ready) await delay(200)
  }
  if (!ready) fail('PREVIEW FAILED', 'readiness probe timed out at http://127.0.0.1:4173/')

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  let activeStep = 0
  const browserErrors = []
  page.on('pageerror', (error) => browserErrors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  await page.goto(`http://127.0.0.1:4173/${slug}`)
  await page.locator('[data-step-count="9"]').waitFor({ timeout: 10000 }).catch(() => fail('RENDER FAILED', 'reference route did not expose nine steps', activeStep))
  for (activeStep = 0; activeStep < 9; activeStep += 1) {
    if (activeStep > 0) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((expected) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(expected), activeStep, { timeout: 4000 }).catch(() => fail('TRANSITION FAILED', 'data-step-index did not advance', activeStep))
    }
    await page.waitForTimeout(900)
    if (browserErrors.length) fail('BROWSER ERROR', browserErrors.splice(0).join('; '), activeStep)
    const rendered = await page.evaluate(() => ({ title: document.querySelector('[data-presentation-caption] strong')?.textContent ?? '', caption: document.querySelector('[data-presentation-caption] p')?.textContent ?? '' }))
    if (rendered.title !== titles[activeStep] || rendered.caption !== captions[activeStep]) fail('SAMPLE CHECK FAILED', `rendered "${rendered.title}" does not match canonical "${titles[activeStep]}"`, activeStep)
    console.log(`PASS: step ${activeStep + 1}/9 — ${titles[activeStep]}`)
  }
  const narrow = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await narrow.goto(`http://127.0.0.1:4173/${slug}`)
  await narrow.locator('[data-step-count="9"]').waitFor({ timeout: 10000 }).catch(() => fail('NARROW RENDER FAILED', 'reference route did not expose nine steps at 390px'))
  for (let step = 0; step < 9; step += 1) {
    if (step > 0) await narrow.keyboard.press('ArrowRight')
    await narrow.waitForTimeout(900)
    const tiny = await narrow.evaluate(() => {
      const canvas = document.querySelector('[data-presentation-canvas]')
      const scale = canvas.getBoundingClientRect().width / canvas.offsetWidth
      const leaves = [...document.querySelectorAll('[data-presentation-scene] *')].filter((el) => el.children.length === 0 && (el.textContent ?? '').trim() && getComputedStyle(el).display !== 'none' && Number(getComputedStyle(el).opacity) > 0.05)
      return leaves.map((el) => ({ text: el.textContent.trim().slice(0, 30), size: parseFloat(getComputedStyle(el).fontSize) * scale })).filter((item) => item.size < 5.5)[0]
    })
    if (tiny) fail('NARROW READABILITY FAILED', `"${tiny.text}" renders at ${tiny.size.toFixed(1)}px on a 390px viewport`, step)
  }
  console.log('PASS: scene text stays readable at a 390px viewport')
  console.log(`PASS: production render verification completed for /${slug} on 127.0.0.1`)
} catch (error) {
  console.error(`VERIFY FAILED: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview && preview.exitCode === null) { preview.kill('SIGTERM'); await Promise.race([new Promise((resolve) => preview.once('exit', resolve)), delay(3000)]) }
}
