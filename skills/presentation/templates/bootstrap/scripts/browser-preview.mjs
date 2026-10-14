import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'

export async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return
  const exited = once(child, 'exit')
  child.kill('SIGTERM')
  const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
  try { await exited } finally { clearTimeout(timer) }
}

export async function availablePort(requested = 0) {
  const server = createServer()
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(requested, '127.0.0.1', resolve) })
  const port = server.address().port
  await new Promise(resolve => server.close(resolve))
  return port
}

export function spawnPreview(port) {
  return spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NODE_ENV: 'production' } })
}

export async function waitForPreview(preview, origin) {
  let output = ''
  preview.stdout.on('data', data => { output += data })
  preview.stderr.on('data', data => { output += data })
  for (let attempt = 0; attempt < 100; attempt++) {
    if (preview.exitCode !== null) throw new Error(`Preview exited: ${output}`)
    let ready = false
    try { ready = (await fetch(origin, { signal: AbortSignal.timeout(500) })).ok } catch { /* not ready yet */ }
    if (ready) return
    await delay(150)
  }
  throw new Error(`Preview did not become ready: ${output}`)
}
