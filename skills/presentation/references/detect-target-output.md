# detect-target output

`node <skill-dir>/scripts/detect-target.mjs <project-dir>` prints JSON:

```json
{
  "anchors": { "build": true, "kit": false, "index": false },
  "target": { "kind": "standalone", "dir": "/abs/path/to/app" },
  "empty": false,
  "missing": ["kit", "index"]
}
```

- `anchors`: whether each contract anchor is present in `target.dir`.
- `missing`: the anchors to pass to `scaffold.mjs --anchors`.
- `empty`: the inspected directory has no entries.
- `target.kind`: `standalone` (scaffold at the root), `monorepo` (`target.dir` is `<project-dir>/presentations`), or `existing-app` (all anchors present).
