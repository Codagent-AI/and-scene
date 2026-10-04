import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.env.PRESENTATION_SLUG ?? 'how-to-make-a-presentation'
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
const host = '127.0.0.1'
const port = Number(process.env.PREVIEW_PORT ?? 4173)
const url = `http://${host}:${port}`
let preview, browser, previewExited = false, activeStep = 0
try {
  if (slug === 'how-to-make-a-presentation') {
    const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
    const source = await readFile(new URL('../src/presentations/how-to-make-a-presentation/steps.tsx', import.meta.url), 'utf8')
    if (!registry.includes(`slug: '${slug}'`) || !registry.includes(`./how-to-make-a-presentation/Talk`)) throw new Error('Sample check: reference presentation is missing from the registry')
    const titleArray = source.match(/const titles = (\[[\s\S]*?\])/)
    const captionArray = source.match(/const captions = (\[[\s\S]*?\])/)
    const ordered = (values, sourceText) => values.every((value, index) => sourceText.includes(value) && (index === values.length - 1 || sourceText.indexOf(value) < sourceText.indexOf(values[index + 1])))
    if (!titleArray || !captionArray || !ordered(titles, titleArray[1]) || !ordered(captions, captionArray[1])) throw new Error('Sample check: canonical nine-step titles or captions are missing or out of order')
  }
  const build = spawn('npm', ['run', 'build'], { stdio: 'inherit' })
  const status = await new Promise((resolve, reject) => { build.once('error', reject); build.once('close', resolve) })
  if (status !== 0) throw new Error(`Build check failed (exit ${status})`)
  try { await fetch(url, { signal: AbortSignal.timeout(150) }); throw new Error(`Preview check: port ${port} is already in use at ${url}`) } catch (error) { if (error.message?.startsWith('Preview check:')) throw error }
  preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
  preview.on('exit', () => { previewExited = true })
  let ready = false
  for (let i = 0; i < 60 && !previewExited; i++) { try { if ((await fetch(url)).ok) { ready = true; break } } catch {} await delay(200) }
  if (!ready) throw new Error(`Preview check failed: server did not become ready at ${url}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  let notifyBrowserError = () => {}
  const browserError = new Promise(resolve => { notifyBrowserError = resolve })
  page.on('console', message => { if (message.type() === 'error') { errors.push(`step ${activeStep + 1}: console: ${message.text()}`); notifyBrowserError() } })
  page.on('pageerror', error => { errors.push(`step ${activeStep + 1}: page error: ${error.message}`); notifyBrowserError() })
  await page.goto(`${url}/${slug}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation]')
  await root.waitFor()
  const count = Number(await root.getAttribute('data-step-count'))
  if (slug === 'how-to-make-a-presentation' && count !== 9) throw new Error(`Sample check failed: expected 9 steps, observed ${count}`)
  for (let index = 0; index < count; index++) {
    activeStep = index
    const actual = Number(await root.getAttribute('data-step-index'))
    if (actual !== index) throw new Error(`Render check failed at step ${index + 1}: observed index ${actual}`)
    if (errors.length) throw new Error(`Render check failed at step ${index + 1}: ${errors.join('; ')}`)
    if (index < count - 1) {
      activeStep = index + 1
      await page.keyboard.press('ArrowRight')
      const result = await Promise.race([
        page.waitForFunction(expected => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')) === expected, index + 1, { timeout: 5000 }).then(() => 'advanced').catch(() => 'stalled'),
        browserError.then(() => 'browser-error'),
      ])
      if (result === 'browser-error') throw new Error(`Render check failed at step ${index + 2}: ${errors.join('; ')}`)
      if (result === 'stalled') throw new Error(`Render check failed at step ${index + 2}: transition did not advance`)
    }
  }
  if (errors.length) throw new Error(`Render check failed at step ${activeStep + 1}: ${errors.join('; ')}`)
  console.log(`PASS: build, registered canonical sample, and all ${count} production render steps at ${url}/${slug}`)
} catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1 }
finally {
  await browser?.close()
  if (preview && !previewExited) { preview.kill('SIGTERM'); await Promise.race([new Promise(resolve => preview.once('exit', resolve)), delay(3000)]) }
}
