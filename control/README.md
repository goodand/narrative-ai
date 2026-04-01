# Control Tree

`control/` is the canonical coordination, governance, and decision-truth plane for this workspace.
It is the place for recorded truth that should be read again and used as a judgment baseline.

## Structure Philosophy
- `root` = runtime plane
- `control/` = canonical coordination / governance / decision-truth plane
- project meaning buckets stay fixed:
  - `project_domain`
  - `project_agent_ops`
  - `user_decisions`
  - `team`
- action units are reduced to exactly three:
  - `resources`
  - `registry`
  - `archive`

## Meaning of Each Action Unit
### `resources/`
Static or reusable artifacts that should be read again.
These are not live runtime bodies.

`resources/` is organized by secondary kinds:
- `reference/`
  - rules, references, plans, checklists, contracts, KBs, handoffs meant for rereading
- `evidence/`
  - reports, smoke outputs, feedback, migration evidence, metrics
- `material/`
  - manifests, task packets, assets, templates, context packages, concrete reusable materials

### `registry/`
Synchronization surfaces.
This is where state references, indices, path maps, and metadata used for coordination are managed.

Important rule:
- `registry/runtime` does not mean the runtime body itself lives there
- it means runtime-related paths, state references, and runtime metadata are managed there

### `archive/`
Past origin space.
Historical material that should not be treated as current truth, but must remain preserved.

## Exception Rule
`control/*/resources/scripts/` is an exception, not a general pattern.
- prefer root `scripts/` first
- allow control-local scripts only for control-plane maintenance utilities

## Runtime Boundary Rule
Skills, MCP servers, CLI surfaces, and other runtime bodies do not belong inside `control/` as primary artifacts.
`control/` should store only their:
- rules
- inventory
- session path maps
- contracts
- smoke / report evidence

## Legacy Entry Surfaces
`plans/` and `docs/` are preserved as legacy entry surfaces through symlink shims.
Treat `control/` as the source of truth.

## Runtime-Plane Exception Example
`.gemini/` is a root runtime-plane directory.
It is not a `control/` artifact and should not be relocated under `control/` or `src/`.

## Current Migration Notes
- `control/team/resources/evidence/migration/2026-04-01-18-08_resources-secondary-kind-restructure.md`
- `control/team/resources/evidence/migration/2026-04-01-18-06_plans-and-docs-control-migration.md`
- `control/team/resources/evidence/migration/2026-04-01-18-02_gemini-control-surface-root-revert.md`
- `control/team/resources/evidence/migration/2026-04-01-18-13_gemini-control-surface-relocation.md`
  - superseded by `2026-04-01-18-02_gemini-control-surface-root-revert.md`
