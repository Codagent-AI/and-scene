import { once } from 'node:events'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const HOST = '127.0.0.1'
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

export async function build(cwd) {
  const child = spawn(npm, ['run', 'build'], { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
  const [code, signal] = await once(child, 'exit')
  if (code !== 0) throw new Error(`Build failed (npm run build: ${signal ?? code})`)
}

async function availablePort() {
  const socket = createServer()
  socket.listen(0, HOST)
  await once(socket, 'listening')
  const { port } = socket.address()
  await new Promise((resolve, reject) => socket.close(error => error ? reject(error) : resolve()))
  return port
}

async function stop(child, exited) {
  if (child.exitCode !== null || child.signalCode !== null || !child.pid) return
  child.kill()
  const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
  try {
    await exited
  } finally {
    clearTimeout(timer)
  }
}

export async function withPreview(cwd, visit) {
  const port = await availablePort()
  const origin = `http://${HOST}:${port}`
  const child = spawn(process.execPath, [
    path.join(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', HOST,
    '--port', String(port), '--strictPort',
  ], { cwd, stdio: 'inherit' })
  const exited = once(child, 'exit').catch(error => [null, error.message])
  let browser
  try {
    for (let attempt = 0; ; attempt++) {
      const ready = await Promise.race([
        fetch(origin, { signal: AbortSignal.timeout(500) }).then(response => response.ok).catch(() => false),
        exited.then(([code, error]) => { throw new Error(`Preview exited: ${error ?? code}`) }),
      ])
      if (ready) break
      if (attempt >= 79) throw new Error(`Preview did not respond at ${origin}`)
      await delay(100)
    }

    console.log(`Preview ready at ${origin} (pid ${child.pid})`)
    const executablePath = process.env.AND_SCENE_HOST_CHROME
    const args = process.env.AND_SCENE_HOST_CHROME_ARGS?.split(/\s+/).filter(Boolean)
    browser = await chromium.launch({ executablePath, args })
    return await visit({ browser, origin })
  } finally {
    try {
      await browser?.close()
    } finally {
      await stop(child, exited)
    }
  }
}
