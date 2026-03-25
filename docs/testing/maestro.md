# Maestro Setup

이 저장소는 공식 Maestro workspace 패턴을 따라 `.maestro/` 아래에 flow를 둡니다.

## 준비

```bash
npm run maestro:install
npm run maestro:install:ios
```

- 웹 리소스나 Capacitor 변경까지 포함해 최신 상태를 검증하려면 먼저 `npm run build` 후 `npx cap sync ios`를 실행합니다.
- 기본 simulator 이름은 `iPhone 17`입니다.
- 다른 simulator를 쓰려면 `SIM_NAME` 또는 `UDID` 환경변수를 넘기면 됩니다.
- smoke/record 스크립트는 한 번 해석한 `UDID`를 install 단계까지 그대로 넘겨 같은 simulator를 대상으로 고정합니다.

## Smoke Test

```bash
npm run maestro:test:ios
```

- 기본 flow: `.maestro/flows/ios/onboarding-auth-smoke.yaml`
- 검증 범위: 앱 launch, 온보딩 3단계, 로그인 CTA 노출
- 산출물: `build/maestro-results/`
- 다른 flow를 시험하려면 `MAESTRO_FLOW_PATH=flows/ios/<your-flow>.yaml npm run maestro:test:ios` 형태로 실행하면 됩니다.

현재 제품 방향 기준으로는 온보딩 smoke만으로 충분하지 않습니다. 앱의 핵심은 `삭제할 이미지를 추천`하고 빠르게 비우기 결정을 돕는 것이므로, 우선순위가 높은 다음 flow를 추가하는 것이 맞습니다.

- 홈 캐러셀 첫 표시
- `고마웠어` 삭제
- 삭제 후 다음 카드 전환
- 삭제 후 리포트 반영
- `소중해` 기록 후 홈 refresh

## Record Your Flow

공식 문서의 `maestro record --local` 흐름을 그대로 사용합니다.

```bash
npm run maestro:record:ios
```

- 기본 flow 파일을 열어 둔 상태에서 로컬 recording을 시작합니다.
- 이후 `delete`, `report`, `recorded`, `carousel latency` 같은 실제 핵심 경로를 녹화해 flow를 확장하면 됩니다.
- 기본 flow를 바꾸려면 `MAESTRO_FLOW_PATH=flows/ios/<your-flow>.yaml npm run maestro:record:ios`를 사용합니다.

## Private GitHub CI 메모

private 저장소 CI에서 이 lane을 쓰려면 별도 workflow/job에서 macOS runner를 잡고 아래 순서를 호출하면 됩니다.

```bash
npm ci
npm run build
npx cap sync ios
npm run maestro:install
SIM_NAME="iPhone 17" npm run maestro:test:ios
```

- GitHub runner 이미지마다 simulator 이름이 다를 수 있으므로 CI에서는 기본값에 기대지 말고 `SIM_NAME` 또는 `UDID`를 명시하는 편이 안전합니다.
- 이 문서는 호출 순서만 정리합니다. 실제 GitHub Actions wiring은 workflow 파일 수정이 필요하지만 이번 범위에서는 건드리지 않습니다.

private GitHub CI에 Maestro를 붙일 때도 우선순위는 `삭제 추천 핵심 경로`입니다. 온보딩 flow 다음으로는 캐러셀/삭제/report flow를 붙이는 편이 맞습니다.

## 유용한 환경변수

```bash
SIM_NAME="iPhone 17 Pro" npm run maestro:install:ios
UDID="<simulator-udid>" npm run maestro:test:ios
INSTALL_APP=0 npm run maestro:test:ios
INSTALL_APP=0 npm run maestro:record:ios
MAESTRO_FLOW_PATH="flows/ios/onboarding-auth-smoke.yaml" npm run maestro:test:ios
```
