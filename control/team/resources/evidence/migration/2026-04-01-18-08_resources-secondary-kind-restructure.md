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
  - compatibility shim only for `references`
  - compatibility shim only for `tools_inventory`
  - `skill_candidates`
  - `troubleshooting`
- `evidence/`
  - `feedback`
  - `reports`
  - `smoke`
- `material/`
  - `manifests`
  - `task_packets`
- direct canonical buckets aligned with `my-image-parser`
  - `references`
  - `tools_inventory`

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
For `project_agent_ops/resources`, the original secondary-kind placement for
`reference/references` and `reference/tools_inventory` was later flattened back to
top-level canonical buckets to match the operator-facing access pattern.

Examples:
- `control/project_agent_ops/resources/reference/references` -> `control/project_agent_ops/resources/references`
- `control/project_agent_ops/resources/reference/tools_inventory` -> `control/project_agent_ops/resources/tools_inventory`
- `control/project_domain/resources/checklists` -> `control/project_domain/resources/reference/checklists`

## Rule After Migration
- New control artifacts should be placed through `reference / evidence / material`
- Exception: `project_agent_ops/resources/references` and `project_agent_ops/resources/tools_inventory`
  are canonical direct buckets, and `project_agent_ops/resources/reference/*` is compatibility-only
- old direct bucket names under `resources/` are compatibility surfaces only
