# Triage Label Configuration

## Label Mapping
The following canonical triage roles map directly to GitHub issue labels:

| Canonical Role | GitHub Label | Description |
|---------------|-------------|-------------|
| `needs-triage` | `needs-triage` | Maintainer needs to evaluate the issue |
| `needs-info` | `needs-info` | Waiting on reporter for more information |
| `ready-for-agent` | `ready-for-agent` | Fully specified, AFK-ready (agent can pick up with no human context) |
| `ready-for-human` | `ready-for-human` | Needs human implementation |
| `wontfix` | `wontfix` | Will not be actioned |

## Usage
Skills that process issues (like `triage`) will apply these labels to move issues through the state machine.

## Label Colors (optional)
If you want to set up colors in GitHub:
- `needs-triage`: Yellow/Orange
- `needs-info`: Blue  
- `ready-for-agent`: Green
- `ready-for-human`: Purple
- `wontfix`: Gray
