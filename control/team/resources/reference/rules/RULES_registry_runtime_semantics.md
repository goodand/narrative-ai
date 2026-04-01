# RULES Registry Runtime Semantics

## Purpose
Clarify what `registry/` means under the control-tree philosophy.

## Core Rule
`registry/` is a synchronization surface.
It is not the runtime body itself.

## Meaning
`registry/` should contain things such as:
- path maps
- indices
- metadata
- state references
- synchronization records
- machine-readable pointers used to align multiple actors

## Runtime Naming Rule
If a path such as `registry/runtime/` exists, it means:
- runtime-related paths
- runtime-related state references
- runtime-related metadata

It does **not** mean:
- the runtime implementation itself
- executable app code
- the main control surface of a tool or CLI

## Boundary Examples
Allowed in `registry/runtime/`:
- session path maps
- process metadata
- runtime inventory
- health/reference state snapshots

Not allowed in `registry/runtime/`:
- the actual CLI package
- application source files
- hooks that are the runtime body itself

## Relationship With Resources
- `resources/` = things you reread and reuse
- `registry/` = things you synchronize against
- `archive/` = past origin and historical storage

## Practical Rule
When naming a new directory under `registry/`, ask:
"Is this the thing itself, or information used to align around that thing?"

If it is the thing itself, it does not belong in `registry/`.
