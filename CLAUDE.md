# HealthFit Admin - 프로젝트 정의서

## 프로젝트 개요

건강검진 서비스 관리를 위한 어드민 대시보드 애플리케이션.
고객 관리, 파트너 관리, 서비스코드 관리, 건강검진 리포트 조회 등의 기능을 제공한다.

- **프레임워크**: Next.js 16 (App Router, `"use client"` 컴포넌트 기반)
- **언어**: TypeScript (Strict 모드)
- **UI**: Tailwind CSS v4 + shadcn/ui (new-york 스타일)
- **상태관리**: Zustand (localStorage 영속화)
- **차트**: Recharts
- **엑셀**: XLSX (SheetJS)
- **아이콘**: Lucide React
- **개발 포트**: 9003

## 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx                    # 루트 레이아웃 (Noto Sans KR, 테마)
│   ├── page.tsx                      # / → /login 리다이렉트
│   ├── login/page.tsx                # 로그인 페이지
│   ├── dashboard/
│   │   ├── layout.tsx                # 대시보드 레이아웃 (사이드바, 헤더, AuthGuard)
│   │   ├── page.tsx                  # 대시보드 메인 (통계, 차트)
│   │   ├── customers/
│   │   │   ├── page.tsx              # 건강검진고객 리스트
│   │   │   ├── general/page.tsx      # 일반고객 리스트
│   │   │   └── [idx]/report/page.tsx # 건강검진 리포트
│   │   ├── partners/page.tsx         # 파트너(관리자) 관리
│   │   ├── service-codes/
│   │   │   ├── page.tsx              # 서비스코드 리스트
│   │   │   ├── create/page.tsx       # 서비스코드 생성
│   │   │   └── assign/page.tsx       # 서비스코드 파트너 지정
│   │   └── settings/
│   │       ├── page.tsx              # 내 정보
│   │       └── clauses/page.tsx      # 약관 관리
│   └── api/proxy/[...path]/route.ts  # API 프록시 (CORS 우회)
├── components/
│   ├── ui/                           # shadcn/ui 컴포넌트
│   ├── app-sidebar.tsx               # 사이드바 네비게이션
│   ├── auth-guard.tsx                # 인증 보호 래퍼
│   ├── dashboard-header.tsx          # 상단 헤더
│   └── report/                       # 건강검진 리포트 컴포넌트
├── lib/
│   ├── api.ts                        # API 클라이언트 (모든 엔드포인트)
│   ├── utils.ts                      # cn() 유틸리티
│   ├── permission.ts                 # 권한 체크 유틸리티
│   └── report/                       # 리포트 계산 로직
├── store/
│   └── auth.ts                       # Zustand 인증 스토어
├── hooks/
│   └── use-mobile.ts                 # 모바일 반응형 훅 (768px)
└── types/
    └── index.ts                      # 전체 타입 정의
