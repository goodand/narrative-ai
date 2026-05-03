# Resources Secondary Kind Restructure

## Goal
Align `control/*/resources/` with the fixed secondary-kind model:
- `reference`
- `evidence`
- `material`

## Applied Rule
The primary action units stay:
- `resources`
- `registry`
- `archive`

No new primary action units were introduced.
The old top-level resource buckets were moved under one of the three secondary kinds.

## Mapping
### `project_agent_ops/resources`
- `reference/`
  - `codebase_graph`
  - `contracts`
  - `experiment_plans`
  - `handoffs`
  - `references`
  - `skill_candidates`
  - `tools_inventory`
  - `troubleshooting`
- `evidence/`
  - `feedback`
  - `reports`
  - `smoke`
- `material/`
  - `manifests`
  - `task_packets`

### `project_domain/resources`
- `reference/`
  - `checklists`
  - `experiment_plans`
  - `knowledge_bases`
  - `legacy`
  - `master_plans`
  - `references`
  - `specs`
  - `wiki`
- `evidence/`
  - `cross_validation`
  - `reports`
  - `smoke`
- `material/`
  - `assets`
  - `context_packages`
  - `manifests`

### `team/resources`
- `reference/`
  - `external_repos`
  - `rules`
  - `vendor_skills`
- `evidence/`
  - `metrics`
  - `migration`
  - `reports`
- `material/`
  - `templates`
- exception kept:
  - `scripts/`

### `user_decisions/resources`
- `reference/`
  - `adr`
  - `closed_questions`
  - `notes`
- `evidence/`
  - `reports`
- `material/`
  - `assets`

## Legacy Compatibility
Old resource paths are preserved as symlink shims so existing references keep working.

Examples:
- `control/project_agent_ops/resources/references` -> `control/project_agent_ops/resources/reference/references`
- `control/project_domain/resources/checklists` -> `control/project_domain/resources/reference/checklists`

## Rule After Migration
- New control artifacts should be placed through `reference / evidence / material`
- old direct bucket names under `resources/` are compatibility surfaces only
