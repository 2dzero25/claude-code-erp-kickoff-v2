# Tech Stack (Lab adaptation)

이 프로젝트는 의도적으로 좁힌 스택을 사용한다. Supabase/RLS/외부 서비스 같은 hosted 인프라 전제는 사용하지 않는다.

## 사용하는 것

- **Next.js 15** (App Router)
- **TypeScript** (strict 모드)
- **Tailwind CSS v4** (UI 최소 스타일링용)
- **Vitest** (Domain/Application/Infrastructure 단위 테스트)
- **npm** (lock 파일 git 포함)

## 사용하지 않는 것

- 외부 hosted DB (Supabase, Postgres, MySQL 등)
- ORM (Prisma, Drizzle 등)
- 인증/세션 라이브러리 (NextAuth, Supabase Auth 등)
- 결제, 메일, SMS, 외부 API 연동
- 상태관리 라이브러리 (Redux, Zustand 등)
- shadcn/ui 또는 별도 UI 라이브러리

## Repository 정책

- 모든 repository는 `src/infrastructure/repositories/`의 **in-memory 구현체**만 사용한다.
- seed data는 `src/infrastructure/data/*.json`에 둔다.
- 영속성, RLS, 트랜잭션, 마이그레이션, 인덱싱은 이 프로젝트 범위 밖이다.

## 새 패키지 추가 정책

- 새 npm 패키지를 추가하기 전에 plan에서 이유와 대안을 먼저 제시한다.
- "이미 가지고 있는 의존성으로 가능한가?"를 먼저 검토한다.
- 의존성 추가가 정말 필요한 경우라도 dev/optional 구분을 명확히 한다.

## 디렉토리 단축 별칭

- `@/*` → `./src/*` (tsconfig.json `paths` 참고)
