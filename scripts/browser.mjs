import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
export const root = fileURLToPath(new URL('../', import.meta.url))
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
export function command(program, args, cwd = root) {
  return new Promise((resolve, reject) => {
    const child = spawn(program, args, { cwd, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${program} ${args.join(' ')} exited ${code}`)))
  })
}
async function freePort() {
  const server = createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const port = server.address().port
  await new Promise(resolve => server.close(resolve))
  return port
}
export async function withPreview(run) {
  const port = await freePort()
  const url = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  let launchError
  child.once('error', error => { launchError = error })
  child.stderr.on('data', data => process.stderr.write(data))
  console.log(`preview ${url} pid=${child.pid}`)
  let browser
  try {
    let ready = false
    for (let attempt = 0; attempt < 100; attempt++) {
      if (launchError) throw launchError
      if (child.exitCode !== null) throw new Error('Preview exited before readiness')
      try { ready = (await fetch(url)).ok } catch { /* retry until bounded timeout */ }
      if (ready) break
      await sleep(100)
    }
    if (!ready) throw new Error(`Preview readiness failed: ${url}`)
    browser = await chromium.launch({ headless: true })
    return await run(browser, url)
  } finally {
    try { await browser?.close() } finally {
      if (child.exitCode === null) {
        const exited = once(child, 'exit')
        child.kill('SIGTERM')
        const timer = setTimeout(() => child.kill('SIGKILL'), 2000)
        await exited
        clearTimeout(timer)
      }
      console.log(`preview stopped pid=${child.pid}`)
    }
  }
}
export async function traverse(page, url, slug, visit, { settle = 900, firstOnly = false } = {}) {
  let current = 0
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(`step ${current}: console ${message.text()}`) })
  page.on('pageerror', error => errors.push(`step ${current}: page ${error.message}`))
  const assertClean = () => { if (errors.length) throw new Error(errors.join('\n')) }
  try {
    await page.goto(`${url}/${slug}`, { waitUntil: 'networkidle' })
    const host = page.locator('[data-presentation]')
    await host.waitFor({ timeout: 5000 })
    const count = Number(await host.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error('Invalid data-step-count')
    for (current = 0; current < (firstOnly ? 1 : count); current++) {
      if (current) await page.keyboard.press('ArrowRight')
      try { await page.waitForFunction(i => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(i), current, { timeout: 3000 }) }
      catch { throw new Error(`step ${current}: transition did not advance data-step-index`) }
      await page.waitForTimeout(settle)
      assertClean()
      await visit({ page, index: current, count, host })
      assertClean()
    }
    return count
  } catch (error) { throw new Error(`step ${current}: ${error.message}`) }
}
