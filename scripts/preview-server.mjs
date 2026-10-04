import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'

const host = '127.0.0.1'

export async function findFreePort() {
  const requestedPort = Number(process.env.PREVIEW_PORT ?? 0)
  if (!Number.isInteger(requestedPort) || requestedPort < 0 || requestedPort > 65535) {
    throw new Error(`Invalid PREVIEW_PORT value: ${process.env.PREVIEW_PORT}`)
  }
  const server = createServer()
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(requestedPort, host, resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Could not allocate an IPv4 preview port')
  const { port } = address
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  return port
}

export async function startPreview() {
  const port = await findFreePort()
  const url = `http://${host}:${port}`
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
  let exited = false
  child.once('exit', () => { exited = true })
  await new Promise((resolve, reject) => {
    child.once('spawn', resolve)
    child.once('error', reject)
  })

  async function waitForPreview() {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (exited || child.exitCode !== null) {
        throw new Error(`Preview process exited before becoming ready at ${url}`)
      }
      try {
        const response = await fetch(url)
        if (response.ok) {
          // Let an immediate strict-port collision deliver its exit event before
          // accepting readiness from any unrelated server on the selected port.
          await delay(0)
          if (!exited && child.exitCode === null) return url
          throw new Error(`Preview process exited before becoming ready at ${url}`)
        }
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('Preview process exited')) throw error
      }
      await delay(200)
    }
    throw new Error(`Preview process did not become ready at ${url}`)
  }

  async function stop() {
    if (exited || child.exitCode !== null) return
    child.kill('SIGTERM')
    await Promise.race([
      new Promise(resolve => child.once('exit', resolve)),
      delay(3000),
    ])
  }

  return { child, url, waitForPreview, stop }
}
