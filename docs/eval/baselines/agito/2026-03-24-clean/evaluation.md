# Eval: agito

## Meta

| Field | Value |
|-------|-------|
| Repo | agito |
| Commit | N/A (no git history at scan path) |
| Date | 2026-03-24 |
| omm version | 0.1.5 |
| Scan command | `/omm-scan` (full) |
| Notes | CLEAN baseline — first scan, no prior context |

## Summary

- **Verdict**: Borderline
- **Top-level classes**: 5 (agito-app, agito-server, agito-site, agito-legacy, asset-toolchain)
- **Nested depth**: shallow (single level of nested nodes within each class diagram; no subgraph nesting)

## What Worked

1. **멀티서비스 경계가 top-level에서 즉시 드러난다.** 5개 class가 각각 desktop app / backend server / marketing site / legacy boundary / asset toolchain에 정확히 대응하며, 처음 보는 사람도 "이 repo는 5개의 분리된 서비스/컴포넌트 묶음이다"를 diagram 목록만으로 파악할 수 있다. 디렉터리 이름과 class 이름이 일치하지만 각 description이 아키텍처적 역할을 충분히 설명해 파일 트리 요약으로 전락하지 않았다.

2. **text fields가 diagram을 실질적으로 보완한다.** constraint와 concern이 단순 요약 반복을 피하고 실제 운영 위험을 담았다. 특히 agito-app constraint의 "Must NOT call Anthropic APIs directly — users bring their own CLI (ToS compliance)"와 agito-server concern의 "Gemini API costs are unbounded per user request; no per-user quota enforcement visible"는 diagram만으로는 절대 알 수 없는 판단 근거다. concern이 리스크 인지에 실질적으로 기여한다.

3. **agito-legacy class가 legacy 경계를 명확히 분리하고 역사적 맥락을 설명한다.** MCP-mediated session 방식에서 direct PTY spawning으로 전환한 architectural shift가 context와 note에 명시되고, diagram edge에 `Core -->|"superceded by"| AgitoV2`로 표현되어 "왜 legacy가 별도 class인지"가 한 눈에 읽힌다. contract가 요구한 legacy 분리가 성공적으로 달성됐다.

## What Failed

1. **agito-app 내부 구조가 실제 소스와 불일치하며 핵심 서브시스템이 누락됐다.** 실제 main/index.ts는 세 개의 BrowserWindow(mainWindow, terminalDockWindow, floatDockWindow)를 관리하고 main/auth/ 아래 OAuth 콜백·Supabase 인증·credential store 서브시스템이 존재하지만 diagram에는 보이지 않는다. `Main -->|"calls"| Server` edge도 부정확하다 — main/index.ts에는 agito-server 직접 호출 코드가 없으며 서버 호출은 billing-callback, auth 등 별도 서비스에서 발생한다. 이 수준의 오류는 diagram을 신뢰 기반으로 사용하기 어렵게 만든다.

2. **"shared infra/protocols" axis가 완전히 누락됐다.** contract에 명시된 기대 축 중 하나임에도 agito-app/src/shared/ 아래의 실질적인 cross-concern 타입 레이어(ipc-channels.ts, types.ts, terminal-dock-*.ts 등 14개 파일)가 agito-app class 내부 노드로 흡수됐다. 이 shared 레이어는 app-renderer, app-main, IPC bridge 세 프로세스 모두가 의존하는 독립적인 계약 레이어인데, diagram에서는 `Shared["Shared Types\n agito-app/src/shared/types.ts"]` 단일 노드로 축소돼 중요성이 과소 표현됐다. cross-service 공유 여부(site와 server가 이 타입을 쓰는가)에 대한 설명도 없다.

3. **asset-toolchain이 독립 class로 승격된 것은 granularity 과잉이다.** root-level Python 스크립트 6개는 배포되지 않는 일회성 개발자 도구다. concern에 직접 "lockscreen_gen.py appears unrelated to in-game assets — may be personal tooling accidentally committed"이라고 적혀 있을 정도로 cohesion이 약하다. 이들을 하나의 top-level class로 올린 결과 agito-app / agito-server / agito-site / agito-legacy와 동등한 아키텍처 단위처럼 보이는 시각적 노이즈가 발생한다. agito-app이나 agito-server의 내부 노드로 표현하거나 별도 "dev tooling" 섹션으로 강등하는 것이 적절했다.

