import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
export async function record(ids, code, evidence, status = 'verified') {
  if (!process.env.EVIDENCE_DIR) return
  const checklist = resolve(import.meta.dirname, '../openspec/changes/create-and-scene/checklist.md')
  const lines = (await readFile(checklist, 'utf8')).trimEnd().split('\n')
  for (const id of ids) {
    const row = lines.findIndex(line => line.startsWith(`| I-${id} |`))
    if (row < 0) throw new Error(`Unknown checklist ID ${id}`)
    const cells = lines[row].split('|')
    cells[5] = ` ${code} `
    cells[6] = ` ${evidence.replaceAll('|', '/')} `
    cells[7] = ` ${status} `
    lines[row] = cells.join('|')
  }
  await writeFile(checklist, lines.join('\n') + '\n')
}
