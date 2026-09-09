import { spawn } from 'node:child_process'
import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { preview as startPreview } from 'vite'

const canonicalSlug = 'how-to-make-a-presentation'
const slug = process.argv[2] ?? canonicalSlug
const host = '127.0.0.1'
const port = 4173
const root = process.cwd()
const canonicalOutline = [
  ['You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ["You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', ...options })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.httpServer.close((error) => error ? reject(error) : resolve())
  })
}

async function assertCanonicalSample() {
  const registry = await readFile(join(root, 'src/presentations/index.ts'), 'utf8')
  const sample = join(root, 'src/presentations', canonicalSlug, 'Talk.tsx')
  await access(sample)
  const source = await readFile(sample, 'utf8')
  if (!registry.includes(`slug: '${canonicalSlug}'`)) throw new Error('reference sample is not registered')
  let position = -1
  for (const [title, caption] of canonicalOutline) {
    const titlePosition = source.indexOf(title, position + 1)
    const captionPosition = source.indexOf(caption, titlePosition + 1)
    if (titlePosition < 0 || captionPosition < 0) throw new Error(`reference sample is missing canonical step “${title}”`)
    position = captionPosition
  }
}

let server
let browser
let activeStep = 0
const errors = []

try {
  if (slug === canonicalSlug) await assertCanonicalSample()
  await run('npm', ['run', 'build'])
  server = await startPreview({ root, preview: { host, port, strictPort: true } })
  const url = `http://${host}:${port}/${slug}`
  const readiness = await fetch(`http://${host}:${port}/`)
  if (!readiness.ok) throw new Error(`preview readiness probe failed (${readiness.status})`)

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`step ${activeStep + 1}: ${message.text()}`) })
  page.on('pageerror', (error) => errors.push(`step ${activeStep + 1}: ${error.message}`))
  await page.goto(url, { waitUntil: 'networkidle' })
  if (errors.length) throw new Error(errors.join('; '))

  const presentation = page.locator('[data-presentation-root]')
  if (await presentation.count() !== 1) throw new Error(`route /${slug} did not render a presentation`)
  const count = Number(await presentation.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`route /${slug} did not expose a positive data-step-count`)
  if (slug === canonicalSlug && count !== canonicalOutline.length) throw new Error(`reference sample exposes ${count} steps, expected ${canonicalOutline.length}`)

  for (activeStep = 0; activeStep < count; activeStep += 1) {
    if (await presentation.getAttribute('data-step-index') !== String(activeStep)) throw new Error(`step ${activeStep + 1} did not become active`)
    if (slug === canonicalSlug) {
      const [title, caption] = canonicalOutline[activeStep]
      if (await page.locator('[data-presentation-title]').textContent() !== title) throw new Error(`step ${activeStep + 1} rendered the wrong title`)
      if (await page.locator('[data-presentation-caption]').textContent() !== caption) throw new Error(`step ${activeStep + 1} rendered the wrong caption`)
    }
    if (errors.length) throw new Error(errors.join('; '))
    if (activeStep < count - 1) {
      await page.keyboard.press('ArrowRight')
      await presentation.waitFor({ state: 'attached' })
      await page.waitForFunction((index) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(index), activeStep + 1)
    }
  }
  if (errors.length) throw new Error(errors.join('; '))
  console.log(`VERIFY PASS: /${slug} built and rendered ${count} steps on ${host}`)
} catch (error) {
  console.error(`VERIFY FAIL${activeStep >= 0 ? ` at step ${activeStep + 1}` : ''}: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
} finally {
  try {
    await browser?.close()
  } finally {
    if (server) await closeServer(server)
  }
}
