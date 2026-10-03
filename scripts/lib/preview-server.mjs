import { spawn, spawnSync } from 'node:child_process'
import { createServer as createNetServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { build as viteBuild } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const PROJECT_ROOT = path.resolve(__dirname, '..', '..')

/** Runs `npm run build` in the project, streaming its output; returns whether it succeeded. */
export function runProjectBuild() {
  return spawnSync('npm', ['run', 'build'], { cwd: PROJECT_ROOT, stdio: 'inherit' }).status === 0
}

/**
 * Opens a registered presentation route and waits for its chrome, returning
 * the root locator and its validated `data-step-count`.
 */
export async function openPresentation(page, baseUrl, slug) {
  await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation-root]')
  await root.waitFor({ state: 'visible', timeout: 10_000 })
  const rawStepCount = await root.getAttribute('data-step-count')
  const stepCount = Number(rawStepCount)
  if (!Number.isSafeInteger(stepCount) || stepCount < 1) {
    throw new Error(`invalid data-step-count for "${slug}": ${rawStepCount}`)
  }
  return { root, stepCount }
}

/** Presses ArrowRight and waits for `data-step-index` to become `index`. */
export async function advanceToStep(page, index) {
  await page.keyboard.press('ArrowRight')
  await page.waitForFunction(
    (expected) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(expected),
    index,
    { timeout: 5_000 },
  )
}

/** Finds a free TCP port on 127.0.0.1 for the preview server to bind to. */
export function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createNetServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : null
      server.close(() => {
        if (port) resolve(port)
        else reject(new Error('Could not allocate a free port'))
      })
    })
  })
}

/**
 * Reads the registered { slug, title } entries by actually bundling
 * `src/presentations/index.ts` through Vite's production build pipeline
 * (in memory, `write: false`) and evaluating the result, rather than
 * pattern-matching its source. This handles every valid registry entry shape
 * (shorthand properties, computed values, spread, helper functions building
 * the array, etc.) the same way the real app would.
 *
 * A production build — not a dev server — matters here: `import.meta.env.PROD`
 * is only `true` under a production build/mode, so a registry entry gated on
 * it (a production-only presentation) would silently vanish if this were
 * evaluated through a dev-mode SSR module runner instead.
 */
export async function readRegistrySlugs() {
  const result = await viteBuild({
    root: PROJECT_ROOT,
    logLevel: 'silent',
    build: {
      ssr: true,
      write: false,
      minify: false,
      target: 'esnext',
      rollupOptions: {
        input: path.join(PROJECT_ROOT, 'src', 'presentations', 'index.ts'),
        output: { format: 'es' },
      },
    },
  })

  const output = (Array.isArray(result) ? result[0] : result).output
  const entryChunk = output.find((item) => item.type === 'chunk' && item.isEntry)
  if (!entryChunk) {
    throw new Error('Failed to bundle src/presentations/index.ts for registry inspection')
  }

  const moduleUrl = `data:text/javascript;base64,${Buffer.from(entryChunk.code, 'utf8').toString('base64')}`
  const mod = await import(moduleUrl)
  const presentations = mod.presentations
  if (!Array.isArray(presentations)) {
    throw new Error('src/presentations/index.ts must export a "presentations" array')
  }

  return presentations.map(({ slug, title }, index) => {
    if (typeof slug !== 'string' || typeof title !== 'string') {
      throw new Error(`presentations[${index}] must have string "slug" and "title" fields, got: ${JSON.stringify({ slug, title })}`)
    }
    return { slug, title }
  })
}

async function waitForReady(url, timeoutMs = 30_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok || response.status === 404) return
    } catch {
      // server not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Timed out waiting for preview server at ${url}`)
}

/**
 * Starts `vite preview` bound to 127.0.0.1 on a free port and waits until it
 * responds. Runs the local `vite` binary directly (not through `npx`) and in
 * its own process group, so `stop()` can reliably kill the whole tree —
 * `npx`-wrapped children otherwise can outlive a signal sent to the wrapper.
 */
export async function startPreviewServer() {
  const port = await getFreePort()
  const host = '127.0.0.1'
  const viteBin = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'vite')
  const child = spawn(viteBin, ['preview', '--host', host, '--port', String(port), '--strictPort'], {
    cwd: PROJECT_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })

  let output = ''
  child.stdout?.on('data', (chunk) => {
    output += chunk.toString()
  })
  child.stderr?.on('data', (chunk) => {
    output += chunk.toString()
  })

  const baseUrl = `http://${host}:${port}`

  function stop() {
    return new Promise((resolve) => {
      if (child.exitCode !== null || child.pid === undefined) {
        resolve()
        return
      }
      child.once('exit', () => resolve())
      try {
        process.kill(-child.pid, 'SIGTERM')
      } catch {
        child.kill('SIGTERM')
      }
    })
  }

  try {
    await waitForReady(baseUrl)
  } catch (error) {
    await stop()
    throw new Error(`${error.message}\n${output}`)
  }

  return { baseUrl, stop }
}
