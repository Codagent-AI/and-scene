import { chromium } from 'playwright'
import { preview as startPreview } from 'vite'
import { readFile } from 'node:fs/promises'

const slug = 'how-to-make-a-presentation'
const titles = ['You have a topic','The skill interviews you','Answers become steps','The deck grows','You set the depth','It assembles the scene','It checks its own work','Changed your mind? Loop it.','You’re looking at one']
const captions = ['It starts with you, a topic, and mild overconfidence.','One question at a time: the topic, the look, then each beat of the story.','Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.','Same shapes, new beats. Every answer extends the story without redrawing it.','Spell out every step, or sketch a few and see how it looks. You hold the gate.','Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.','Before saying done, it builds and renders every step — and fixes what breaks.','Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.','This presentation was built exactly this way. Thanks for watching.']
const host = '127.0.0.1'
const port = Number(process.env.PRESENTATION_PREVIEW_PORT ?? 4178)
const origin = `http://${host}:${port}`
let preview
let browser
let stepLabel = 'sample validation'
try {
  console.log('CHECK build: running npm run build')
  const build = await import('node:child_process').then(({ execFileSync }) => execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run','build'], { stdio: 'inherit' }))
  void build
  const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
  const talk = await readFile(new URL('../src/presentations/how-to-make-a-presentation/Talk.tsx', import.meta.url), 'utf8')
  if (!registry.includes(`slug: '${slug}'`) || !registry.includes("import('./how-to-make-a-presentation/Talk')")) throw new Error('sample check: canonical sample is missing or unregistered')
  let previous = -1
  for (const text of [...titles, ...captions]) { const position = talk.indexOf(text); if (position < 0 || position <= previous) throw new Error(`sample check: missing or out-of-order canonical text: ${text}`); previous = position }
  if ((talk.match(/id: `beat-/g) ?? []).length !== 1 || !talk.includes('through: i + 1')) throw new Error('sample check: expected nine ordered evolving scene states')
  preview = await startPreview({ preview: { host, port, strictPort: true } })
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  let activeStep = 0
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
  await page.goto(`${origin}/${slug}`, { waitUntil: 'networkidle' })
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  if (count !== 9) throw new Error(`render check: expected 9 steps, found ${count}`)
  for (activeStep = 0; activeStep < count; activeStep++) {
    stepLabel = `step ${activeStep + 1}`
    await page.waitForFunction((index) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === index, activeStep)
    await page.locator('[data-presentation-scene]').last().waitFor({ state: 'visible' })
    await page.waitForTimeout(250)
    if (errors.length) throw new Error(`${stepLabel}: ${errors.join('; ')}`)
    if (activeStep < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((next) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === next, activeStep + 1, { timeout: 4000 }).catch(() => null)
      const observed = Number(await page.locator('[data-step-index]').getAttribute('data-step-index'))
      if (observed !== activeStep + 1) throw new Error(`step transition did not advance to ${activeStep + 2}`)
    }
  }
  console.log(`PASS: build and rendered all ${count} steps at ${origin}/${slug}`)
} catch (error) {
  console.error(`FAIL ${stepLabel}: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview?.httpServer.listening) await new Promise((resolve, reject) => preview.httpServer.close((error) => error ? reject(error) : resolve()))
}
