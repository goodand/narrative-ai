# Backend Image Normalization Validation (2026-02-17)

## Objective
- Reduce Gemini image processing failures by normalizing uploaded images on backend before Gemini request.

## Change Summary
- Commit: `6a4b334`
- Files:
- `backend/app/routers/narrative.py`
- `backend/pyproject.toml`
- Implemented:
- EXIF orientation normalization
- Max edge resize (`2048`)
- RGB JPEG re-encoding (`quality=85`, optimized)
- Added dependency: `pillow>=10.2.0`

## Related Reliability Change
- Commit: `00f9f53`
- Added Gemini key failover:
- `GEMINI_API_KEY -> GEMINI_API_KEY_SUB -> GEMINI_API_KEY_INSU`
- Optional override: `GEMINI_API_KEYS=key1,key2,key3`

## Validation Runs
Endpoint:
- `POST https://narrative-ai-backend.onrender.com/api/v1/narrative`

Input/Output:
1. Small PNG
- File: `assets/test-assets/스크린샷 2026-01-20 오전 12.21.22.png` (11,517 bytes)
- Result: `HTTP 200`
- Response keys: `original_caption`, `keywords`

2. Large JPG
- File: `assets/test-assets/IMG_9544.JPG` (~3.08 MB)
- Result: `HTTP 200`
- Response keys: `original_caption`, `keywords`

## Findings
1. Backend multipart path is stable after `python-multipart` fix.
2. Image normalization path works for both very small and relatively large input.
3. Prior `INVALID_ARGUMENT` image failures are likely input-specific and are mitigated by server-side normalization.

## Open Checks
1. Observe Render logs for fallback-key switching under quota pressure.
2. Track failure rate over real user traffic (before/after normalization).
