import { spawn } from 'node:child_process'
import { request } from 'node:http'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
if (!pkg.scripts?.build) throw new Error('verify: missing build script')
const build = spawn('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
const status = await new Promise((resolve) => build.on('close', resolve))
if (status !== 0) process.exit(status ?? 1)
const preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', shell: process.platform === 'win32' })
try {
  await new Promise((resolve, reject) => { const deadline = setTimeout(() => reject(new Error('verify: preview did not start')), 15_000); const poll = () => request('http://127.0.0.1:4173/starter', (res) => { clearTimeout(deadline); res.resume(); resolve() }).on('error', () => setTimeout(poll, 100)).end(); poll() })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('http://127.0.0.1:4173/starter', { waitUntil: 'networkidle' })
  await page.locator('[data-presentation]').waitFor()
  if (errors.length) throw new Error(`verify: browser errors on starter: ${errors.join('; ')}`)
  await browser.close()
  console.log('verify: build, browser render, and starter route passed')
} finally { preview.kill('SIGTERM') }
