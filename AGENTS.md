# And Scene

And Scene is a browser-presentation fixture. Implement the OpenSpec change in
this repository and verify both behavior and visual composition before
reporting completion.

## Browser Tooling

Use `chrome-devtools-axi` for agent-driven browser inspection and debugging.
It is installed in the evaluation sandbox and provides a concise CLI over
Chrome DevTools:

```bash
chrome-devtools-axi open http://127.0.0.1:5173/
chrome-devtools-axi snapshot
chrome-devtools-axi screenshot /tmp/and-scene.png
```

Start with `snapshot` to inspect page structure, then use screenshots for visual
composition. Inspect the first, last, and dense or visually important steps;
also inspect a narrow viewport when the presentation is responsive-sensitive.
Use `chrome-devtools-axi --help` for the full command list. Do not invoke the
underlying Chrome DevTools MCP server directly when AXI is available.

Keep deterministic project verification in the repository's Playwright-backed
scripts. AXI is the interactive inspection interface; `npm run verify` remains
the automated browser gate.

## Development

```bash
npm ci
npm run build
npm run verify
```
