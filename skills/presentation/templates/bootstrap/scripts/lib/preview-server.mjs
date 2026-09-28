import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const PROJECT_ROOT = path.resolve(__dirname, '..', '..')

/** Finds a free TCP port on 127.0.0.1 for the preview server to bind to. */
export function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
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
 * Extracts registered { slug, title } entries from presentations/index.ts
 * without compiling it. Each array element is matched as a flat `{ ... }`
 * object (registry entries do not nest braces); `slug`/`title` are read
 * order-independently within that block so field order in the source
 * doesn't matter. A `load:` entry with no recognizable slug/title throws
 * rather than being silently dropped, so an unsupported entry shape (a
 * shorthand property, a template literal, a spread) fails loudly instead of
 * letting verification report PASS having skipped a registered route.
 */
export async function readRegistrySlugs() {
  const indexPath = path.join(PROJECT_ROOT, 'src', 'presentations', 'index.ts')
  const source = await readFile(indexPath, 'utf8')

  const arrayMatch = source.match(/presentations\s*:\s*PresentationRegistryEntry\[\]\s*=\s*\[([\s\S]*)\]/)
  if (!arrayMatch) {
    throw new Error(`Could not locate the "presentations" registry array in ${indexPath}`)
  }

  const blockPattern = /\{[^{}]*\}/g
  const entries = []
  for (const [block] of arrayMatch[1].matchAll(blockPattern)) {
    if (!/load\s*:/.test(block)) continue // not a registry entry (e.g. a stray object literal)

    const slugMatch = block.match(/slug\s*:\s*['"]([^'"]+)['"]/)
    const titleMatch = block.match(/title\s*:\s*['"]([^'"]+)['"]/)
    if (!slugMatch || !titleMatch) {
      throw new Error(
        `Unsupported registry entry syntax (expected literal "slug"/"title" strings, in either order):\n${block}`,
      )
    }
    entries.push({ slug: slugMatch[1], title: titleMatch[1] })
  }

  return entries
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
