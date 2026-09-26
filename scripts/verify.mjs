import { spawn } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { preview } from 'vite'

const root = process.cwd()
const slug = 'how-to-make-a-presentation'
const samplePath = resolve(root, 'src/presentations', slug)
const outline = [
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
const fail = (phase, message) => { throw new Error(`${phase}: ${message}`) }
const runBuild = () => new Promise((resolveBuild, reject) => {
  const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
  child.once('error', reject)
  child.once('exit', (code) => code === 0 ? resolveBuild() : reject(new Error(`npm run build exited with ${code}`)))
})
let server
let browser
try {
  if (!existsSync(resolve(samplePath, 'Talk.tsx'))) fail('sample check', `missing ${samplePath}/Talk.tsx`)
  const registry = readFileSync(resolve(root, 'src/presentations/index.ts'), 'utf8')
  if (!registry.includes(`slug: '${slug}'`) || !registry.includes(`import('./${slug}/Talk')`)) fail('sample check', `sample route /${slug} is not registered`)
  const stepSource = readFileSync(resolve(samplePath, 'steps/index.ts'), 'utf8')
  let cursor = -1
  for (const [title, caption] of outline) {
    const titleAt = stepSource.indexOf(title, cursor + 1)
    const captionAt = stepSource.indexOf(caption, titleAt + title.length)
    if (titleAt < 0 || captionAt < titleAt) fail('sample check', `missing or out-of-order canonical step: ${title}`)
    cursor = captionAt
  }
  if ((stepSource.match(/\bid: '/g) ?? []).length !== outline.length || !stepSource.includes("groupKey: 'presentation-story'")) fail('sample check', 'expected exactly nine steps sharing one scene group')
  await runBuild()
  console.log('PASS: production build')
  server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: true } })
  const address = server.httpServer.address()
  if (!address || typeof address === 'string') fail('preview check', 'preview did not bind a TCP port')
  const base = `http://127.0.0.1:${address.port}`
  const systemChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  const bundledChromium = existsSync('/ms-playwright') ? readdirSync('/ms-playwright').filter((name) => name.startsWith('chromium-')).map((name) => `/ms-playwright/${name}/chrome-linux64/chrome`).find(existsSync) : undefined
  browser = await chromium.launch({ headless: true, ...((systemChromium || bundledChromium) ? { executablePath: systemChromium || bundledChromium } : {}) })
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  const errors = []
  let activeStep = 1
  page.on('pageerror', (error) => errors.push(`step ${activeStep}: uncaught ${error.message}`))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`step ${activeStep}: console ${message.text()}`) })
  await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle' })
  const rootHook = page.locator('[data-presentation-root]')
  await rootHook.waitFor()
  const count = Number(await rootHook.getAttribute('data-step-count'))
  if (count !== outline.length) fail('render check', `expected ${outline.length} steps, found ${count}`)
  for (let index = 0; index < count; index++) {
    activeStep = index + 1
    if (index > 0) await page.keyboard.press('ArrowRight')
    try {
      await page.waitForFunction((expected) => Number(document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')) === expected, index, { timeout: 3000 })
      await page.waitForTimeout(750)
    } catch {
      fail('render check', `step ${index + 1}: expected data-step-index ${index}`)
    }
    if (errors.length) fail('render check', errors.join('; '))
    console.log(`PASS: render step ${index + 1}/${count}`)
  }
  console.log(`PASS: production render verification on ${base}/${slug}`)
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  await server?.close()
}
