import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { launchChromium, startPreview } from './browser.mjs'
import { referenceOutline as outline } from './reference-sample-outline.mjs'

const root = process.cwd()
const slug = 'how-to-make-a-presentation'
const samplePath = resolve(root, 'src/presentations', slug)
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
  const preview = await startPreview()
  server = preview.server
  const { base } = preview
  browser = await launchChromium()
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
