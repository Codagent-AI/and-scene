import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const run = (cmd, args, cwd) => new Promise((resolve, reject) => {
  const child = spawn(cmd, args, { cwd, stdio: 'inherit' })
  child.on('error', reject)
  child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`)))
})
async function main() {
  const registryFile = path.join(root, 'src/presentations/index.ts')
  const registry = await fs.readFile(registryFile, 'utf8')
  const slugs = [...registry.matchAll(/slug\s*:\s*["']([^"']+)["']/g)].map((match) => match[1])
  if (!slugs.length) throw new Error('No presentations are registered. Add one with skills/presentation/scripts/new-presentation.mjs before running verify.')
  await run('npm', ['run', 'build'], root)
  const reservation = createServer()
  await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve))
  const port = reservation.address().port
  await new Promise((resolve) => reservation.close(resolve))
  const server = spawn('npm', ['exec', '--', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, detached: true, stdio: 'ignore' })
  let browser
  try {
    const base = `http://127.0.0.1:${port}/`
    let ready = false
    for (let tries = 0; tries < 100; tries += 1) {
      try { if ((await fetch(base)).ok) { ready = true; break } } catch { /* server starting */ }
      await sleep(100)
    }
    if (!ready) throw new Error(`Preview did not become ready at ${base}`)
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.CHROME_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.CHROME_PATH } : {}) })
    for (const slug of slugs) {
      const page = await browser.newPage()
      const errors = []
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(`${base}${slug}`, { waitUntil: 'networkidle' })
      const count = Number(await page.locator('[data-step-count]').first().getAttribute('data-step-count'))
      if (!Number.isInteger(count) || count < 1) throw new Error(`${slug}: first step did not render a valid data-step-count`)
      for (let step = 1; step < count; step += 1) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((index) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === index, step, { timeout: 5000 })
        if (errors.length) throw new Error(`${slug} step ${step + 1}: ${errors.join('; ')}`)
      }
      if (errors.length) throw new Error(`${slug}: ${errors.join('; ')}`)
      console.log(`[verify] ${slug}: rendered ${count} step(s)`)
      await page.close()
    }
    console.log('[verify] PASS')
  } finally {
    await browser?.close()
    if (server.pid) try { process.kill(-server.pid, 'SIGTERM') } catch { server.kill('SIGTERM') }
  }
}
main().catch((error) => { console.error(`[verify] FAIL ${error.stack || error.message}`); process.exitCode = 1 })
