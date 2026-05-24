# PRD: Supabase DB 저장 연동

## 1. 배경

현재 MVP는 브라우저 `localStorage`에 주문, 상품, 고객, 알림 데이터를 저장한다. 이 방식은 같은 브라우저에서만 데이터가 유지되고, 다른 기기나 다른 관리자와 데이터를 공유할 수 없다.

Supabase MCP 서버가 세션에 노출되어 있지 않아 이 작업에서 직접 Supabase 프로젝트에 테이블을 생성할 수는 없다. 대신 앱 코드와 SQL 스키마를 준비해 Supabase 프로젝트 URL과 anon key를 설정하면 DB에 저장되도록 구현한다.

## 2. 목표

- 주문, 상품, 고객, 알림 데이터를 Supabase DB에 저장한다.
- Supabase 설정이 없거나 연결 실패 시 기존 `localStorage` fallback으로 동작한다.
- 정적 MVP 구조를 유지한다.
- Supabase 테이블 생성 SQL을 문서화한다.

## 3. 저장 방식

MVP에서는 전체 앱 상태를 단일 JSONB 문서로 저장한다.

테이블:

- `app_state`

컬럼:

- `id text primary key`
- `data jsonb not null`
- `updated_at timestamptz not null default now()`

레코드:

- `id = 'default'`
- `data = { products, deliveryAreas, orders, customers, notifications }`

## 4. 포함 범위

- Supabase REST 저장 어댑터
- `localStorage` fallback
- 설정 파일 예시
- SQL 스키마 문서
- README 설정 안내

## 5. 제외 범위

- Supabase 프로젝트 생성
- MCP를 통한 직접 테이블 생성
- Row Level Security 세부 정책 운영 설계
- 정규화된 주문/상품/고객 테이블 분리
- 서버 사이드 API

## 6. 완료 기준

- Supabase 설정이 있으면 `app_state` 테이블에서 상태를 읽고 저장한다.
- 설정이 없으면 기존처럼 `localStorage`를 사용한다.
- 저장 실패 시 사용자 데이터 유실을 막기 위해 `localStorage`에 fallback 저장한다.
- JavaScript 문법 검사가 통과한다.
