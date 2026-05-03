# RULES Control Legacy Entry Surfaces

## Purpose
Define how legacy top-level entry surfaces should be treated after the `control/` canonicalization.

## Legacy Entry Surfaces
The following paths are legacy entry surfaces:
- `plans/`
- `docs/`

They remain available only to preserve historical references and convenient entrypoints.
They are not the canonical source of truth.

## Canonical Rule
- the source of truth lives under `control/`
- if the same artifact is reachable through both `control/` and a legacy path, `control/` wins
- new files should be authored under `control/`
- legacy paths may be preserved as symlink shims

## Allowed Use
Legacy entry surfaces are acceptable for:
- opening previously known paths
- preserving old links
- human convenience during transition

## Forbidden Use
Do not treat `plans/` or `docs/` as the canonical place for:
- new governance rules
- new project-domain checklists
- new task packets
- new reports or migration truth

## Mapping Principle
- planning / coordination / feedback / packets / tool strategy
  -> `control/project_agent_ops/resources/...`
- project/domain checklists and experiment plans
  -> `control/project_domain/resources/...`
- migration and team-wide structural rules
  -> `control/team/resources/...`
- user decision truth and notes
  -> `control/user_decisions/resources/...`

## Shim Principle
If a legacy path is preserved, it should normally be a shim pointing at the `control/` source-of-truth path.
