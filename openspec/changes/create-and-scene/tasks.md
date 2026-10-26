# Tasks: create-and-scene

These tasks are **sequential** and must be executed in order: 02 builds on the
scene kit from 01, and 03 dogfoods the skill from 02 (and the `npm run verify`
script delivered in 03 is the command the skill's self-verify step references).

- [x] Scene kit + app shell (`tasks/01-scene-kit-app-shell.md`)
- [x] Presentation skill (`tasks/02-presentation-skill.md`) — depends on 01
- [x] Reference sample (via the skill) + verification (`tasks/03-reference-sample-verification.md`) — depends on 02
