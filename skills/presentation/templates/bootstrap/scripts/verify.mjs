import { createServer } from 'node:net'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const host = '127.0.0.1'

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`)))
  })
}

function availablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, host, () => {
      const address = server.address()
      server.close((error) => error ? reject(error) : resolve(address.port))
    })
  })
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // The preview process is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`preview did not become ready at ${url}`)
}

function stopProcess(child) {
  if (!child.pid || child.exitCode !== null) return
  try {
    process.kill(process.platform === 'win32' ? child.pid : -child.pid, 'SIGTERM')
  } catch {
    child.kill()
  }
}

async function main() {
  await run('npm', ['run', 'build'])

  const port = await availablePort()
  const origin = `http://${host}:${port}`
  const preview = spawn(
    'npm',
    ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'],
    { stdio: 'inherit', shell: process.platform === 'win32', detached: process.platform !== 'win32' },
  )
  let browser

  try {
    await waitFor(origin)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    const errors = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console error: ${message.text()}`)
    })
    page.on('pageerror', (error) => errors.push(`page error: ${error.message}`))

    const requestedSlug = process.argv[2]
    await page.goto(origin, { waitUntil: 'networkidle' })
    if (requestedSlug) {
      await page.goto(`${origin}/${requestedSlug}`, { waitUntil: 'networkidle' })
    } else {
      const firstRoute = page.locator('a[href^="/"]').first()
      if (await firstRoute.count()) await page.goto(`${origin}${await firstRoute.getAttribute('href')}`, { waitUntil: 'networkidle' })
    }

    const presentation = page.locator('[data-presentation]')
    if (await presentation.count() === 0) {
      if (requestedSlug) throw new Error(`route /${requestedSlug} did not render a presentation`)
      console.log('verify: PASS (build and landing route)')
      return
    }

    const chrome = page.locator('[data-step-count][data-step-index]')
    const count = Number(await chrome.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error('presentation has no inspectable steps')

    for (let index = 0; index < count; index += 1) {
      const observed = Number(await chrome.getAttribute('data-step-index'))
      if (observed !== index) throw new Error(`step ${index + 1}: expected index ${index}, got ${observed}`)
      if (errors.length) throw new Error(`step ${index + 1}: ${errors.join('; ')}`)
      if (index < count - 1) {
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(750)
        const nextIndex = Number(await chrome.getAttribute('data-step-index'))
        if (nextIndex !== index + 1) throw new Error(`step ${index + 1}: transition stopped at ${nextIndex}`)
      }
    }
    if (errors.length) throw new Error(`step ${count}: ${errors.join('; ')}`)
    console.log(`verify: PASS (${count} steps on ${host})`)
  } finally {
    await browser?.close()
    stopProcess(preview)
  }
}

try {
  await main()
} catch (error) {
  console.error(`verify: FAIL ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
