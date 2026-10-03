import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'

const host = '127.0.0.1'
const port = Number(process.env.PREVIEW_PORT ?? 4178)
const slug = 'how-to-make-a-presentation'
const isReference = !process.env.PRESENTATION_ROUTE
const route = process.env.PRESENTATION_ROUTE ?? `/${slug}`
const normative = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]
let currentStep = 1
if (isReference) {
  let sampleFiles
  try { sampleFiles = await Promise.all(['src/presentations/index.ts', 'src/presentations/how-to-make-a-presentation/steps.ts', 'src/presentations/how-to-make-a-presentation/Talk.tsx'].map(file => readFile(file, 'utf8'))) }
  catch { console.error('FAIL: reference sample check: canonical sample files are missing'); process.exit(1) }
  const source = sampleFiles.join('\n')
  for (const [index, [era, title, caption]] of normative.entries()) {
    const titlePosition = source.indexOf(title)
    const previousTitleEnd = index ? source.indexOf(normative[index - 1][1]) + normative[index - 1][1].length : 0
    const nextTitlePosition = index < normative.length - 1 ? source.indexOf(normative[index + 1][1]) : source.length
    const eraPosition = source.indexOf(era, previousTitleEnd)
    const captionPosition = source.indexOf(caption, titlePosition + title.length)
    if (titlePosition < 0 || eraPosition < previousTitleEnd || eraPosition > titlePosition || captionPosition < titlePosition || captionPosition > nextTitlePosition) {
      console.error(`FAIL: reference sample check: step ${index + 1} is missing canonical content or is out of canonical order`)
      process.exit(1)
    }
  }
  if (!sampleFiles[0].includes(`slug: '${slug}'`) || !sampleFiles[0].includes(`import('./how-to-make-a-presentation/Talk')`)) { console.error('FAIL: reference sample check: canonical sample is not registered'); process.exit(1) }
}

const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' })
if (build.status !== 0) { console.error('FAIL: build phase'); process.exit(build.status ?? 1) }
const preview = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
let previewOutput = ''
let previewError = ''
const stripAnsi = value => value.replace(/\x1b\[[0-9;]*m/g, '')
preview.stdout.setEncoding('utf8').on('data', chunk => { previewOutput += chunk })
preview.stderr.setEncoding('utf8').on('data', chunk => { previewError += chunk })
let browser
try {
  const url = `http://${host}:${port}${route}`
  let ready = false
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (preview.exitCode !== null) throw new Error(`vite preview exited before becoming ready${previewError ? `: ${previewError.trim()}` : ''}`)
    if (stripAnsi(previewOutput).includes(`${host}:${port}`)) {
      try { if ((await fetch(url)).ok) { ready = true; break } } catch {}
    }
    await delay(250)
  }
  if (!ready) throw new Error(`preview did not become ready at ${url}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(url, { waitUntil: 'networkidle' })
  if (route !== '/' && await page.locator('[data-presentation]').count() !== 1) throw new Error(`route ${route} did not render a presentation`)
  const chrome = page.locator('[data-step-count]')
  await chrome.waitFor()
  const count = Number(await chrome.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1 || (isReference && count !== normative.length)) throw new Error(`expected ${isReference ? normative.length : 'a positive number of'} steps, got ${count}`)
  for (let index = 0; index < count; index += 1) {
    currentStep = index + 1
    const actual = Number(await chrome.getAttribute('data-step-index'))
    if (actual !== index) throw new Error(`step ${currentStep}: expected data-step-index ${index}, got ${actual}`)
    if (await page.locator('[data-presentation-scene]').count() !== 1) throw new Error(`step ${currentStep}: expected one active scene`)
    if (await page.locator('[data-presentation-progress]').count()) {
      const progress = page.locator('[data-presentation-progress]')
      const active = page.locator('[data-presentation-progress][data-presentation-active="true"]')
      if (await active.count() !== 1 || await progress.nth(index).getAttribute('data-presentation-active') !== 'true' || await progress.nth(index).getAttribute('aria-current') !== 'step') {
        throw new Error(`step ${currentStep}: progress active-state hooks do not match the current index`)
      }
    }
    if (errors.length) throw new Error(`browser error: ${errors.join('; ')}`)
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      try { await page.waitForFunction(expected => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index + 1) }
      catch { throw new Error(`step ${currentStep + 1}: data-step-index did not advance`) }
      await page.waitForTimeout(700)
    }
  }
  if (errors.length) throw new Error(`browser error: ${errors.join('; ')}`)
  console.log(`PASS: build, canonical sample, and all ${count} browser steps (${url})`)
} catch (error) {
  console.error(`FAIL: verification at step ${currentStep}: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  preview.kill('SIGTERM')
}
