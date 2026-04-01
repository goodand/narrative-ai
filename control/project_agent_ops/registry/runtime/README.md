# Agent Ops Runtime Registry

`registry/runtime/` is a synchronization surface for runtime-related metadata.
It is not the runtime body itself.

## Allowed
- runtime path maps
- session identifiers
- process metadata
- health or availability snapshots
- machine-readable pointers to runtime surfaces

## Not Allowed
- the actual CLI package
- executable app code
- MCP server source trees
- hook implementations that are the runtime body

## Placement Rule
If the artifact is something you execute directly, it belongs in the root runtime plane.
If the artifact is something you read to align around runtime state, it can belong here.
