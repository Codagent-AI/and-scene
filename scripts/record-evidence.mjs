import { readFile, writeFile } from 'node:fs/promises'
const [ids, code, evidence, status = 'verified'] = process.argv.slice(2)
const file = 'openspec/changes/create-and-scene/checklist.md'
let text = await readFile(file, 'utf8')
if (!text.includes('| Code | Evidence | Status |')) text = text.replace('| How to verify |', '| How to verify | Code | Evidence | Status |').replace('|---|---|---|---|---|', '|---|---|---|---|---|---|---|---|')
text = text.split('\n').map(line => {
 if (!/^\| (I-|L-|X-)/.test(line)) return line
 const cells = line.split('|').slice(1, -1).map(c => c.trim())
 if (ids.split(',').some(id => cells[0].split(', ').includes(id))) return `| ${[...cells.slice(0, 5), code, evidence, status].join(' | ')} |`
 if (cells.length === 5) return `${line} — | — | not verified |`
 return line
}).join('\n')
await writeFile(file, text)
