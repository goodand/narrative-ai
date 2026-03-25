# Release Checklist

현재 목적은 public release 확정이 아니라 private GitHub CI push-prep이다. 아래 상태는 2026-03-25 기준 로컬 repo evidence만 반영한다.

현재 제품 방향의 메인 게이트는 `사진 메타데이터와 이미지 내용을 바탕으로 삭제할 이미지를 추천하는` 디지털 디톡스 흐름이다. 따라서 스토리 생성 보조 기능보다 아래 항목이 우선한다.

- 홈 캐러셀 첫 표시 속도
- 캐러셀 썸네일 전달 안정성
- 삭제 후 다음 카드 전환
- 삭제 후 통계와 리포트 반영
- same-day refresh / daily curation 재계산

## 1. Confirmed Local Evidence

- [x] `npm run build` 통과
- [x] `npm run maestro:test:ios` 온보딩 smoke 통과
- [x] backend `/health` 응답이 `healthy`를 반환한다.
- [x] 홈 캐러셀 launch path와 `launch_to_carousel_ms` 계측 경로가 코드에 존재한다.
- [ ] delete/report 경로 smoke 또는 동등한 자동화 증거가 있다.
- [ ] 홈 캐러셀 첫 표시 속도 목표치를 정의하고 샘플링 기록을 남긴다.
- [ ] 캐러셀 썸네일 로드 실패율을 측정한다.
- [ ] delete 후 next-card 전환 시간이 측정된다.
- [ ] `recorded` 반영, 홈 refresh, 삭제 후 통계 갱신 등 후속 상태 변화가 검증됐다.
- [ ] limited/full photos permission, cold launch, 재실행 경로가 검증됐다.

## 2. Private GitHub Push Prep

- [ ] GitHub에 올릴 변경만 남도록 working tree를 정리한다.
- [x] `.env.example`가 tracked 상태다.
- [x] `.github/workflows/ci.yml`가 tracked 상태다.
- [x] `.github/workflows/build-ios.yml`가 tracked 상태이며 iOS build job이 있다.
- [ ] 첫 GitHub Actions run에서 frontend build + backend `/health`가 green이다.
- [ ] CI 실패 시 확인할 로그/산출물 경로가 문서로 정리돼 있다.

## 3. Deferred Until Public Release

- [ ] production secrets / production backend 설정을 검증한다.
- [ ] destructive account deletion 및 관련 데이터 갱신을 production 기준으로 검증한다.
- [ ] App Store archive, 메타데이터, privacy/terms URL을 준비한다.
- [ ] release note와 rollback 기준을 문서화한다.

## Release Gate

아래 3개가 충족되기 전에는 이 문서를 public release 완료 근거로 사용하지 않는다.

- [x] private GitHub CI용 필수 파일이 tracked 상태다.
- [ ] `삭제 추천 -> 삭제 결정 -> 후속 갱신` 핵심 흐름이 추가로 검증됐다.
- [ ] 첫 GitHub Actions run이 green이다.
