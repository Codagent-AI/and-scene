import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const host = '127.0.0.1'
const viteEntry = resolve(dirname(createRequire(import.meta.url).resolve('vite/package.json')), 'bin/vite.js')
export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export function buildApplication(root) {
  return new Promise((resolveBuild, reject) => {
    const child = spawn('npm', ['run', 'build'], {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
    child.once('error', reject)
    child.once('exit', (code) => {
      if (code === 0) resolveBuild()
      else reject(new Error(`npm run build exited ${code}`))
    })
  })
}

function availablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, host, () => {
      const { port } = server.address()
      server.close((error) => error ? reject(error) : resolvePort(port))
    })
  })
}

async function waitForPreview(origin) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(origin)).ok) return
    } catch { /* preview is starting */ }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100))
  }
  throw new Error(`preview did not become ready at ${origin}`)
}

export async function withPreview(root, inspect) {
  const port = await availablePort()
  const origin = `http://${host}:${port}`
  const preview = spawn(process.execPath, [viteEntry, 'preview', '--host', host, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: 'inherit',
  })
  try {
    await waitForPreview(origin)
    return await inspect(origin)
  } finally {
    preview.kill()
  }
}
