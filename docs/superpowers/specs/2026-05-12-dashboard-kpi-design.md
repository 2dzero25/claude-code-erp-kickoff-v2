# Spec — Dashboard KPI 페이지

> 작성일: 2026-05-12

## Context

주문 관리 페이지 (`/orders`) 만으로는 전체 운영 상태를 한눈에 볼 수 없다. 승인 대기 / 승인 완료 / 거절율 / 총 매출 같은 운영 지표를 진입과 동시에 보여주는 대시보드를 `/dashboard` 에 추가한다.

설계 원칙:

- 도메인 (Order) 변경 없이 application + UI 두 계층만 추가
- 도넛 차트는 순 SVG (새 npm 패키지 도입 없음 — CLAUDE.md "범위 제한" 부합)
- 집계 로직은 application 계층 use-case 에 둔다 (UI 침입 금지)

## 주요 결정 사항

| 항목 | 결정 |
|---|---|
| 라우팅 위치 | `/dashboard` 새 라우트, 루트 redirect 변경, Sidebar 메뉴 추가 |
| 범위 | 4 카드 + 단순 도넛 1 개 |
| 시간 필드 추가 | 안 함 — 시간 무관 KPI |
| 집계 위치 | Application 계층 use-case |
| 차트 라이브러리 | 없음 — 순 SVG |

## 1. Architecture

```
┌────────────────────────────────────────┐
│ UI 계층                                │
│                                        │
│  Server Component                      │
│  src/app/dashboard/page.tsx            │
│    └ use-case 호출 + DTO 받음          │
│    └ 자식 컴포넌트에 props 주입        │
│         │                              │
│         ├─ StatCard (×4)               │
│         └─ StatusDonut                 │
│            └ props 만 받아 렌더링      │
│                                        │
└────────────────┬───────────────────────┘
                 │ 호출
                 ▼
┌────────────────────────────────────────┐
│ Application 계층                       │
│                                        │
│  GetDashboardStatsUseCase              │
│    └ orderRepository.findAll()         │
│    └ 4 카드 + 도넛 데이터 집계         │
│    └ DashboardStatsDto 반환            │
│                                        │
└────────────────┬───────────────────────┘
                 │ 의존
                 ▼
┌────────────────────────────────────────┐
│ Infrastructure 계층                    │
│                                        │
│  InMemoryOrderRepository.findAll()     │
│                                        │
└────────────────────────────────────────┘
```

Server Component 도 UI 계층이다. CLAUDE.md 의 "UI 에 비즈니스 로직 안 섞기" 가 Server Component 에도 적용되므로 집계 계산은 절대 page.tsx 안에서 하지 않는다.

## 2. 데이터 모델 — DashboardStatsDto

신규 파일: `src/core/application/dtos/DashboardStatsDto.ts`

```ts
import type { OrderStatus } from "@/core/domain/entities/Order";

export interface DashboardStatsDto {
  pendingCount: number;
  approvedCount: number;
  approvedAmountTotal: number;
  rejectionRate: number;
  statusDistribution: Array<{
    status: OrderStatus;
    count: number;
  }>;
}
```

### 필드 의미

- `pendingCount`: `status === "PENDING_APPROVAL"` 개수
- `approvedCount`: `status === "APPROVED"` 개수
- `approvedAmountTotal`: APPROVED 주문들의 `originalAmount()` 합 (단위: 원, 정수)
- `rejectionRate`: REJECTED / (APPROVED + REJECTED). 0 ≤ x ≤ 1. 분모 0 이면 0
- `statusDistribution`: 5 상태 모두 포함 (count 가 0 이어도 항목 유지)

### 분모 정의의 명시성

`rejectionRate` 분모는 "결정된 주문" (APPROVED + REJECTED). DRAFT / PENDING_APPROVAL / CANCELLED 은 분모에 포함하지 않는다. 분모 0 일 때 NaN 대신 0 반환. 이 invariant 는 use-case 테스트에서 검증한다.

## 3. UI 구성 — 카드 4 개 + 도넛

| 위치 | 항목 | 시각 강조 |
|---|---|---|
| 카드 1 | 승인 대기 | 주황색 (우선 처리 신호) |
| 카드 2 | 승인 완료 | 무채색 |
| 카드 3 | 승인 금액 합계 | 원화 포맷, `toLocaleString("ko-KR")` |
| 카드 4 | 거절율 | 백분율 표시, 빨간색 톤 |
| 도넛 | 상태별 분포 | 5 상태 (DRAFT / PENDING / APPROVED / REJECTED / CANCELLED) |

