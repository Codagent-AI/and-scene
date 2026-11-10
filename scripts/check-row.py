"""Run one checklist check, retain its output, and immediately record its result."""
from pathlib import Path
import subprocess, sys
row, code, label, *command = sys.argv[1:]
base = Path('../archon-session/output/evidence')
base.mkdir(parents=True,exist_ok=True)
result = subprocess.run(command,capture_output=True,text=True,timeout=180)
log = f'{row}.txt'
(base/log).write_text(f'Check: {label}\nCommand: {command!r}\nExit: {result.returncode}\n'+result.stdout+result.stderr)
p = Path('openspec/changes/create-and-scene/checklist.md')
lines = p.read_text().splitlines()
if 'Evidence' not in lines[0]:
 lines[0] += ' Code | Evidence | Status |'
 lines[1] += '---|---|---|'
for i,line in enumerate(lines):
 if line.startswith(f'| {row} |'):
  cells=line.split('|')[:5]
  lines[i]='|'.join(cells)+f'| {code} | `{log}` — {label} | '+('verified' if result.returncode==0 else 'failed')+' |'
p.write_text('\n'.join(lines)+'\n')
print(row,result.returncode,label)
print(result.stdout[-300:]+result.stderr[-1000:])
sys.exit(result.returncode)
