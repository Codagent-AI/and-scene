/**
 * Build, preview, and registry helpers shared by `verify.mjs` and
 * `inspect-presentation.mjs`.
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer, preview } from 'vite'

export const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
export const HOST = '127.0.0.1'

export function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', cwd: ROOT, ...options })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
    child.on('error', reject)
  })
}

/**
 * Starts a preview server this process exclusively owns, on an OS-assigned
 * port (`port: 0`), so a stale server left on a fixed port by another run
 * can never be mistaken for the build just produced.
 */
export async function startOwnedPreview() {
  const server = await preview({
    root: ROOT,
    logLevel: 'silent',
    preview: { host: HOST, port: 0, strictPort: false },
  })
  const address = server.httpServer.address()
  if (!address || typeof address !== 'object') {
    throw new Error('Preview server did not report a bound port')
  }
  return { server, baseUrl: `http://${HOST}:${address.port}` }
}

/** Closes the underlying HTTP server directly, not via PreviewServer.close(). */
export function closePreviewServer(server) {
  return new Promise((resolve, reject) => {
    server.httpServer.close((error) => (error ? reject(error) : resolve()))
  })
}

/**
 * Reads the registered presentation slugs by loading the actual exported
 * `presentations` registry through Vite's SSR module loader, rather than
 * regex-matching the source text — a registry entry built from a variable or
 * shorthand (e.g. `const slug = 'x'; { slug, ... }`) has no `slug: '...'`
 * text for a regex to match, so it would silently go unchecked.
 */
export async function readRegisteredSlugs() {
  const loader = await createServer({ root: ROOT, server: { middlewareMode: true }, logLevel: 'silent' })
  try {
    const { presentations } = await loader.ssrLoadModule('/src/presentations/index.ts')
    return presentations.map((entry) => entry.slug)
  } finally {
    await loader.close()
  }
}
