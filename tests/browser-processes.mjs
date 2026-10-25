import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { setTimeout as delay } from 'node:timers/promises'
const exec = promisify(execFile)
async function processTable() {
  const { stdout } = await exec('ps', ['-eo', 'pid=,ppid=,stat=,comm='])
  return stdout.trim().split('\n').map(line => {
    const [pid, parent, state, name] = line.trim().split(/\s+/)
    return { pid: Number(pid), parent: Number(parent), state, name }
  })
}
// Observe the real CLI's Chromium descendants, rather than infer closure from log messages.
export function observeChromium(cliPid) {
  const observed = new Set()
  let pending = Promise.resolve()
  let sampling = false
  let failure
  const sample = () => {
    if (sampling) return
    sampling = true
    pending = processTable().then(table => {
      const descendants = new Set([cliPid])
      let changed = true
      while (changed) {
        changed = false
        for (const row of table) if (descendants.has(row.parent) && !descendants.has(row.pid)) { descendants.add(row.pid); changed = true }
      }
      for (const row of table) if (descendants.has(row.pid) && !row.state.startsWith('Z') && /chrome|chromium|headless/i.test(row.name)) observed.add(row.pid)
    }).catch(error => { failure = error }).finally(() => { sampling = false })
  }
  const timer = setInterval(sample, 80)
  sample()
  return async () => {
    clearInterval(timer)
    await pending
    if (failure) throw failure
    assert.ok(observed.size, 'the test must observe real Chromium processes before claiming cleanup')
    let remaining = []
    for (let attempt = 0; attempt < 30; attempt++) {
      // A zombie is already terminated; the shell/init owns reaping after its parent exits.
      remaining = (await processTable()).filter(row => observed.has(row.pid) && !row.state.startsWith('Z'))
      if (!remaining.length) break
      await delay(100)
    }
    assert.deepEqual(remaining, [], 'Chromium processes must terminate after the CLI exits')
    console.log(`Chromium cleanup asserted: ${observed.size} observed processes terminated (PIDs ${[...observed].join(', ')})`)
  }
}
