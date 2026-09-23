import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = Number(process.env.PORT || 4178)
const route = process.argv[2] || '/sample'
const server = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser

async function stopPreview() {
  if (server.exitCode !== null || server.signalCode !== null) return
  const exited = once(server, 'exit')
  server.kill('SIGTERM')
  await exited
}

async function waitForPreview() {
  const url = `http://${host}:${port}${route}`
  for (let i = 0; i < 80; i++) {
    if (server.exitCode !== null) throw new Error(`Preview exited with ${server.exitCode}`)
    try {
      if ((await fetch(url)).ok) {
        // Give Vite time to report a bind error before trusting a response from this port.
        await delay(100)
        if (server.exitCode !== null) throw new Error(`Preview exited with ${server.exitCode}`)
        return
      }
    } catch (error) {
      if (error.message.startsWith('Preview exited')) throw error
    }
    await delay(250)
  }
  throw new Error('Preview did not become ready')
}

try {
  await waitForPreview()
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`http://${host}:${port}${route}`, { waitUntil: 'networkidle' })
  await page.locator('[data-step-index]').waitFor()
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
  console.log(`PASS: ${route} rendered on ${host}`)
} catch (error) {
  console.error(`Render verification failed: ${error.message}`)
  process.exitCode = 1
} finally {
  try {
    await browser?.close()
  } finally {
    await stopPreview()
  }
}
