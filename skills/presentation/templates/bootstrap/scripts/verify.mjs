import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
const host = '127.0.0.1'
const port = '4173'

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}

async function ready(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return
    } catch { /* preview is not listening yet */ }
    await delay(150)
  }
  throw new Error(`preview did not become ready at ${url}`)
}

if (!slug) {
  console.error('VERIFY FAIL: provide a registered presentation slug: npm run verify -- <slug>')
  process.exitCode = 1
} else {
  let preview
  let browser
  try {
    await run('npm', ['run', 'build'])
    preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', port], { stdio: 'ignore' })
    const url = `http://${host}:${port}/${slug}`
    await ready(url)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    const errors = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(url, { waitUntil: 'networkidle' })
    const root = page.locator('[data-presentation-root]')
    if (await root.count() !== 1) throw new Error(`route /${slug} did not render a presentation`)
    if (await root.getAttribute('data-step-index') !== '0') throw new Error('first step did not render')
    if (errors.length) throw new Error(`browser errors: ${errors.join('; ')}`)
    console.log(`VERIFY PASS: /${slug} built and rendered its first step`)
  } catch (error) {
    console.error(`VERIFY FAIL: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  } finally {
    await browser?.close()
    preview?.kill('SIGTERM')
  }
}
