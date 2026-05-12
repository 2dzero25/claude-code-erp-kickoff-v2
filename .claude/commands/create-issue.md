---
description: work item 을 GitHub issue 로 등록
argument-hint: [<work-item description or paths>]
---

# /create-issue

사용자가 알려준 work item (한 줄 설명, 파일 경로, TODO 마커 위치 등) 을 분석해서 GitHub issue 로 등록한다.

## 사전 조건

- `gh auth status` 통과 — 인증 안 됐으면 안내 후 중단
- 현재 디렉토리가 GitHub remote 가 연결된 repo (`gh repo view` 통과)

## 흐름

1. **인자 / 컨텍스트 파악**
   - `$ARGUMENTS` 가 있으면 그게 work item 정의
   - 없으면 사용자에게 어떤 work item 을 issue 화 할지 묻기 (AskUserQuestion)
   - 여러 work item 이면 사용자에게 명시적으로 받음 — 임의로 decompose 하지 않는다

2. **기존 issue 점검**
   ```bash
   gh issue list --state all --search "<keyword>"
   ```
   같은 제목이 이미 있으면 중복 생성하지 않고 기존 번호 보고 후 중단.

3. **코드 분석** — issue body 채울 정보 수집
   - 관련 파일 읽고 현재 상태 (stub / 부분 구현 / TODO 마커 등) 파악
   - 사용처 / 의존성 / 관련 테스트 파일 위치
   - 필요하면 `@CLAUDE.md` 의 작업 규칙 / 도메인 spec 도 참고

4. **TDD marker 판단**
   - 테스트 파일이 이미 존재하고 work 가 code 구현이면 → issue body 에 `<!-- TDD: enabled -->` marker 추가
   - 문서 / 인프라 / 설정 작업이면 marker 생략

5. **라벨 확인**
   ```bash
   gh label list --json name
   ```
   사용 가능한 라벨 중 적합한 것만 사용. **새 라벨 자동 생성 금지** (`gh label create` 안 함).

6. **issue body draft 작성** — 사용자에게 미리보기 제공

   템플릿:
   ```markdown
   <!-- TDD: enabled -->  ← step 4 결과에 따라

   **목적**
   <한 줄로 왜 필요한지>

   **구현 단계**
   1. [ ] <step 1 — 구체적으로>
   2. [ ] <step 2>
   3. [ ] <step 3>

   **수정할 파일**
   - `path/file.ext` — <어떤 변경>

   **완료 기준**
   - [ ] 구현 완료
   - [ ] 관련 테스트 통과 (`<test command>`)
   - [ ] lint / type-check 통과
   - [ ] PR 생성 후 Claude Code Review 통과

   **의존성**
   - <없음 또는 prerequisite issue 번호>
   ```

7. **사용자 승인** — AskUserQuestion 으로 (a) 그대로 등록 / (b) 수정 후 등록 / (c) 취소

8. **issue 생성**
   ```bash
   gh issue create --title "..." --body "..." --label "..."
   ```
   결과 issue 번호 + URL 출력.

9. **검증**
   ```bash
   gh issue list --state open --limit 5
   ```
   방금 생성한 issue 가 보이는지 확인 후 다음 명령 안내:
   ```
   다음: /resolve-issue <n>
   ```

## 출력 형식

- step 6 후: issue draft 미리보기 (title / body / labels)
- step 8 후: 생성된 issue 번호 + URL + 다음 명령 안내

## 금지

- 사용자 승인 없이 `gh issue create` 실행하지 않는다
- 같은 제목 issue 가 이미 있으면 중복 생성 금지
- 새 라벨 자동 생성 금지 (`gh label create`)
- 한 명령에서 임의로 work item 을 여러 개로 decompose 하지 않는다 — 사용자가 명시한 단위만
