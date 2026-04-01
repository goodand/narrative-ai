# Caption Optimization PR Scope Checklist

Use this checklist before opening the PR and again before merge.

## 1. Branch / Worktree Boundary
- [ ] Implementation was done on a clean `origin/main`-based branch
- [ ] Existing dirty `main` worktree was not edited during this task
- [ ] The worktree path is isolated from the dirty `main` checkout

## 2. Allowed Files Only
- [ ] `main.js`
- [ ] `src/services/GeminiService.js`
- [ ] `src/components/InputManager.js`
- [ ] `src/components/ResultViewer.js`
- [ ] `backend/app/routers/narrative.py`
- [ ] `backend/app/services/gemini.py`

## 3. Conditional File Gate
- [ ] `backend/app/services/geocoding.py` is untouched
- [ ] If `backend/app/services/geocoding.py` changed, the PR description explicitly justifies why it was unavoidable

## 4. Forbidden Files Stay Untouched
- [ ] `src/components/HomeManager.js`
- [ ] `src/services/PhotoService.js`
- [ ] `src/components/home/**`
- [ ] `src/services/photo/**`
- [ ] `.gitignore`
- [ ] `.maestro/flows/ios/onboarding-auth-smoke.yaml`
- [ ] `ios/App/App.xcodeproj/project.pbxproj`
- [ ] `ios/App/App/Info.plist`

## 5. Caption-only Product Scope
- [ ] PR does not include unrelated structure cleanup
- [ ] PR does not include iOS auth work
- [ ] PR does not include smoke flow changes
- [ ] PR does not redesign synonyms for another ML model

## 6. Synonyms Policy
- [ ] Active caption flow does not wait on `getSynonyms()`
- [ ] Caption success no longer depends on synonyms output
- [ ] `keywords` may be empty without breaking the result screen
- [ ] Any remaining synonyms code is clearly out of the active caption path

## 7. Frontend UX Checks
- [ ] Generate click shows a pending result shell immediately
- [ ] Stage progression is visible or traceable
- [ ] Successful caption response renders without a second blocking phase
- [ ] Error state is coherent for failed requests

## 8. Backend Critical-path Checks
- [ ] Narrative route still accepts the expected multipart request
- [ ] Image normalization still works
- [ ] Reverse geocoding/address enrichment is not blocking the Gemini call path
- [ ] Response shape remains compatible with the frontend

## 9. Validation Evidence
- [ ] `npm run build` passed
- [ ] Relevant backend validation passed
- [ ] A short before/after timing note exists
- [ ] Touched files list is included in the PR body

## 10. Merge Gate
- [ ] Diff stays inside the declared scope
- [ ] Reviewer can verify the PR without reading unrelated refactor work
- [ ] The PR can be reverted without affecting the dirty `main` refactor stream
