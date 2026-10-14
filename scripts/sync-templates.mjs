import { cp, mkdir, mkdtemp, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolve relative to this script so the command also works from another cwd.
const root = new URL('../', import.meta.url)
const snapshot = fileURLToPath(new URL('skills/presentation/templates/bootstrap/', root))
let staging
let retainBackups = false

try {
  await mkdir(snapshot, { recursive: true })
  staging = await mkdtemp(join(snapshot, '.sync-templates-'))
  const entries = [
    { destination: join(snapshot, 'src/presentation-kit'), next: join(staging, 'next-kit'), backup: join(staging, 'old-kit'), backedUp: false, installed: false },
    { destination: join(snapshot, 'scripts'), next: join(staging, 'next-scripts'), backup: join(staging, 'old-scripts'), backedUp: false, installed: false },
  ]
  // Finish every source copy before touching either committed snapshot.
  await cp(new URL('src/presentation-kit/', root), entries[0].next, { recursive: true })
  await mkdir(entries[1].next)
  for (const name of ['verify.mjs', 'inspect-presentation.mjs', 'browser-preview.mjs']) {
    await cp(new URL(`scripts/${name}`, root), join(entries[1].next, name))
  }
  await mkdir(join(snapshot, 'src'), { recursive: true })
  try {
    for (const entry of entries) {
      try {
        await rename(entry.destination, entry.backup)
        entry.backedUp = true
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
      await rename(entry.next, entry.destination)
      entry.installed = true
    }
  } catch (error) {
    for (const entry of [...entries].reverse()) {
      try {
        if (entry.installed) await rm(entry.destination, { recursive: true, force: true })
        if (entry.backedUp) await rename(entry.backup, entry.destination)
      } catch (restoreError) {
        retainBackups = true
        console.error(`Could not restore ${entry.destination}: ${restoreError.message}`)
      }
    }
    throw error
  }
  console.log('Synced canonical scene kit and browser drivers to bootstrap templates')
} catch (error) {
  console.error(`FAIL template synchronization: ${error.message}`)
  console.error(retainBackups ? `Recovery backups retained in ${staging}` : 'Previous snapshots preserved')
  process.exitCode = 1
} finally {
  if (staging && !retainBackups) {
    try { await rm(staging, { recursive: true, force: true }) }
    catch (error) {
      console.error(`Could not clean staging directory ${staging}: ${error.message}`)
      process.exitCode = 1
    }
  }
}
