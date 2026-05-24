# Floral Studio

온라인 꽃 예약 주문 및 관리자 운영 시스템 프로젝트입니다.

## MVP

의존성 설치 없이 브라우저에서 바로 실행할 수 있는 정적 MVP입니다. 데이터는 브라우저 `localStorage`에 저장됩니다.

- 고객 주문: `index.html`
- 관리자: `admin.html`
- 공통 로직: `src/app.js`
- 스타일: `src/styles.css`

## Design

Google Material Design 3 방향에 맞춰 디자인 토큰, filled button, tonal button, outlined input, card, badge, tab 스타일을 CSS로 구현했습니다. 별도 빌드 도구나 Material Web 패키지는 사용하지 않습니다.

## Reservation Time Policy

- 픽업 시간은 선택식으로만 입력합니다.
- 선택 가능 시간은 `09:00`부터 `18:00`까지입니다.
- 분 단위는 `00분`, `30분`만 제공합니다.
- 배송 시간대는 `09:00~18:00` 사이의 정해진 시간대만 제공합니다.
- 수령 가능 최소 시점은 현재 시각 기준 `+3시간`입니다.
- `+3시간`이 `18:00`을 넘으면 다음날 `09:00`이 기본 수령 시점으로 선택됩니다.
- 수령 날짜와 픽업 시간은 가장 빠른 가능 시점으로 자동 선택됩니다.

## Product Images

상품별 기본 대표 이미지는 실제 사진 느낌의 로컬 JPG 에셋으로 `assets/`에 포함되어 있습니다.

- 꽃다발: `assets/bouquet-photo.jpg`
- 꽃바구니: `assets/basket-photo.jpg`
- 화분: `assets/plant-photo.jpg`
- 맞춤주문: `assets/custom-photo.jpg`

고객 주문 화면의 상품 카드와 관리자 상품관리 화면에서 대표 이미지를 표시합니다. 관리자 권한은 이미지 경로를 수정할 수 있고, 직원 권한은 이미지 경로를 수정할 수 없습니다.

출처는 [Asset Credits](docs/asset-credits.md)에 정리했습니다.

정적 MVP에서는 서버 업로드가 없으므로, 관리자에서 로컬 이미지 파일을 선택하면 브라우저가 이미지를 data URL로 읽어 `localStorage`에 저장합니다. 실제 운영 버전에서는 이 부분을 서버 또는 스토리지 업로드로 교체해야 합니다.

## Delivery Policy

- 배송 가능 지역은 일산으로 한정합니다.
- MVP에서는 `고양시 일산동구`, `고양시 일산서구`만 선택 가능합니다.
- 배송비는 자동 계산하지 않고 `퀵배송비 별도`로 안내합니다.
- 주문 확정 전 관리자가 실제 퀵배송비를 안내하는 운영 방식입니다.
- 배송 주소는 우편번호 검색 모달에서 도로명 또는 동/번지 기준으로 검색해 선택합니다.

## Supabase Storage

현재 세션에는 Supabase MCP 실행 도구가 노출되어 있지 않아 DB 테이블을 직접 생성하지는 못했습니다. 대신 Supabase REST 저장 어댑터와 SQL 스키마를 추가했습니다.

설정 절차:

1. Supabase SQL editor에서 [supabase/schema.sql](supabase/schema.sql)을 실행합니다.
2. [src/config.js](src/config.js)에 프로젝트 URL과 anon key를 입력합니다.
3. `useSupabase`를 `true`로 변경합니다.

예시는 [src/config.example.js](src/config.example.js)를 참고하세요.

저장 방식:

- Supabase 설정이 있으면 `public.app_state` 테이블에 전체 앱 상태를 JSONB로 저장합니다.
- Supabase 연결 실패 또는 설정이 없으면 기존처럼 `localStorage`에 저장합니다.
- MVP 구조를 유지하기 위한 단일 문서 저장 방식이며, 운영 버전에서는 주문/상품/고객 테이블을 정규화하는 것을 권장합니다.

## 실행 방법

`index.html` 또는 `admin.html`을 브라우저에서 열면 됩니다.

관리자 화면에서는 다음 기능을 확인할 수 있습니다.

- 대시보드 요약 지표
- 주문 목록/상세/상태 변경
- 수령일 기준 시간대별 주문 보기
- 상품 판매 가능 여부 및 기본 정보 관리
- 고객 메모/태그 관리
- 문자 알림을 대체하는 알림 로그

## 구현된 MVP 이슈

- #1 프로젝트 초기 세팅 및 기본 구조 구성
- #2 고객 주문 플로우 구현
- #3 상품 옵션 및 가격 정책 모델 구현
- #4 픽업/배송 및 지역별 배송비 기능 구현
- #5 관리자 주문관리 구현
- #6 관리자 대시보드 및 주문 캘린더 구현
- #7 상품관리 및 직원 권한 구현
- #8 고객관리, 메모, 태그 기능 구현
- #9 문자 알림 기능 구현
- #10 테스트 운영 및 오픈 체크리스트 정리

## Documents

- [MVP PRD](docs/PRD.md)
