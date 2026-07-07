import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VITE_BIN = join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite')
const OUT_ROOT = join(ROOT, 'artifacts', 'presentation-inspection')

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = { slug: '', width: 1440, height: 900 }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--width') opts.width = Number(args[++i])
    else if (arg === '--height') opts.height = Number(args[++i])
    else if (arg === '--slug' || arg === '--route') opts.slug = normalizeSlug(args[++i] ?? '')
    else if (!arg.startsWith('--') && !opts.slug) opts.slug = normalizeSlug(arg)
  }
  if (!Number.isFinite(opts.width) || opts.width < 320) throw new Error(`invalid width: ${opts.width}`)
  if (!Number.isFinite(opts.height) || opts.height < 320) throw new Error(`invalid height: ${opts.height}`)
  return opts
}

function normalizeSlug(value) {
  return value.replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '').replace(/\/$/, '')
}

function runBuild() {
  return new Promise((resolve, reject) => {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    const child = spawn(npm, ['run', 'build'], { cwd: ROOT, stdio: 'inherit', shell: false })
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`build exited ${code}`))))
    child.on('error', reject)
  })
}

async function readRegistry() {
  const registryUrl = pathToFileURL(join(ROOT, 'src/presentations/index.ts')).href
  const mod = await import(registryUrl)
  if (!Array.isArray(mod.presentations)) {
    throw new Error('src/presentations/index.ts does not export a `presentations` array')
  }
  return mod.presentations
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address()
      const port = typeof addr === 'object' && addr ? addr.port : 0
      srv.close((err) => (err ? reject(err) : resolve(port)))
    })
    srv.on('error', reject)
  })
}

function childExited(child) {
  return child.exitCode !== null || child.signalCode !== null
}

async function waitForPreview(port, child, deadlineMs = 30_000) {
  const started = Date.now()
  while (Date.now() - started < deadlineMs) {
    if (childExited(child)) throw new Error(`vite preview exited before ready (code ${child.exitCode})`)
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`)
      const html = await res.text()
      if (res.ok && html.includes('id="root"')) return
    } catch {
      // server not listening yet
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error('vite preview did not become ready within 30s')
}

function stopPreview(child) {
  return new Promise((resolve) => {
    if (!child.pid) {
      resolve()
      return
    }
    child.once('close', () => resolve())
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      child.kill('SIGTERM')
    }
    setTimeout(() => {
      if (!childExited(child)) {
        try {
          process.kill(-child.pid, 'SIGKILL')
        } catch {
          child.kill('SIGKILL')
        }
      }
      resolve()
    }, 3000)
  })
}

function startPreview(port) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      VITE_BIN,
      ['preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
      { cwd: ROOT, stdio: 'ignore', detached: true },
    )
    child.unref()
    child.on('error', reject)
    waitForPreview(port, child)
      .then(() => resolve({ child, port }))
      .catch(async (err) => {
        await stopPreview(child)
        reject(err)
      })
  })
}

async function capturePresentation(page, port, slug, width, height) {
  const outDir = join(OUT_ROOT, slug)
  await mkdir(outDir, { recursive: true })
  await page.setViewportSize({ width, height })
  await page.goto(`http://127.0.0.1:${port}/${slug}`, { waitUntil: 'load', timeout: 30_000 })

  const progress = page.locator('[data-testid="step-progress"]')
  await progress.waitFor({ timeout: 10_000 })
  const stepCount = Number(await progress.getAttribute('data-step-count'))
  if (!Number.isFinite(stepCount) || stepCount < 1) {
    throw new Error(`${slug}: invalid data-step-count: ${stepCount}`)
  }

  const written = []
  for (let i = 0; i < stepCount; i++) {
    const expectedIndex = Number(await progress.getAttribute('data-step-index'))
    if (expectedIndex !== i) throw new Error(`${slug} step ${i}: expected index ${i}, got ${expectedIndex}`)

    const path = join(outDir, `step-${String(i + 1).padStart(2, '0')}.png`)
    await page.screenshot({ path, fullPage: false })
    written.push(path)

    if (i < stepCount - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(
        (expected) => {
          const el = document.querySelector('[data-testid="step-progress"]')
          return el && Number(el.getAttribute('data-step-index')) === expected
        },
        i + 1,
        { timeout: 5000 },
      )
    }
  }
  return written
}

async function main() {
  const opts = parseArgs()
  await runBuild()

  const presentations = await readRegistry()
  const selected = opts.slug ? presentations.filter((entry) => entry.slug === opts.slug) : presentations
  if (selected.length === 0) {
    throw new Error(opts.slug ? `presentation not found: ${opts.slug}` : 'no presentations registered')
  }

  const port = await getFreePort()
  const { child } = await startPreview(port)
  let browser
  try {
    browser = await chromium.launch()
    const page = await browser.newPage()
    for (const { slug } of selected) {
      const written = await capturePresentation(page, port, slug, opts.width, opts.height)
      console.log(`INSPECT: ${slug} (${written.length} screenshot${written.length === 1 ? '' : 's'})`)
      for (const path of written) console.log(path)
    }
  } finally {
    await browser?.close()
    await stopPreview(child)
  }
}

main().catch((err) => {
  console.error(`FAIL [inspect]: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
