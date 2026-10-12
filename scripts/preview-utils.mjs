import { spawn } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

export const rootPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const LOOPBACK = '127.0.0.1'
export async function freePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, LOOPBACK, () => { const { port } = server.address(); server.close(() => resolve(port)) })
  })
}
export async function startPreview({ port, onUrl = () => {} } = {}) {
  port ??= await freePort()
  const vite = path.join(rootPath, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(process.execPath, [vite, 'preview', '--host', LOOPBACK, '--port', String(port), '--strictPort'], { cwd: rootPath, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk })
  child.stderr.setEncoding('utf8').on('data', chunk => { output += chunk })
  const url = `http://${LOOPBACK}:${port}`
  onUrl(url)
  const deadline = Date.now() + 15000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`preview exited before readiness: ${output}`)
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) })
      if (response.ok) {
        if (child.exitCode !== null) throw new Error(`preview exited before readiness: ${output}`)
        return { child, url, output: () => output }
      }
    } catch (error) {
      if (child.exitCode !== null) throw new Error(`preview exited before readiness: ${output}`)
    }
    await delay(150)
  }
  child.kill('SIGTERM')
  throw new Error(`preview readiness timed out at ${url}: ${output}`)
}
export async function stopPreview(child) {
  if (!child || child.exitCode !== null) return
  child.kill('SIGTERM')
  await Promise.race([new Promise(resolve => child.once('exit', resolve)), delay(3000)])
  if (child.exitCode === null) child.kill('SIGKILL')
}
export function installSignalCleanup(getResources) {
  const cleanup = async signal => {
    const { child, browser } = getResources()
    await browser?.close().catch(() => {})
    await stopPreview(child)
    process.exit(signal === 'SIGINT' ? 130 : 143)
  }
  process.once('SIGINT', () => { void cleanup('SIGINT') })
  process.once('SIGTERM', () => { void cleanup('SIGTERM') })
}
export async function chromium() {
  const { chromium: browserType } = await import('playwright')
  try { return await browserType.launch({ headless: true }) }
  catch (error) { throw new Error(`Unable to launch Playwright Chromium. Install it with "npx playwright install chromium". ${error.message}`) }
}
export async function waitForStep(page, wanted, timeout = 2500) {
  await page.waitForFunction(index => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === index, wanted, { timeout })
}
