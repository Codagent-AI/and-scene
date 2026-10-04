import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
const source = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
const slugs = [...source.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])

const route = process.argv[2] ?? slugs[0]
if (!route || !slugs.includes(route)) { console.error(`FAIL: unknown route "${route ?? ''}"`); process.exit(1) }
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const build = spawn(npm, ['run', 'build'], { stdio: 'inherit' })
const buildCode = await new Promise((resolve) => build.on('exit', (code) => resolve(code ?? 1)))
if (buildCode !== 0) { console.error('FAIL: build'); process.exit(buildCode) }
const port = 4178, base = `http://127.0.0.1:${port}`
const server = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser
try {
  let ready = false
  for (let i = 0; i < 80; i++) { try { if ((await fetch(base)).ok) { ready = true; break } } catch {}; await delay(250) }
  if (!ready) throw new Error('preview did not become ready at 127.0.0.1')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage(), errors = []
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${base}/${route}`, { waitUntil: 'networkidle' })
  await page.locator('[data-presentation-stage]').waitFor()
  if (errors.length) throw new Error(errors.join('; '))
  console.log(`PASS: build and first-step render for /${route}`)
} catch (error) { console.error(`FAIL: render /${route}: ${error.message}`); process.exitCode = 1 }
finally {
  await browser?.close()
  server.kill('SIGTERM')
  await new Promise((resolve) => server.once('exit', resolve))
}
