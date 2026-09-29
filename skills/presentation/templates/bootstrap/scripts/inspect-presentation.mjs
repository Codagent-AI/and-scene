import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import net from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) {
  console.error('Usage: npm run inspect -- <presentation-slug>')
  process.exit(2)
}

const host = '127.0.0.1'
const port = await new Promise((resolve, reject) => {
  const server = net.createServer()
  server.once('error', reject)
  server.listen(0, host, () => {
    const address = server.address()
    server.close(error => error ? reject(error) : resolve(address.port))
  })
})
const baseUrl = `http://${host}:${port}`
const output = `.presentation-inspection/${slug}`
let preview
let browser

try {
  const build = spawn('npm', ['run', 'build'], { stdio: 'inherit' })
  const buildCode = await new Promise((resolve, reject) => {
    build.once('error', reject)
    build.once('exit', resolve)
  })
  if (buildCode !== 0) throw new Error(`Build failed with code ${buildCode}`)

  preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit', detached: true })
  let ready = false
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (preview.exitCode !== null) throw new Error(`Preview exited with code ${preview.exitCode}`)
    try {
      if ((await fetch(baseUrl)).ok) { ready = true; break }
    } catch {}
    await delay(250)
  }
  if (!ready) throw new Error(`Preview did not become ready at ${baseUrl}`)
  await mkdir(output, { recursive: true })
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'networkidle' })
  const presentation = page.locator('[data-step-count]').first()
  const total = Number(await presentation.getAttribute('data-step-count'))
  if (!Number.isInteger(total) || total < 1) throw new Error(`No presentation steps found at /${slug}`)
  for (let index = 0; index < total; index += 1) {
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${output}/step-${String(index + 1).padStart(2, '0')}.png`, fullPage: true })
    const active = page.locator('[data-presentation-progress-item][data-presentation-active="true"]')
    if (await active.count()) {
      const style = await active.first().evaluate(element => getComputedStyle(element).cssText + getComputedStyle(element).backgroundColor + getComputedStyle(element).outlineColor)
      if (!style || style.includes('rgba(0, 0, 0, 0)')) console.warn(`WARN step ${index}: inspect active progress styling`)
    }
    if (index < total - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(expected => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index + 1)
    }
  }
  const attribution = page.locator('[data-presentation-attribution]')
  if (!(await attribution.count())) console.warn('WARN: attribution is missing')
  else if ((await attribution.first().innerText()).trim() === '') console.warn('WARN: attribution has no visible text')
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
  console.log(`Screenshots saved under ${output}`)
} catch (error) {
  console.error(`Inspection failed: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview?.pid) {
    try { process.kill(-preview.pid, 'SIGTERM') } catch {}
  }
}
