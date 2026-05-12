# 리뷰 지침

> 이 문서는 Claude Code Review 파이프라인의 모든 에이전트에게 최우선 순위로 주입된다.
> 출처: https://code.claude.com/docs/en/code-review#review-md

프로젝트 컨텍스트는 `@CLAUDE.md` 를 따른다. 이 문서는 **review 동작 자체** 만 바꾼다.

## 1. 응답 언어

모든 인라인 코멘트, top-level 요약, 체크런 출력은 **한국어** 로 쓴다.

## 2. Severity 정의

| 마커 | 이름 | 의미 |
|---|---|---|
| 🔴 | Important | 병합 전에 수정해야 하는 결함. 빌드/테스트 깨짐, 보안 취약점, 의도와 어긋난 로직, `@CLAUDE.md` 의 작업 규칙 위반. |
| 🟡 | Nit | 차단하지 않지만 짚고 가는 것. 명명 / 가독성 / early-return / 주석-코드 불일치. |
| 🟣 | Pre-existing | 이 PR 이 도입하지 않은 결함. 한 번만 짚고 본 PR 범위 밖이라고 명시. |

CRITICAL / HIGH / MEDIUM / LOW 같은 다단계는 사용하지 않는다. 위 3단계만.

## 3. Skip rules — 보고하지 않는 것

- ESLint / TypeScript / 프로젝트가 설정한 lint 가 이미 잡는 것 (formatting, 미사용 import, `any` 등 — CI 가 막는다)
- 자동 생성 파일 (`next-env.d.ts`, `*.lock`, `*.generated.*`, `dist/`, `build/`)
- 의존성 vendored 디렉토리 (`node_modules/`, `vendor/`)
- 테스트 코드 안에서 의도적으로 한 비표준 패턴 (mock 데이터 inline, fixture 의 magic number 등)
- 주관적 개선 ("이 함수 이름 더 좋게 지을 수 있을 것 같음" 류)
- diff 외부 컨텍스트 없이 검증 불가능한 추측

## 4. Nit volume cap

한 PR 에 인라인 Nit 코멘트는 **최대 5건**. 그보다 많으면 본문 요약에 `plus N similar items` 로 카운트만 적는다. 모두 Nit 이고 Important 가 없으면 본문 첫 줄을 `차단 사항 없음` 으로 시작한다.

## 5. Verification bar — 증거 기준

동작에 대한 주장은 `path:line` 인용으로 뒷받침한다.

- "이 함수가 ~ 한다" 라는 주장만 있고 인용 없으면 **Nit 으로 강등**.
- 명명만 보고 동작을 추론한 결과는 보고하지 않는다 (false positive 차단).
- diff 안에서 확인 가능한 사실만 Important 로 게시.

## 6. Re-review convergence — 재검토 수렴

같은 PR 이 두 번째 검토 이상이면:

- 첫 검토에서 Important 였던 항목이 수정됐는지 확인 후 해결된 thread 만 표시
- **새로운 Nit 은 억제**한다. Important 만 게시
- 3 라운드 초과 시: 본문 첫 줄에 `재검토 3 회 초과 — 사람 검토 필요` 명시하고 인라인 코멘트는 추가하지 않는다 (LLM 단독 무한 루프가 보안 취약점을 오히려 늘린다는 보고가 있음)

## 7. Summary shape — 요약 형식

본문 첫 줄은 한 줄 집계로 시작.

```
🔴 N건, 🟡 M건, 🟣 K건
```

- Important 가 0 이면 `차단 사항 없음.` 으로 시작
- 본문은 한국어 평어체. 칭찬 패딩 (`잘 짜셨네요`, `훌륭합니다` 등) 은 넣지 않는다
