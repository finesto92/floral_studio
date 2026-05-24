# PRD: Supabase DB 저장 연동

## 1. 배경

현재 MVP는 브라우저 `localStorage`에 주문, 상품, 고객, 알림 데이터를 저장한다. 이 방식은 같은 브라우저에서만 데이터가 유지되고, 다른 기기나 다른 관리자와 데이터를 공유할 수 없다.

Supabase MCP 서버가 세션에 노출되어 있지 않아 이 작업에서 직접 Supabase 프로젝트에 테이블을 생성할 수는 없다. 대신 앱 코드와 SQL 스키마를 준비해 Supabase 프로젝트 URL과 secret key를 서버 환경변수로 설정하면 DB에 저장되도록 구현한다.

## 2. 목표

- 주문, 상품, 고객, 알림 데이터를 Supabase DB에 저장한다.
- Supabase 설정이 없거나 연결 실패 시 기존 `localStorage` fallback으로 동작한다.
- 정적 MVP 구조를 유지한다.
- Supabase 테이블 생성 SQL을 문서화한다.

## 3. 저장 방식

MVP 저장은 서버 프록시를 통해 Supabase 테이블에 저장한다.

테이블:

- `floral_products`
- `floral_delivery_areas`
- `floral_orders`
- `floral_customers`
- `floral_notifications`

브라우저는 기존 앱 상태 객체를 유지하고, Node 서버가 camelCase 앱 상태와 snake_case DB row를 변환한다.

## 4. 포함 범위

- Supabase REST 저장 어댑터
- Node 로컬 서버의 `/api/state` 프록시
- 실제 DB 테이블 기반 저장/로딩
- `localStorage` fallback
- 설정 파일 예시
- SQL 스키마 문서
- README 설정 안내

## 5. 제외 범위

- Supabase 프로젝트 생성
- MCP를 통한 직접 테이블 생성
- Row Level Security 세부 정책 운영 설계
- 운영 서버 배포

## 6. 완료 기준

- Supabase 설정이 있으면 상품, 배송지역, 주문, 고객, 알림 테이블에서 상태를 읽고 저장한다.
- secret key는 브라우저 소스가 아니라 `.env.local`과 Node 서버에서만 사용한다.
- 설정이 없으면 기존처럼 `localStorage`를 사용한다.
- 저장 실패 시 사용자 데이터 유실을 막기 위해 `localStorage`에 fallback 저장한다.
- JavaScript 문법 검사가 통과한다.
