# Implementation Plan — Admissions Management Web App

## Development Approach

- **Large features** use spec-driven development. Each feature folder contains a `spec.md` that defines the goal and acceptance criteria. Break features down into user stories as subfolders when you begin work on that feature.
- **Smaller user stories** use test-driven development (red → green → refactor).
- Features are roughly sequenced by dependency order. F00 must ship first (project scaffold), then F01 (auth & RBAC); F02 and F03 can progress in parallel after F01; later features build on earlier ones.

## Feature Index

| # | Feature | Depends On |
|---|---------|------------|
| F00 | [Project Bootstrap (Story Zero)](./F00-project-bootstrap/spec.md) | — |
| F01 | [Project Foundation and Authentication](./F01-project-foundation-and-authentication/spec.md) | F00 |
| F02 | [Applicant Record Management](./F02-applicant-record-management/spec.md) | F01 |
| F03 | [Interview Scheduling and Outcomes](./F03-interview-scheduling-and-outcomes/spec.md) | F01, F02 |
| F04 | [Offer Decision and Registration](./F04-offer-decision-and-registration/spec.md) | F01, F02, F03 |
| F05 | [Document Management](./F05-document-management/spec.md) | F01, F02 |
| F06 | [Applicant-Facing Forms](./F06-applicant-facing-forms/spec.md) | F01, F02, F05 |
| F07 | [Dashboard and Reporting](./F07-dashboard-and-reporting/spec.md) | F01, F02, F03, F04, F05 |
| F08 | [System Administration](./F08-system-administration/spec.md) | F01 |

## Folder Conventions

```
features/
  F00-project-bootstrap/
    spec.md
    user-stories.md
    wireframes.md
  F01-project-foundation-and-authentication/
    spec.md               ← feature spec (this file)
    US-01-{story-name}/   ← user story subfolders added during implementation
      README.md
      tests/
  F02-applicant-record-management/
    spec.md
    ...
```

Each user story subfolder should contain:
- A short `README.md` describing the story scope and TDD test plan.
- A `tests/` directory for unit and integration tests written before implementation.
