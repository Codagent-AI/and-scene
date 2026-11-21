import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

export const previewHost = '127.0.0.1'

export async function buildProject() {
  const build = spawn('npm', ['run', 'build'], { stdio: 'inherit' })
  const [status, signal] = await once(build, 'exit')
  if (status !== 0) {
    throw new Error(`npm run build exited with ${status ?? signal}`)
  }
}

async function getAvailablePort() {
  const socket = createServer()
  socket.listen(0, previewHost)
  await once(socket, 'listening')
  const { port } = socket.address()
  await new Promise((resolve, reject) => {
    socket.close((error) => error ? reject(error) : resolve())
  })
  return port
}

async function waitForPreview(server, url) {
  const started = Date.now()
  while (Date.now() - started < 10_000) {
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(`Vite preview stopped with ${server.exitCode ?? server.signalCode}`)
    }

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(500) })
      const ready = response.ok
      await response.body?.cancel()
      if (ready) return
    } catch {
      // Vite may still be starting.
    }

    await delay(100)
  }

  throw new Error(`Vite preview did not become ready at ${url}`)
}

async function stopPreview(server) {
  if (!server.pid || server.exitCode !== null || server.signalCode !== null) return

  const closed = once(server, 'exit')
  server.kill()
  const forceKill = setTimeout(() => server.kill('SIGKILL'), 2_000)
  try {
    await closed
  } finally {
    clearTimeout(forceKill)
  }
}

export async function withProductionPreview(run) {
  const port = await getAvailablePort()
  const url = `http://${previewHost}:${port}/`
  const vite = fileURLToPath(new URL('bin/vite.js', import.meta.resolve('vite/package.json')))
  const preview = spawn(process.execPath, [
    vite, 'preview', '--host', previewHost, '--port', String(port), '--strictPort',
  ], { stdio: ['ignore', 'ignore', 'inherit'] })
  try {
    await once(preview, 'spawn')
    await waitForPreview(preview, url)
    console.log(`Production preview ready at ${url}`)
    const browser = await chromium.launch()
    try {
      return await run(browser, url)
    } finally {
      await browser.close()
    }
  } finally {
    await stopPreview(preview)
  }
}
