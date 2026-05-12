# Clean Architecture Guidelines

이 문서는 본 프로젝트가 따르는 **Clean Architecture**의 원칙과 폴더 구조, 구현 규칙을 정의합니다. 모든 개발은 이 가이드라인을 준수해야 합니다.

이 프로젝트의 조정 사항 두 가지:

- **Repository 구현체**는 Supabase/Prisma 대신 **in-memory 구현체**(`src/infrastructure/repositories/InMemory*Repository.ts`)를 사용한다. 자세한 사항은 [`tech-stack.md`](./tech-stack.md) 참고.
- **Composition Root** 위치는 `src/infrastructure/container.ts`에 두고, Server Action(`src/app/orders/actions.ts`)에서 이를 import해 use case를 호출한다.

## 1. 핵심 원칙 (Core Principles)

### 1.1 의존성 규칙 (The Dependency Rule)
**소스 코드 의존성은 반드시 안쪽으로만 향해야 합니다.**
- **Domain** (내부)은 아무것도 의존하지 않습니다.
- **Application**은 **Domain**에만 의존합니다.
- **Infrastructure**와 **Presentation** (외부)은 **Application**과 **Domain**에 의존합니다.

### 1.2 관심사의 분리 (Separation of Concerns)
- **비즈니스 로직**은 프레임워크(Next.js, UI)나 데이터베이스와 완전히 격리되어야 합니다.
- 웹 프레임워크를 교체하거나 데이터 저장소를 변경하더라도 비즈니스 로직은 영향을 받지 않아야 합니다.

---

## 2. 폴더 구조 (Folder Structure)

소스 코드는 `src` 디렉토리 하위에서 관리하며, 크게 **Core (내부)** 와 **Infrastructure/Details (외부)** 로 나뉩니다.

```
src/
├── core/                          # [내부 계층] 순수 비즈니스 로직 (의존성 없음)
│   ├── domain/                    # 1. 도메인 계층 (Enterprise Business Rules)
│   │   ├── entities/              #    - 핵심 비즈니스 객체 및 로직 (예: Order, Customer)
│   │   ├── policies/              #    - 도메인 정책 (예: DiscountPolicy)
│   │   └── errors/                #    - 도메인 전용 에러 클래스
│   │
│   └── application/               # 2. 애플리케이션 계층 (Application Business Rules)
│       ├── use-cases/             #    - 사용자 시나리오/유스케이스 구현
│       ├── interfaces/            #    - [Port] 외부 의존성을 위한 인터페이스 정의
│       └── dtos/                  #    - [DTO] 계층 간 데이터 전송 객체
│
├── infrastructure/                # [외부 계층] 인터페이스 구현체 (Adapters)
│   ├── repositories/              #    - Repository 인터페이스 구현 (이 프로젝트는 in-memory)
│   ├── data/                      #    - seed JSON
│   └── container.ts               #    - Composition Root (DI 조립)
│
├── app/                           # [외부 계층] 프레젠테이션 (Next.js App Router)
│   ├── orders/                    #    - 주문 페이지와 Server Actions
│   └── ...
│
└── lib/                           # 공용 유틸리티
```

---

## 3. 계층별 상세 규칙 (Layer Details)

### 3.1 Domain Layer (`src/core/domain`)
- **역할**: 전사적 비즈니스 규칙을 캡슐화합니다.
- **포함 요소**: `Entities`, `Value Objects`, `Policies`, `Domain Errors`.
- **규칙**:
    - 외부 라이브러리나 프레임워크에 의존하지 않습니다 (순수 TypeScript).
    - `class`를 사용하여 데이터와 그 데이터를 조작하는 행위(메서드)를 함께 캡슐화하는 것을 권장합니다.
    - 데이터 유효성 검증 로직이 포함됩니다.

### 3.2 Application Layer (`src/core/application`)
- **역할**: 애플리케이션의 유스케이스를 정의하고 흐름을 제어합니다.
- **포함 요소**: `Use Cases`, `DTOs`, `Repository Interfaces` (Ports).
- **규칙**:
    - **Repository Interface**를 정의만 하고 구현하지 않습니다 (Dependency Inversion).
    - 유스케이스는 `execute()`와 같은 단일 메서드를 가지는 클래스로 구현합니다.
    - 입력값과 반환값으로 **DTO**를 사용합니다.

### 3.3 Infrastructure Layer (`src/infrastructure`)
- **역할**: Application 계층에서 정의한 인터페이스를 실제로 구현합니다.
- **포함 요소**: `Repositories` (데이터 접근), `container.ts` (DI 조립).
- **규칙**:
    - 이 프로젝트에서는 in-memory 구현체로 한정합니다. (`InMemoryOrderRepository`, `InMemoryInventoryRepository`)
    - 향후 hosted DB로 교체할 때 Application 계층은 변경되지 않아야 합니다.

### 3.4 Presentation Layer (`src/app`)
- **역할**: 사용자에게 정보를 보여주고 입력을 받아 Application 계층으로 전달합니다.
- **포함 요소**: Next.js Pages, Components, Server Actions.
- **규칙**:
    - **스마트 UI(비즈니스 로직이 포함된 UI)를 피합니다.** UI는 단순히 데이터를 보여주는 역할만 해야 합니다.
    - 유스케이스 실행을 위해 필요한 의존성은 `infrastructure/container.ts`에서 조립한 인스턴스를 import해 사용합니다.

---

## 4. 의존성 주입 (Dependency Injection)

### 4.1 Composition Root 구현 예시
모든 의존성 조립은 `src/infrastructure/container.ts`에서 이루어지고, Server Action은 그 결과를 import해 사용합니다.

```typescript
// src/infrastructure/container.ts
import { ApproveOrderUseCase } from "@/core/application/use-cases/ApproveOrderUseCase";
import { InMemoryOrderRepository } from "@/infrastructure/repositories/InMemoryOrderRepository";
import { InMemoryInventoryRepository } from "@/infrastructure/repositories/InMemoryInventoryRepository";

const orderRepo = new InMemoryOrderRepository(/* seed */);
const inventoryRepo = new InMemoryInventoryRepository(/* seed */);

export const approveOrderUseCase = new ApproveOrderUseCase(orderRepo, inventoryRepo);
```

```typescript
// src/app/orders/actions.ts
"use server";

import { approveOrderUseCase } from "@/infrastructure/container";

export async function approveOrder(orderId: string) {
  return approveOrderUseCase.execute({ orderId });
}
```

---

## 5. 지켜야 할 코딩 규칙

1.  **Use Case 내부에서 인스턴스 직접 생성 금지**: `new InMemoryRepository()`와 같이 구체적인 구현체를 Use Case 내부에서 직접 생성하면 안 됩니다. 반드시 생성자를 통해 인터페이스를 주입받으세요.
2.  **DTO 사용**: Controller(UI)와 Use Case, Use Case와 Repository 간의 데이터 교환은 엔티티 자체가 아니라 DTO를 사용하는 것을 권장합니다.
3.  **단방향 참조**: UI 컴포넌트가 인프라스트럭처 코드를 직접 임포트해서는 안 됩니다. 모든 작업은 Use Case를 거쳐야 합니다 (Server Action 경유 허용).
