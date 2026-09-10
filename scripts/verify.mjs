import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { canonicalSteps, sampleSlug } from './reference-sample.mjs'

const host = '127.0.0.1'
const root = resolve(process.env.AND_SCENE_ROOT || resolve(dirname(fileURLToPath(import.meta.url)), '..'))
const transitionTimeout = Number(process.env.VERIFY_TRANSITION_TIMEOUT || 3000)

function run(command, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolveRun() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}

function availablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, host, () => {
      const address = server.address()
      server.close((error) => error ? reject(error) : resolvePort(address.port))
    })
  })
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(url)).ok) return } catch { /* preview is starting */ }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100))
  }
  throw new Error(`preview did not become ready at ${url}`)
}

async function validateReferenceFiles() {
  const [registry, steps] = await Promise.all([
    readFile(resolve(root, 'src/presentations/index.ts'), 'utf8'),
    readFile(resolve(root, `src/presentations/${sampleSlug}/steps/index.tsx`), 'utf8'),
  ])
  if (!registry.includes(`slug: '${sampleSlug}'`) || !registry.includes("title: 'How to Use This Skill to Make a Presentation'")) {
    throw new Error(`reference sample registration is missing or malformed: /${sampleSlug}`)
  }
  let cursor = -1
  for (let index = 0; index < canonicalSteps.length; index += 1) {
    const [era, title, caption] = canonicalSteps[index]
    const nextCursor = [era, title, caption].reduce((position, value) => position < -1 ? -1 : steps.indexOf(value, position + 1), cursor)
    if (nextCursor < 0) {
      throw new Error(`reference sample step ${index + 1} is missing or out of canonical order`)
    }
    cursor = nextCursor
  }
}

async function main() {
  await run('npm', ['run', 'build'])
  await validateReferenceFiles()
  const port = await availablePort()
  const origin = `http://${host}:${port}`
  const preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
  let browser
  try {
    await waitFor(origin)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    const errors = []
    let activeStep = 1
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`step ${activeStep}: ${message.text()}`) })
    page.on('pageerror', (error) => errors.push(`step ${activeStep}: ${error.message}`))
    await page.goto(`${origin}/${sampleSlug}`, { waitUntil: 'networkidle' })
    const chrome = page.locator('[data-presentation-chrome]')
    await chrome.waitFor()
    const count = Number(await chrome.getAttribute('data-step-count'))
    if (count !== canonicalSteps.length) throw new Error(`render check expected ${canonicalSteps.length} steps but found ${count}`)
    for (let index = 0; index < count; index += 1) {
      activeStep = index + 1
      try {
        await page.waitForFunction((expected) => document.querySelector('[data-presentation-chrome]')?.getAttribute('data-step-index') === String(expected), index, { timeout: transitionTimeout })
      } catch (error) {
        throw new Error(`render transition failed at step ${activeStep}: ${error instanceof Error ? error.message : error}`)
      }
      if (errors.length) throw new Error(`render failed at ${errors[0]}`)
      if (index < count - 1) await page.keyboard.press('ArrowRight')
    }
    await page.close()
    console.log(`verify: PASS (${count} reference steps rendered)`)
  } finally {
    await browser?.close()
    preview.kill()
  }
}

main().catch((error) => {
  console.error(`verify: FAIL ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
})