### 도넛 구현

순 SVG `<circle>` + `stroke-dasharray` 회전. `circumference = 2 * Math.PI * r` 로 둘레를 계산해 상태별 비율로 분배. 색상은 `StatusBadge.tsx` 의 기존 색 토큰과 정렬 (5 상태 통일감 유지). 범례는 도넛 옆에 텍스트로.

데이터 0 건 (총 주문 0) 일 때는 도넛 대신 "데이터 없음" 플레이스홀더 카드.

### 컴포넌트 분리

- `src/app/dashboard/_components/StatCard.tsx` — 한 개 카드 (label, value, accent? props)
- `src/app/dashboard/_components/StatusDonut.tsx` — 도넛 + 범례 묶음
- `src/app/dashboard/page.tsx` — 데이터 가져와서 위 두 컴포넌트 조립

## 4. 라우팅 변경

| 파일 | 변경 |
|---|---|
| `src/app/page.tsx` | `redirect("/orders")` → `redirect("/dashboard")` |
| `src/app/dashboard/page.tsx` | 신규 (Server Component) |
| `src/app/dashboard/_components/StatCard.tsx` | 신규 |
| `src/app/dashboard/_components/StatusDonut.tsx` | 신규 |
| `src/app/_components/Sidebar.tsx` | `Overview` 그룹에 `Dashboard` 메뉴 추가, `is-active` 분기는 pathname 으로 |

Sidebar 의 `is-active` 분기는 현재 하드코딩이다. 이 spec 의 작업 범위 안에서 pathname 기반 active 처리도 같이 손댄다 (drive-by 가 아니라 본 변경의 일부 — Dashboard 메뉴 추가의 직접 결과).

## 5. 테스트 전략 (TDD 강제)

| 대상 | 테스트 | 위치 |
|---|---|---|
| `GetDashboardStatsUseCase.execute()` | unit (Red → Green → Refactor) | `tests/application/GetDashboardStatsUseCase.test.ts` |
| 분모 0 엣지 | unit (위 파일 안 case) | 동일 |
| 빈 저장소 (주문 0건) 엣지 | unit | 동일 |
| `StatusDonut` SVG | snapshot 또는 시각 검증 (선택) | `tests/components/StatusDonut.test.tsx` |
| 통합 (페이지 진입) | E2E (lab 에 없어 skip) | — |

### 핵심 use-case 테스트 케이스

1. 빈 저장소 → 모든 count 0, rate 0, distribution 5 항목 모두 0
2. PENDING 만 있는 케이스 → pendingCount 양수, approvedCount/approvedAmountTotal 0, rate 0
3. APPROVED + REJECTED 섞인 케이스 → rate 가 분자/분모로 정확히 계산
4. APPROVED 의 `originalAmount` 합산 검증 (라인 수량 × 단가)
5. 5 상태 모두 1건씩 있는 케이스 → distribution 정렬 + count 정확

OrderRepository fake 는 `tests/fakes/` 또는 inline 클래스로. in-memory 구현체를 그대로 써도 OK.

## 6. 변경 파일 목록

```
+ src/app/dashboard/page.tsx
+ src/app/dashboard/_components/StatCard.tsx
+ src/app/dashboard/_components/StatusDonut.tsx
+ src/core/application/use-cases/GetDashboardStatsUseCase.ts
+ src/core/application/dtos/DashboardStatsDto.ts
+ tests/application/GetDashboardStatsUseCase.test.ts
~ src/app/page.tsx
~ src/app/_components/Sidebar.tsx
```

신규 6 + 수정 2 = 8 파일.

## 종료 기준

- `npm test` 와 `npm run lint` 통과
- `/dashboard` 진입 시 4 카드 + 도넛 렌더링
- `/` 진입 시 `/dashboard` 로 redirect
- Sidebar 에 Dashboard 메뉴 노출 + 현재 페이지에 따라 active 분기
- use-case 테스트 5 케이스 모두 green
- CLAUDE.md 의 "비즈니스 로직 UI 침입 금지" invariant 위반 없음 (page.tsx 안에 reduce/filter 형태의 집계가 0)

## 비범위 (Out of Scope)

- Order 엔티티에 timestamp 필드 추가
- 시간 기반 KPI ("오늘 승인 건", "최근 24시간 추세")
- 차트 라이브러리 도입 (recharts, chart.js 등)
- Customer 등급 분포 차트
- 대시보드 새로고침 주기 설정 / WebSocket / SSE
- 권한 분기 (관리자만 보기 등)

위 항목들은 follow-up spec 으로.
