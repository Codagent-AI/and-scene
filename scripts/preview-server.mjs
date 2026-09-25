import { spawn } from 'node:child_process'

export async function startPreview(port) {
  const expectedUrl = `http://127.0.0.1:${port}/`
  const child = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1',
    '--port', String(port), '--strictPort',
  ], { stdio: ['ignore', 'pipe', 'pipe'] })

  let output = ''
  const append = (chunk) => { output += chunk.toString() }
  child.stderr.on('data', append)

  const stop = async () => {
    if (child.exitCode !== null || child.signalCode !== null) return
    const exited = new Promise((resolve) => child.once('exit', resolve))
    child.kill('SIGTERM')
    let timeoutId
    const timedOut = await Promise.race([exited.then(() => false), new Promise((resolve) => { timeoutId = setTimeout(() => resolve(true), 3000) })])
    clearTimeout(timeoutId)
    if (timedOut) {
      child.kill('SIGKILL')
      await exited
    }
  }

  try {
    await new Promise((resolve, reject) => {
      let settled = false
      const fail = (error) => { if (!settled) { settled = true; reject(error) } }
      child.once('error', fail)
      child.once('exit', (code, signal) => fail(new Error(`Preview exited before startup (code ${code}, signal ${signal}): ${output}`)))
      child.stdout.on('data', (chunk) => {
        append(chunk)
        if (!settled && output.includes(expectedUrl)) { settled = true; resolve() }
      })
    })
    if (child.exitCode !== null || child.signalCode !== null) throw new Error(`Preview exited during startup: ${output}`)
    const response = await fetch(expectedUrl)
    if (!response.ok) throw new Error(`Preview at ${expectedUrl} returned HTTP ${response.status}`)
    return { child, stop }
  } catch (error) {
    await stop()
    throw error
  }
}