## Checklist

| # | Check | Rating | Notes |
|---|-------|--------|-------|
| 1 | Top-level class count appropriate | Pass | 대형 repo 기준 5개는 적절. contract expected 5 axes와 정확히 일치 |
| 2 | Class names are architectural concepts | Pass | agito-app, agito-server, agito-site, agito-legacy, asset-toolchain — 디렉터리 이름이기도 하지만 각각 독립적인 아키텍처 역할로 읽힌다 |
| 3 | Each class has clear separation reason | Pass | 각 class description이 "왜 별도인가"를 한 문단으로 설명. legacy와 asset-toolchain도 분리 이유가 명시됨 |
| 4 | No critical subsystem missing | Fail | agito-app auth 서브시스템 누락, shared infra axis 미생성, agito-server me.py endpoint 누락 |
| 5 | No implementation detail leaked to top-level | Borderline | asset-toolchain은 배포 단위가 아닌 스크립트 묶음; top-level 승격은 과잉 |
| 6 | Key flow edges/@refs visible | Borderline | app↔server 관계는 보이나 app↔site (공유 Supabase identity)가 edge로 표현되지 않음; `Main -->|"calls"| Server` edge가 부정확 |
| 7 | Edge/@ref density not overwhelming | Pass | 각 diagram당 edge 수가 적절(10-15개 수준). 읽기 부담 없음 |
| 8 | Entry point / central axis visible | Pass | 각 diagram에 `:::entry` classDef 적용으로 시작점 명시. agito-app의 Main Process가 중심축으로 인식 가능 |
| 9 | Nested graph provides zoom-out/zoom-in | Borderline | top-level 5 class 분리는 zoom-out을 제공하나, 각 class 내부가 단일 평면 LR 그래프로만 표현돼 zoom-in 경험이 얕다. agito-app의 3-process 계층이나 server의 pipeline 내부 구조는 subgraph로 표현됐으면 더 명확했을 것 |
| 10 | Description adds value beyond diagram title | Pass | 모든 class description이 기술 스택·배포 방식·핵심 역할을 담아 diagram title 반복을 넘어섬 |
| 11 | Context explains external interfaces/purpose | Pass | agito-app context의 "users bring their own Claude Code CLI credentials", agito-server context의 "compute-intensive image generation cloud-side"가 외부 인터페이스와 존재 이유를 명확히 설명 |
| 12 | Constraint captures real design rules | Pass | PixiJS v7 pin 이유, uv_build 요구사항, Electron context isolation 필수 등 실제 설계 제약이 담겨 있음 |
| 13 | Concern captures real risks/uncertainties | Pass | PTY 고아 프로세스, unbounded Gemini API 비용, /dev route 미인증 노출 위험, in-flight job 손실 등 실제 운영 리스크 |
| 14 | Stable on re-scan | N/A (baseline) | |

## Missing Subsystems

- **agito-app auth subsystem**: main/auth/ (OAuth callback, Supabase provider, credential store, billing callback) — class 내부 노드로라도 표현 필요
- **shared infra/protocols axis**: agito-app/src/shared/의 IPC channel contract, terminal dock layout/bar/state 타입들 — cross-process 계약 레이어로서 독립 노드 또는 별도 class 승격 검토 필요
- **agito-server me.py endpoint**: api/me.py가 diagram에 없음 (auth 상태 확인 엔드포인트로 추정)
- **agito-legacy session-tools-core package**: packages/ 아래 존재하나 diagram 노드 없음

## Over-split Subsystems

- **asset-toolchain**: 6개 root-level Python 스크립트를 독립 top-level class로 승격. 배포 단위가 아닌 개발자 도구이며 cohesion이 약함 (lockscreen_gen.py는 game asset과 무관할 가능성을 concern에서 직접 인정). agito-server의 "batch asset generation client" 노드 또는 별도 하위 섹션으로 표현하는 것이 적절

## Over-merged Subsystems

- **agito-app의 3-process 구조**: Main/Engine/IPC/Renderer가 하나의 평면 그래프에 있어, Electron의 process isolation 경계(main process vs renderer process vs preload)가 시각적으로 불명확. 세 process를 subgraph로 분리했다면 "왜 IPC bridge가 필요한가"가 구조에서 자명했을 것
