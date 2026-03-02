# test_log Naming Rule

## Policy
- Do not use ambiguous names like `LATEST.md`.
- Use minute-level timestamped filenames for latest snapshots:
- `latest_YYYY-MM-DD_HHMM.md`

## Metadata index
- `LATEST_INDEX.json` stores:
- `updated_at`
- `minute_key`
- `latest_file`

## Update command
```bash
test_log/scripts/rotate_latest.sh <source_markdown_file>
```

Example:
```bash
test_log/scripts/rotate_latest.sh test_log/2026-02-17_backend_image_normalization_validation.md
```
