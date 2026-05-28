# Domain Documentation Configuration

## Layout Type
Single-context

## Directory Structure
```
├── CONTEXT.md              # Project domain language and context
├── docs/
│   └── adr/               # Architectural Decision Records
│       ├── 001-architecture.md
│       ├── 002-authentication.md
│       └── ...
└── docs/agents/           # Agent configuration (this directory)
    ├── issue-tracker.md
    ├── triage-labels.md
    └── domain.md
```

## Skills that read these files
- `improve-codebase-architecture` - Reads CONTEXT.md for domain language
- `diagnose` - Uses CONTEXT.md to understand project context
- `tdd` - References CONTEXT.md for domain-specific test scenarios

## CONTEXT.md Content Guidelines
Should contain:
- Project overview and purpose
- Key domain concepts and terminology
- Important business rules and constraints
- Technical architecture overview
- Team conventions and practices

## ADR Directory Content Guidelines
`docs/adr/` should contain markdown files documenting significant architectural decisions, numbered sequentially with descriptive titles.
