import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'

function processState(pid) {
  try {
    const stat = readFileSync(`/proc/${pid}/stat`, 'utf8')
    const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ')
    return { state: fields[0], started: fields[19] }
  } catch (error) {
    if (['ENOENT', 'ESRCH'].includes(error.code)) return null
    throw error
  }
}

// Observe the actual verifier process tree rather than trusting cleanup messages.
// Linux /proc is available in the production-browser test environment.
export function observeBrowserProcesses(pid) {
  const browsers = new Map()
  let samplingError
  function sample(parent) {
    try {
      const args = readFileSync(`/proc/${parent}/cmdline`, 'utf8').split('\0')
      const executable = args[0]
      if (/chrome|chromium|headless_shell/i.test(executable)) {
        const state = processState(parent)
        if (state) browsers.set(parent, { ...state, root: !args.some(arg => arg.startsWith('--type=')) })
      }
      const children = new Set()
      // Chromium can launch children from worker threads as well as its leader.
      for (const thread of readdirSync(`/proc/${parent}/task`)) {
        try {
          const ids = readFileSync(`/proc/${parent}/task/${thread}/children`, 'utf8').trim()
          for (const child of ids ? ids.split(/\s+/).map(Number) : []) children.add(child)
        } catch (error) { if (!['ENOENT', 'ESRCH'].includes(error.code)) throw error }
      }
      for (const child of children) sample(child)
    } catch (error) {
      if (!['ENOENT', 'ESRCH'].includes(error.code)) samplingError = error
    }
  }
  sample(pid)
  const timer = setInterval(() => sample(pid), 25)
  return async output => {
    clearInterval(timer)
    if (samplingError) throw samplingError
    const preview = output.match(/PREVIEW .* pid=(\d+)/)?.[1]
    const roots = [...browsers].filter(([, info]) => info.root).map(([pid]) => pid)
    if (preview) {
      assert.throws(() => process.kill(Number(preview), 0), /ESRCH/, 'Preview must exit on success and failure')
      assert.ok(roots.length, 'Must observe the launched Chromium browser process before asserting cleanup')
    }
    const live = () => [...browsers].filter(([pid, info]) => {
      const current = processState(pid)
      // A reaped root browser must be gone. A defunct descendant has no running
      // browser or open resources; its OS reaping belongs to the container init.
      return current?.started === info.started && (info.root || current.state !== 'Z')
    }).map(([pid]) => pid)
    for (let attempt = 0; attempt < 80 && live().length; attempt++) await delay(25)
    assert.deepEqual(live(), [], 'No root browser or live Chromium descendant may survive the verifier')
    for (const root of roots) assert.throws(() => process.kill(root, 0), /ESRCH/, 'The root browser process must be reaped')
    console.log(`RESOURCE CLEANUP verified: preview=${preview ?? 'not launched'}; browser roots=${roots.join(',') || 'not launched'}; observed Chromium processes=${browsers.size}; no live browser descendants`)
  }
}
