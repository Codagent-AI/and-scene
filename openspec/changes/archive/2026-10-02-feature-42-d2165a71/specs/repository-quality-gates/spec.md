## ADDED Requirements

### Requirement: Opt-in task-compliance review
The repository's Agent Validator configuration SHALL declare a review named `task-compliance`, backed by
the validator's built-in task-compliance review, on the repository root entry point. The review
SHALL be disabled by default and SHALL run only when a validator run explicitly enables it by name.

#### Scenario: Validator lists the task-compliance review
- **WHEN** `agent-validator list` runs in the repository
- **THEN** `task-compliance` appears among the review gates and among the reviews of the `.` entry point, alongside `code-quality` and `skill-quality`

#### Scenario: Configuration remains valid
- **WHEN** `agent-validator validate` runs in the repository
- **THEN** it reports that all config files are valid

#### Scenario: Explicit enablement runs the review
- **WHEN** a validator run with detected changes under `.` passes `--enable-review task-compliance` with `--context-file <task_file>`, as Agent Runner's implement-task step does
- **THEN** the run executes the `task-compliance` review with the task file's contents as its context, instead of silently ignoring the flag

#### Scenario: Ordinary runs skip the review
- **WHEN** a validator run with detected changes under `.` does not pass `--enable-review task-compliance`
- **THEN** the `task-compliance` review does not run

### Requirement: Existing validator gates unchanged
Adding the task-compliance review SHALL NOT change the repository's other validator gates. The
`build`, `lint`, `typecheck`, and `security-deps` checks and the `code-quality` and `skill-quality`
reviews SHALL stay configured and enabled by default. Review execution SHALL keep using the
repository's existing reviewer CLI preference.

#### Scenario: Default run keeps existing gates
- **WHEN** a validator run with detected changes under `.` passes no `--enable-review` flag
- **THEN** it runs the same checks and the `code-quality` and `skill-quality` reviews that it ran before this change, using the same reviewer CLI

#### Scenario: Enabled run adds only task-compliance
- **WHEN** a validator run with detected changes under `.` passes `--enable-review task-compliance`
- **THEN** it runs every gate a default run would run, plus `task-compliance`, and no other additional gate
