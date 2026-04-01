# Plans and Docs Control Migration

## Goal
Move `plans/` and `docs/` content into a `control/` structure aligned with the control tree pattern used in `my-image-parser/control`, while preserving legacy entry paths through symlink shims.

## Applied Structure
- `control/project_agent_ops/`
- `control/project_domain/`
- `control/team/`
- `control/user_decisions/`

## Source-of-truth Moves
### Plans
- `plans/gemini/gemini_feedback.md`
  -> `control/project_agent_ops/resources/evidence/feedback/gemini/gemini_feedback.md`
- `plans/gemini/2026-04-01-16-58_caption-optimization-implementation-packet.md`
  -> `control/project_agent_ops/resources/material/task_packets/issued/2026-04-01-16-58_caption-optimization-implementation-packet.md`
- `plans/gemini/2026-04-01-16-58_caption-optimization-pr-scope-checklist.md`
  -> `control/project_agent_ops/resources/reference/references/2026-04-01-16-58_caption-optimization-pr-scope-checklist.md`
- `plans/gemini/2026-04-01-16-58_caption-optimization-branch-worktree-procedure.md`
  -> `control/project_agent_ops/resources/reference/references/2026-04-01-16-58_caption-optimization-branch-worktree-procedure.md`
- `plans/gemini/2026-04-01-17-48_caption-optimization-tool-and-xcode-strategy.md`
  -> `control/project_agent_ops/resources/reference/tools_inventory/2026-04-01-17-48_caption-optimization-tool-and-xcode-strategy.md`

### Docs
- `docs/release-checklist.md`
  -> `control/project_domain/resources/reference/checklists/release-checklist.md`
- `docs/github-readiness-checklist.md`
  -> `control/project_domain/resources/reference/checklists/github-readiness-checklist.md`
- `docs/demo-checklist.md`
  -> `control/project_domain/resources/reference/checklists/demo-checklist.md`
- `docs/perf/worktree-experiment-plan.md`
  -> `control/project_domain/resources/reference/experiment_plans/worktree-experiment-plan.md`
- `docs/testing/maestro.md`
  -> `control/project_agent_ops/resources/reference/references/maestro.md`

## Legacy Strategy
Old `plans/` and `docs/` file paths are preserved as symlink shims.
This keeps existing references stable while making `control/` the source of truth.

The direct bucket names that appeared before the secondary-kind restructure
(for example `resources/references` or `resources/checklists`) may still resolve
through compatibility shims, but they are no longer canonical.

## Rule
- New operational planning docs go under `control/project_agent_ops/resources/{reference,evidence,material}/...`
- New project-domain checklists and experiment plans go under `control/project_domain/resources/{reference,evidence,material}/...`
- `plans/` and `docs/` should be treated as legacy entry surfaces unless a future cleanup removes the shims
