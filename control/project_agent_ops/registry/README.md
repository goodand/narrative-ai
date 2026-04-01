# Project Agent Ops Registry

`registry/` is the synchronization surface for agent-operation state.
It does not hold runtime bodies or reusable reference documents.

## What Belongs Here
- `decisions/`
  - machine-readable or indexed decision state used to align agents
- `handoffs/`
  - active handoff indices, pointers, and synchronization records
- `jobs/`
  - task/job registries, dispatch state, and coordination metadata
- `runtime/`
  - runtime-related paths, session metadata, and process references
  - see `control/project_agent_ops/registry/runtime/README.md`
- `tools/`
  - tool inventories, tool-path maps, and coordination metadata

## What Does Not Belong Here
- task packets
- reports
- checklists
- scripts that are the runtime body
- the actual tool or CLI implementation

Those belong in `resources/` or the root runtime plane.
