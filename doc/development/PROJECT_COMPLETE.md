# Event Storming Tool - 프로젝트 현황 (2026-02)

## 상태

- Domain Layer: 완료
- Application Layer: 완료
- Infrastructure Layer: 완료
- Presentation Layer: 완료
- 테스트: 통과 (`npm test`)
- 빌드: 통과 (`npm run build`)

## 최근 반영 사항

### 1) 저장 안정성/설정

- 기본 저장 위치를 `~/.event_storming_tool/boards`로 통일
- 앱 설정을 `~/.event_storming_tool/.config`에서 관리
- 보드 메타데이터 인덱스(`.board-index.json`) 추가
- 파일 저장을 원자적 저장(임시 파일 후 rename) 방식으로 변경

### 2) 시작/복구 UX

- 앱 시작 시 기존 보드 목록이 있으면 선택 모달 제공
- 새 Event Storming 시작 시 이름 입력 후 즉시 파일 생성
- 저장 경로 변경 모달 제공
- 저장 경로 변경 시 해당 경로 기준으로 보드 목록 재로딩

## 현재 핵심 사용자 시나리오

1. 앱 시작
2. 기존 보드 이어하기 또는 새 보드 생성
3. 이벤트 편집 작업
4. 변경 시 즉시 안전 저장
5. 앱 재실행 후 동일 보드 이어서 작업

## 주의 사항

- 보드 식별자는 UUID이며 파일명은 `이름 slug + UUID` 형식입니다.
- 과거 UUID 기반 단일 파일명 보드도 fallback으로 로딩합니다.

## 참조

- Presentation 현황: `doc/development/PRESENTATION_LAYER_DONE.md`
- Infrastructure 현황: `doc/development/INFRASTRUCTURE_LAYER_DONE.md`
