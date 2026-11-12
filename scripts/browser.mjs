/* global document */
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

export const HOST = '127.0.0.1'
export const SETTLE_MS = 1000
export const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

export async function command(command, args, cwd, timeout = 120_000) {
  const child = spawn(command, args, { cwd, stdio: 'pipe' })
  let output = ''
  child.stdout.on('data', (chunk) => { output += chunk; process.stdout.write(chunk) })
  child.stderr.on('data', (chunk) => { output += chunk; process.stderr.write(chunk) })
  const timer = setTimeout(() => child.kill('SIGKILL'), timeout)
  try {
    const [code, signal] = await once(child, 'exit')
    if (code !== 0) throw new Error(`${command} ${args.join(' ')} failed (${signal ?? code})\n${output}`)
    return output
  } finally { clearTimeout(timer) }
}

async function freePort() {
  const socket = createServer()
  socket.listen(0, HOST)
  await once(socket, 'listening')
  const port = socket.address().port
  await new Promise((done) => socket.close(done))
  return port
}

export async function withBrowser(root, action) {
  const port = await freePort()
  const baseURL = `http://${HOST}:${port}`
  const preview = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { cwd: root, stdio: 'pipe' })
  let previewOutput = ''
  preview.stdout.on('data', (chunk) => { previewOutput += chunk })
  preview.stderr.on('data', (chunk) => { previewOutput += chunk })
  let browser
  const stop = async () => {
    await browser?.close()
    if (preview.exitCode === null && preview.signalCode === null) {
      const exited = once(preview, 'exit')
      preview.kill('SIGTERM')
      await exited
    }
  }
  const interrupt = () => { void stop().finally(() => process.exit(130)) }
  process.once('SIGINT', interrupt)
  process.once('SIGTERM', interrupt)
  try {
    let ready = false
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (preview.exitCode !== null) throw new Error(`preview exited: ${previewOutput}`)
      try { ready = (await fetch(baseURL)).ok } catch { /* readiness retry */ }
      if (ready) break
      await sleep(100)
    }
    if (!ready) throw new Error(`preview readiness failed at ${baseURL}: ${previewOutput}`)
    console.log(`Preview host=${HOST}; readiness=${baseURL}; browser=${baseURL}`)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
    return await action(page, baseURL)
  } finally {
    process.removeListener('SIGINT', interrupt)
    process.removeListener('SIGTERM', interrupt)
    await stop()
    console.log(`Preview stopped ${baseURL}`)
  }
}

export async function readStepCount(page) {
  const host = page.locator('[data-step-count][data-step-index]')
  await host.waitFor({ timeout: 5000 })
  const count = Number(await host.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('invalid data-step-count')
  return count
}

export async function waitForStep(page, index) {
  await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index, { timeout: 5000 })
}
