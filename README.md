# eval-harness-dashboard

turing. Console의 **Knowledge Management(Learning / Unlearning) 대시보드** 프론트엔드입니다.
에이전트가 가진 지식을 Knowledge Graph로 보여주고, 성능을 떨어뜨리는 지식은 Unlearning, 부족한 지식은 Learning으로 제안해 사용자가 승인·보류할 수 있게 합니다.

> 현재는 발표·세일즈 데모용입니다. 백엔드 없이 MSW Mock API로 전체 흐름이 동작하며, API 계약은 개발 명세서 6장과 같습니다.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
```

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 (Mock API 자동 실행) |
| `npm run build` | 타입 검사 + 프로덕션 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm test` | 단위 테스트 (Vitest) |

환경 변수는 `.env.example`을 `.env.local`로 복사해 바꿉니다.

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `VITE_USE_MOCK` | `true` | `false`면 Mock을 끄고 실제 API를 호출 |
| `VITE_API_BASE_URL` | `/api/v1` | 실제 API 주소 |

## 화면 구성 (위에서 아래로)

1. 헤더 — 에이전트, 보유 지식 수, 승인 대기 수
2. 지식 관리 흐름 — 모니터링 → 탐지 → 제안 → 승인 → 반영 5단계
3. **Knowledge Graph** — 분야별 색, 영향도별 크기, 상태 배지(− ! +). 하단 선택 바에서 바로 승인·보류
4. 요약 카드 — 지식 건강도, Learning 필요 영역, Unlearning 후보
5. 상세 패널 — 성능 영향도, 최신성, 참조 수, 변경 이유, 연관 지식, 승인 박스
6. 지식 변경 이력

## 그래프 조작

| 입력 | 결과 |
| --- | --- |
| 노드에 마우스 올리기 | 요약 툴팁, 연결된 노드·선 강조, 나머지는 흐림 |
| 노드 클릭·탭 | 선택 → 선택 바와 상세 패널 갱신 |
| 분야 노드(허브) 클릭 | 해당 분야만 보기 (다시 누르면 해제, 필터 칩과 동기화) |
| 가운데 에이전트 클릭 | 필터 초기화 |
| Ctrl/⌘ + 스크롤, 핀치 | 확대·축소 (0.5~3배). 1.8배 이상이면 작은 노드 이름 표시 |
| 빈 곳 드래그 | 이동. "맞춤" 버튼으로 원위치 |
| Esc | 선택 해제 |
| 목록으로 보기 | 같은 데이터를 표로 보기 (키보드·스크린 리더용) |

모바일(820px 미만)에서는 그래프가 지도처럼 동작합니다. 축소 상태에서 작은 노드를 탭하면 그 위치로 확대되고, 확대된 상태에서 탭하면 선택됩니다.

## 승인 흐름

승인·보류·되돌리기는 낙관적 업데이트로 즉시 반영되고, 서버 응답으로 다시 맞춰집니다. 한 번의 결정으로 노드, 선택 바·상세 패널, 지식 건강도, 흐름 4단계, 요약 카드, 변경 이력 6곳이 함께 바뀌며, 실패하면 원래 상태로 되돌린 뒤 안내 메시지를 띄웁니다.

## 폴더 구조

```text
src/
  main.tsx                    # QueryClient, Mock 시작
  styles/tokens.css           # 디자인 토큰 (Figma 변수와 1:1, 그라데이션 미사용)
  shared/ui/                  # Shell(사이드바·상단 바), StatusBadge, Toast, Icons
  features/knowledge/
    api/client.ts             # API 계약
    api/hooks.ts              # TanStack Query 훅, 승인 mutation(낙관적 업데이트)
    model/types.ts            # 데이터 모델
    model/rules.ts            # 등급·크기·건강도·흐름·툴팁 위치 규칙 (+ rules.test.ts)
    store/uiStore.ts          # 선택·호버·필터(URL ?filter= 동기화)
    components/               # graph / summary / detail / pipeline / log / header
    pages/KnowledgeDashboardPage.tsx
  mocks/                      # MSW 핸들러, 메모리 DB, 시드 데이터(노드 156 + 허브 4 + 에이전트 1, 연결 249)
```

## 구현 메모

- 그래프는 SVG(연결선) + DOM 버튼(노드)으로 그립니다. 노드 수백 개 수준에서는 디자인을 그대로 재현하고 접근성을 챙기기에 유리합니다. 노드가 2,000개 이상으로 늘면 명세서대로 Sigma.js(WebGL)로 `GraphCanvas`만 교체하면 됩니다(props는 그대로 유지).
- 노드 좌표는 서버 레이아웃 결과(720×600 좌표계)를 그대로 씁니다.
- Mock 데이터는 새로고침하면 초기 상태로 돌아갑니다.