```

## 백엔드 연동

### API 프록시 구조

브라우저 → `/api/proxy/*` (Next.js) → 백엔드 서버

- 브라우저에서는 Next.js API 프록시를 통해 CORS 우회
- `src/lib/api.ts`의 `request()` 함수가 모든 API 호출을 처리
- 지원 메서드: GET, POST, PUT, DELETE

### 주요 API 리소스

| 리소스 | 엔드포인트 | 설명 |
|--------|-----------|------|
| managerMember | `/managerMember` | 관리자/파트너 계정 |
| member | `/member` | 일반 회원 |
| checkUp | `/checkUp` | 건강검진 기록 |
| analysis | `/analysis` | 건강 분석 결과 |
| survey | `/survey` | 건강 설문 |
| serviceCode | `/serviceCode` | 서비스코드 |
| clause | `/clause` | 약관 |
| diseaseDescription | `/diseaseDescription` | 질병 설명 |
| cancerDescription | `/cancerDescription` | 암 설명 |
| cancerIncidence | `/cancerIncidence` | 암 발생률 |
| cancerIncidenceRate | `/cancerIncidenceRate` | 암 발생 비율 |

### 백엔드 서버 (별도 프로젝트)

Express.js + MySQL 기반. 별도 리포지토리에서 관리.

```
healthfit-server/
├── models/          # DB 모델 (mysql2 쿼리)
├── controllers/     # 컨트롤러
└── routes/          # 라우트 정의
```

- DB 쿼리 결과는 `data[0]`으로 접근 (mysql2 패턴)
- 서비스코드 벌크 처리: SELECT LIMIT → UPDATE BETWEEN 패턴 사용

## 인증 및 권한

### 권한 레벨

| 레벨 | 이름 | 설명 |
|------|------|------|
| 10 | SUPER_ADMIN | 최고 관리자 (삭제 등 전체 권한) |
| 9 | ADMIN | 관리자 |
| 8 | PARTNER | 파트너 |

### 인증 흐름

1. `/login` → `POST /managerMember/login/{id}` 로그인
2. Zustand 스토어에 사용자 정보 저장 (localStorage 영속화, 스토어명: `healthfit-auth`)
3. `AuthGuard` 컴포넌트가 대시보드 라우트 보호
4. 계정 상태가 "승인"인 경우만 로그인 가능

## 서비스코드 체계

### 코드 구조

`XXXX-XXXX-XXXX` 형식 (4자리-4자리-4자리 숫자)

- `serviceCodeOne`, `serviceCodeTwo`, `serviceCodeThree` 3개 필드로 분리 저장
- `serviceCodeFull` 필드에 전체 코드 저장

### 상태 정의

| 상태 | 조건 | 배지 색상 | 설명 |
|------|------|-----------|------|
| 활성 | mb_id 없음 AND service_check="N" | 녹색 | 파트너 미지정, 사용 가능 |
| 미사용 | mb_id 있음 AND service_check="N" | 주황색 | 파트너 지정됨, 아직 미사용 |
| 사용중 | mb_id 있음 AND service_check="Y" | 파란색 | 사용 완료 |

### 날짜 필드 규칙

- `createdAt`: 파트너에게 할당(assign)될 때 업데이트
- `updatedAt`: 엑셀 다운로드 시 업데이트 (다운로드 이력 추적용)

### 서비스코드 생성

- 1~10,000개 범위로 랜덤 코드 생성
- 파트너 지정 또는 미지정(mb_id=NULL) 선택 가능
- 중복 코드 자동 감지 및 건너뜀
- 저장 시 프로그레스바로 진행 상태 표시

### 파트너 할당 (벌크)

- 미할당 코드(mb_id 없음, service_check="N")를 선택한 파트너에게 지정 개수만큼 할당
- SQL: `SELECT idx ... LIMIT ?` → `UPDATE ... WHERE idx BETWEEN ? AND ?`

### 엑셀 다운로드

- 컬럼: 코드, 아이디, 파트너명, 상태, 등록일(오늘 날짜)
- 파일명: `서비스코드_{파트너명}_{날짜}.xlsx`
- 다운로드 시 해당 코드들의 `updatedAt` 자동 업데이트

## UI 스타일 가이드

### 테마 색상

- **헤더 배경**: `#1e3a5f` (다크 블루)
- **테이블 헤더**: `#4a7fb5` (블루)
- **주요 액션 버튼**: `#0BDFDF` (시안)
- **저장 버튼**: `bg-blue-500` (블루)
- **다크 모드**: next-themes 지원

### 테이블 공통 패턴

- 페이지네이션: 10건/페이지, 10개 단위 페이지 그룹
- 헤더: `bg-[#4a7fb5]` 배경 + 흰색 텍스트
- 날짜 형식: `YYYY-MM-DD`
- 상태 배지: `w-15 justify-center` + 색상별 배경

### shadcn/ui 컴포넌트

`components.json` 설정:
- 스타일: new-york
- Tailwind CSS v4 (CSS 변수 기반)
- 경로 별칭: `@/components/ui`

## 개발 가이드

### 로컬 개발

```bash
npm run dev    # 개발 서버 (포트 9003)
npm run build  # 프로덕션 빌드
npm run lint   # ESLint 검사
```

### 배포

```bash
npm run deploy  # build + PM2 재시작
```

- `output: "standalone"` 모드로 빌드
- PM2로 프로세스 관리 (앱명: healthfit-admin)

### 새 페이지 추가 시

1. `src/app/dashboard/{경로}/page.tsx` 생성 (`"use client"` 필수)
2. `src/components/app-sidebar.tsx`에 메뉴 항목 추가
3. 필요 시 `src/lib/api.ts`에 API 메서드 추가
4. 필요 시 `src/types/index.ts`에 타입 추가

### 새 API 엔드포인트 추가 시

1. 백엔드: Model → Controller → Route 순서로 추가
2. 프론트: `src/lib/api.ts`에 메서드 추가
3. 프록시는 자동 처리됨 (`[...path]` catch-all)

### 코드 컨벤션

- 모든 페이지는 `"use client"` 클라이언트 컴포넌트
- API 호출은 `src/lib/api.ts`의 함수만 사용 (직접 fetch 금지)
- 상태 관리: 페이지 로컬 상태는 `useState`, 전역은 Zustand
- UI 언어: 한국어
- Tailwind 클래스: 가능한 canonical 클래스 사용 (`w-15` > `w-[60px]`)

## 주요 데이터 모델 관계

```
ManagerMember (관리자/파트너)
  └── ServiceCode (서비스코드) ← mb_id로 연결
        └── Member (회원) ← servicecode_idx로 연결
              ├── CheckUp (건강검진)
              │     └── Analysis (분석 결과)
              └── Survey (설문)
```

## 건강검진 리포트

- 경로: `/dashboard/customers/{idx}/report`
- 6대 질병 분석: 비만, 고지혈증, 고혈압, 당뇨, 심장질환, 뇌졸중
- 암 위험도 분석: 성별에 따라 다른 암 종류 표시
- 등급 체계: 안전(SAFE), 주의(CAUTION), 경고(WARNING), 위험(DANGER)
- 생체나이 계산: `src/lib/report/metabolic-age.ts`
- 암 위험도 계산: `src/lib/report/cancer-risk.ts`
