# 2026-03-06 03:18 KST - Cache-first Daily Curation 구현

## 결론
- 홈 진입 경로를 `getPhotos()` 기반 전체 스캔에서 `getDailyCuration()` 캐시 경로로 전환했다.
- iOS 플러그인에 Daily Curation 캐시(UserDefaults), 17:00 dayKey, iCloud-only 썸네일 스킵 로직을 추가했다.
- 삭제 액션 후 `recordCurationAction(deleted)` 기록 + 강제 refresh(`forceRefresh`) 경로를 연결했다.

## 문제/이슈
- 샌드박스 환경에서 `xcodebuild`는 CoreSimulator 런타임 접근 제한으로 완전 빌드 검증이 불가능했다.
- 프론트(`npm run build`)는 성공.
- iOS 빌드 로그에서 Capacitor module resolution 오류가 발생했는데, 이는 이 환경의 Pods/시뮬레이터 런타임 제약으로 기존 코드에도 동일하게 나타나는 유형이다.

## 변경 파일
- `src/components/HomeManager.js`
- `src/services/PhotoService.js`
- `src/plugins/RecocolPhotos.ts`
- `ios/App/App/Plugins/RecocolPhotosPlugin/PhotoAssetManager.swift`
- `ios/App/App/Plugins/RecocolPhotosPlugin/RecocolPhotosPlugin.swift`
- `ios/App/App/Plugins/RecocolPhotosPlugin/RecocolPhotosPlugin.m`

## 검증 요약
- JS build: pass
- iOS compile: sandbox 제약으로 신뢰 가능한 E2E compile 불가 (Xcode 로컬 실행 필요)
