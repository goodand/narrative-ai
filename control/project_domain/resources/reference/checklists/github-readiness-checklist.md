# GitHub Readiness Checklist

현재 목적은 public/open-source 공개가 아니라 private GitHub repo에 push해서 CI를 돌릴 준비다. 아래 상태는 2026-03-25 기준 로컬 repo evidence만 반영한다.

## 1. Secrets / Templates

- [x] `.env`는 tracked 상태가 아니다.
- [x] `.env.example`는 tracked 상태다.
- [ ] 과거 commit history의 secret 유출 여부를 audit하고 필요 시 회전한다.
- [ ] GitHub Actions secrets를 repo/org secrets로 매핑한다.

## 2. CI Wiring

- [x] working tree에 frontend build CI 정의가 있다.
- [x] working tree에 backend `/health` smoke CI 정의가 있다.
- [x] `.github/workflows/ci.yml`가 tracked 상태다.
- [x] `.github/workflows/build-ios.yml`가 tracked 상태다.
- [ ] 첫 GitHub Actions run 결과가 green이다.
- [ ] 실패 시 확인할 로그/산출물 경로가 문서화돼 있다.

## 3. Private Repo Hygiene

- [x] `.gitignore`에 build, log, temp, env variant, Maestro temp ignore가 있다.
- [ ] tracked 텍스트 파일의 로컬 절대경로·개인 메모 흔적을 정리한다.
- [x] README wording이 현재 private GitHub CI 목표와 맞는다.
- [x] `.maestro/` flow와 `control/project_agent_ops/resources/references/maestro.md`가 필요하다면 tracked 상태로 포함한다.
- [ ] GitHub에 올릴 변경만 남도록 working tree를 정리한다.

## Hard Stop

아래 중 하나라도 해당하면 private GitHub CI readiness를 완료로 표시하지 않는다.

- [x] `.env.example`와 `.github/workflows/ci.yml`가 tracked 상태다.
- [ ] 첫 GitHub Actions run 결과가 green이다.
- [ ] delete/report 등 미검증 핵심 흐름은 pending으로 남겨둔다.
