import { spawn } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'

export const HOST = '127.0.0.1'

export function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

export function runBuild(root) {
  return new Promise((resolve) => {
    const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', (err) => resolve({ code: 1, output: String(err) }))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

async function waitReady(url, child, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`preview server exited with code ${child.exitCode}`)
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error(`preview server not ready at ${url}`)
}

/** Starts `vite preview` bound to 127.0.0.1 and resolves once it answers on the same address. */
export async function startPreview(root, port = 0) {
  const chosen = port || (await freePort())
  const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(
    process.execPath,
    [vite, 'preview', '--host', HOST, '--port', String(chosen), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] },
  )
  let stderr = ''
  child.stderr.on('data', (d) => (stderr += d))
  const stop = () =>
    new Promise((resolve) => {
      if (child.exitCode !== null) return resolve()
      child.once('close', () => resolve())
      child.kill('SIGTERM')
    })
  const killNow = () => child.kill('SIGKILL')
  process.once('exit', killNow)
  const url = `http://${HOST}:${chosen}`
  try {
    await waitReady(`${url}/`, child)
  } catch (err) {
    await stop()
    throw new Error(`${err.message}${stderr ? `\n${stderr}` : ''}`)
  }
  return {
    url,
    port: chosen,
    async stop() {
      process.removeListener('exit', killNow)
      await stop()
    },
  }
}

const MISSING_BROWSER = /Executable doesn't exist|npx playwright install/i

/** Downloads the Chromium build that the project's Playwright drives. */
export function installChromium(root) {
  return new Promise((resolve) => {
    console.error('[browser] Chromium is missing; running "npx playwright install chromium"')
    const child = spawn('npx', ['playwright', 'install', 'chromium'], { cwd: root, stdio: ['ignore', 2, 2] })
    child.on('error', () => resolve(false))
    child.on('close', (code) => resolve(code === 0))
  })
}

/**
 * Launches Chromium. When Playwright is installed but its browser is not, installs it once and
 * retries, so a fresh checkout verifies without a manual setup step. A failed download is reported
 * with the command to run by hand.
 */
export async function launchChromium({ root = process.cwd(), load = () => import('playwright'), install = installChromium } = {}) {
  const launch = async () => (await load()).chromium.launch()
  try {
    return await launch()
  } catch (err) {
    if (!MISSING_BROWSER.test(String(err?.message))) throw err
    if (!(await install(root))) {
      throw new Error('Chromium is not installed for Playwright and the automatic install failed; run "npx playwright install chromium" and retry')
    }
    try {
      return await launch()
    } catch (retryErr) {
      if (!MISSING_BROWSER.test(String(retryErr?.message))) throw retryErr
      throw new Error('Chromium is still unavailable after "npx playwright install chromium"; check the Playwright browser path and retry')
    }
  }
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
