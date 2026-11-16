import { readFile, writeFile } from 'node:fs/promises'
const path = new URL('../openspec/changes/create-and-scene/checklist.md', import.meta.url)
const [ids, code, evidence, status = 'verified'] = process.argv.slice(2)
if (!ids || !code || !evidence || !['verified', 'failed', 'not verified'].includes(status)) throw new Error('IDs, code, evidence, status required')
const selected = ids.split(',')
const lines = (await readFile(path, 'utf8')).split('\n').map(line => {
  const parts = line.split('|')
  if (!selected.includes(parts[1]?.trim())) return line
  if (parts.length !== 9) throw new Error('Unexpected checklist table shape')
  parts[5] = ` ${code} `; parts[6] = ` ${evidence} `; parts[7] = ` ${status} `
  return parts.join('|')
})
await writeFile(path, lines.join('\n'))
