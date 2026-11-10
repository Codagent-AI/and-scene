import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

export const HOST = '127.0.0.1'
export const SETTLE_MS = 1500
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
export async function runBuild(cwd = process.cwd()) {
  await new Promise((resolveBuild, reject) => {
    const child = spawn('npm', ['run', 'build'], { cwd, stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', (code) =>
      code === 0
        ? resolveBuild()
        : reject(new Error(`build failed (exit ${code})`)),
    )
  })
}
async function freePort() {
  const server = createServer()
  await new Promise((resolveListen, reject) => {
    server.once('error', reject)
    server.listen(0, HOST, resolveListen)
  })
  const port = server.address().port
  await new Promise((resolveClose) => server.close(resolveClose))
  return port
}
export async function withPreview(cwd, callback) {
  const port = await freePort()
  const url = `http://${HOST}:${port}`
  const server = spawn(
    process.execPath,
    [
      resolve(cwd, 'node_modules/vite/bin/vite.js'),
      'preview',
      '--host',
      HOST,
      '--port',
      String(port),
      '--strictPort',
    ],
    { cwd, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let output = ''
  server.stdout.on('data', (data) => {
    output += data
  })
  server.stderr.on('data', (data) => {
    output += data
  })
  let browser
  let browserPid
  try {
    let ready = false
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw new Error(`preview exited: ${output}`)
      try {
        ready = (await fetch(url)).ok
      } catch {
        /* server is starting */
      }
      if (ready) break
      await sleep(100)
    }
    if (!ready) throw new Error(`preview readiness failed at ${url}: ${output}`)
    console.log(`preview ${url} pid=${server.pid}`)
    browser = await chromium.launch({ headless: true })
    const session = await browser.newBrowserCDPSession()
    const { processInfo } = await session.send('SystemInfo.getProcessInfo')
    browserPid = processInfo.find((process) => process.type === 'browser').id
    await session.detach()
    console.log(`browser started pid=${browserPid}`)
    return await callback(browser, url)
  } finally {
    await browser?.close()
    if (browserPid) console.log(`browser cleaned pid=${browserPid}`)
    if (server.exitCode === null) {
      const exited = new Promise((resolveExit) =>
        server.once('exit', resolveExit),
      )
      server.kill('SIGTERM')
      const killTimer = setTimeout(() => server.kill('SIGKILL'), 3000)
      await exited
      clearTimeout(killTimer)
    }
    console.log(`preview cleaned pid=${server.pid}`)
  }
}
export async function readStep(page) {
  const root = page.locator('[data-presentation-root]')
  await root.waitFor({ timeout: 5000 })
  return root.evaluate((element) => ({
    count: Number(element.getAttribute('data-step-count')),
    index: Number(element.getAttribute('data-step-index')),
    era: element.getAttribute('data-step-era'),
    id: element.getAttribute('data-step-id'),
    title: element.querySelector('[data-presentation-title]')?.textContent,
    caption: element.querySelector('[data-presentation-caption]')?.textContent,
  }))
}
export async function expectIndex(page, index) {
  try {
    await page.waitForFunction(
      (expected) =>
        document
          .querySelector('[data-presentation-root]')
          ?.getAttribute('data-step-index') === String(expected),
      index,
      { timeout: 3000 },
    )
  } catch {
    throw new Error(
      `transition failed at step ${index}: public index did not advance`,
    )
  }
}
