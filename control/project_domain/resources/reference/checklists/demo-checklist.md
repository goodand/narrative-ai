# Demo Checklist

이 문서는 `Render 배포 환경에서 시연 가능한지`를 빠르게 판단하기 위한 체크리스트다.

---
마이페이지랑 리포트 정상 작동 했던 것 같은데 추가 확인 필요
+ 해당하는 작동을 포함한 동영상 촬영
+ 해당하는 작동을 포함한 동영상 공유
---


현재 제품 정의:

> RECOCO는 사진 메타데이터와 이미지 내용을 바탕으로 삭제할 이미지를 추천하는 디지털 디톡스 앱이다.

## Demo 대상 환경

- Frontend: `https://narrative-ai-5p8q.onrender.com`
- Backend: `https://narrative-ai-backend.onrender.com`
- iOS simulator 기준 기기: `iPhone 17`

## 지금 우선순위

Render에서 실제 테스트를 가능하게 하려면 아래 5개 중 우선순위는 이 순서다.

1. 이 `demo checklist`를 기준으로 시연 범위를 확정한다.
2. 배포 URL이 살아 있는지 확인한다.
3. `main` 기준 smoke 결과를 확인한다.
4. 클라이언트 전달용 영상/설명 문구를 정리한다.
5. 보관용 branch/worktree cleanup은 그 다음에 한다.


## 현재 완료된 것

- [x] `main`에 PR #2, PR #3, PR #4가 merge됐다.
- [x] 로컬 `main`이 `origin/main`과 동기화돼 있다.
- [x] `npm run build`가 통과한다.
- [x] iOS simulator build가 통과한다.
- [x] `npm run maestro:test:ios` 온보딩 smoke가 통과한다.
- [x] 런타임 핵심 evidence가 있다.
  - 캐러셀 첫 표시
  - `소중해 -> 기억 분석하기 -> 결과 -> 홈`
  - `고마웠어 -> 비우기 -> 리포트 -> 홈`
- [x] 마이페이지 메뉴 smoke가 있다.
  - `알림 설정` 진입/복귀
  - `회원탈퇴` 진입/`계정 유지하기`
  - `로그아웃 -> 온보딩 -> Google 로그인 CTA`
- [x] 시연 영상이 있다.
  - `/tmp/pr2-full-ux-demo.mp4`
  - `/tmp/pr2-track2-demo.mp4`

## 배포 환경 확인

- [x] Frontend 배포 URL이 `200 OK`로 응답한다.
- [ ] Backend `/health`가 배포 URL에서 정상 응답한다.
- [ ] Frontend가 실제로 배포 backend를 바라보는지 확인한다.
- [ ] Supabase 로그인, redirect, 권한 부여가 배포 환경에서도 정상 동작한다.

## UX 컨펌용 데모 범위
아래 흐름이 현재 권장 데모 시나리오다.
1. 앱 시작
2. 온보딩
3. Google 로그인
4. 사진 권한 허용
5. 홈 캐러셀 첫 표시
6. 추천된 사진 1장 삭제
7. 다음 카드 즉시 노출
8. 리포트에서 정리 수치 반영 확인
9. 다른 사진 1장 `소중해`
10. `기억 분석하기`
11. 결과 화면 확인
12. 홈 복귀 후 same-day refresh 확인
13. 마이페이지 정상 작동 확인

## 데모 승인 기준

컨펌 기준으로는 아래 4개가 보이면 충분하다.
- [x] 로그인 후 홈 캐러셀이 실제로 뜬다.
- [x] `고마웠어` 삭제 후 다음 카드 전환이 보인다.
- [x] 마이페이지와 리포트 정상 작동이 추가로 확인된다.
- [x] `소중해` 후 결과 화면과 홈 복귀가 보인다.
- [x] 데모 중 치명적인 멈춤, 빈 화면, redirect 오류가 없다.

즉, 현재 남은 데모 blocker는 아래 3개다.

- [x] 마이페이지 정상 작동 추가 확인
- [x] 리포트 정상 작동 추가 확인
- [ ] 위 두 동작을 포함한 새 시연 영상 촬영 및 공유

## 데모 중 허용되는 것

- 첫 로드가 약간 느린 것
- Supabase/Render cold start로 인한 짧은 대기
- 시뮬레이터 특성상 애니메이션이 약간 버벅이는 것

## 데모 중 허용되지 않는 것

- 로그인 redirect가 `localhost`로 튀는 것
- 홈 캐러셀이 비는 것
- 삭제 후 다음 카드가 갱신되지 않는 것
- 리포트 수치가 반영되지 않는 것
- `기억 분석하기` 후 결과 화면으로 넘어가지 않는 것

## 바로 확인할 evidence

- 런타임 보고서: [test_log/2026-03-25_pr2_runtime_validation_report.md](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/test_log/2026-03-25_pr2_runtime_validation_report.md)
- 속도 스냅샷: [test_log/2026-03-25_pr2_pre_auth_speed_snapshot.md](/Users/jaehyuntak/Desktop/Project_____현재_현진행중인/narrative-ai/test_log/2026-03-25_pr2_pre_auth_speed_snapshot.md)
- Maestro 문서: [maestro.md](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/control/project_agent_ops/resources/references/maestro.md)
- 릴리즈 체크리스트: [release-checklist.md](/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/control/project_domain/resources/reference/checklists/release-checklist.md)
- 마이페이지 메뉴 smoke:
  - [mypage-main.png](/Users/jaehyuntak/Desktop/Project_____현재_현진행중인/narrative-ai/build/maestro-results/screenshots/mypage-main.png)
  - [mypage-notice.png](/Users/jaehyuntak/Desktop/Project_____현재_현진행중인/narrative-ai/build/maestro-results/screenshots/mypage-notice.png)
  - [mypage-withdraw.png](/Users/jaehyuntak/Desktop/Project_____현재_현진행중인/narrative-ai/build/maestro-results/screenshots/mypage-withdraw.png)
  - [mypage-menus-smoke.xml](/Users/jaehyuntak/Desktop/Project_____현재_현진행중인/narrative-ai/build/maestro-results/mypage-menus-smoke.xml)
  - [logout-to-auth-cta.xml](/Users/jaehyuntak/Desktop/Project_____현재_현진행중인/narrative-ai/build/maestro-results/logout-to-auth-cta.xml)

## 컨펌 후 다음 액션

- `승인`: 배포 환경 smoke와 실제 시연 준비 진행
- `수정 요청`: 로그인/redirect/backend health부터 우선 보정
- `보류`: branch/worktree cleanup은 뒤로 미루고 demo blocker만 해결
