# 구로삶터 예약시스템

차량 4대(라떼, 핑크, 흰둥이, 베이지)와 공간 2곳(회의실, 강당)을 예약할 수 있는 웹 애플리케이션입니다.

## 주요 기능

- 📅 **달력 기반 예약** - 월별/주별 뷰 지원
- 🚗 **차량 예약** - 4대 차량 실시간 예약 관리
- 🏢 **공간 예약** - 회의실(20명), 강당(60명) 예약
- ⚡ **실시간 충돌 검사** - 중복 예약 방지
- 📱 **반응형 디자인** - 모바일/태블릿/데스크톱 지원
- 🎨 **직관적인 UI** - 자원별 색상 테마 적용

## 기술 스택

- **Frontend**: React 18, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: React Hooks
- **Styling**: Noto Sans KR, 파스텔 그라디언트

## 설치 및 실행

1. **저장소 클론**
```bash
git clone <repository-url>
cd gurosamter-reservation-system
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
`.env.local` 파일을 생성하고 다음 내용을 추가:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DB_URL=your_supabase_db_url
```

4. **개발 서버 시작**
```bash
npm run dev
```

애플리케이션이 `http://localhost:3000`에서 실행됩니다.

## 프로젝트 구조

```
├── components/          # React 컴포넌트
│   ├── ui/             # shadcn/ui 컴포넌트
│   ├── CustomCalendar.tsx
│   ├── ReservationForm.tsx
│   └── ...
├── utils/              # 유틸리티 함수
│   ├── api.ts          # Supabase API
│   ├── localStorageApi.ts
│   └── ...
├── supabase/           # Supabase 설정
│   └── functions/
├── styles/             # 글로벌 스타일
└── App.tsx            # 메인 애플리케이션
```

## 예약 리소스

### 차량 (4대)
- 🟡 **라떼** - 20노1803
- 🩷 **핑크** - 128무6370  
- ⚪ **흰둥이** - 221무7249
- 🟤 **베이지** - 379로5193

### 공간 (2곳)
- 🔵 **회의실** - 20명 수용
- 🟢 **강당** - 60명 수용

## 개발 가이드

### 새로운 컴포넌트 추가
```bash
# components/ 디렉토리에 새 파일 생성
touch components/NewComponent.tsx
```

### API 함수 수정
- Supabase API: `utils/api.ts`
- 로컬 스토리지 API: `utils/localStorageApi.ts`

### 스타일 커스터마이징
- 글로벌 스타일: `styles/globals.css`
- 컴포넌트별 스타일: Tailwind CSS 클래스 사용

## 배포

### Vercel 배포
```bash
npm install -g vercel
vercel --prod
```

### Netlify 배포
```bash
npm run build
# dist/ 폴더를 Netlify에 업로드
```

## 라이센스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 기여하기

1. Fork 프로젝트
2. 새 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 지원

문제가 있으시면 [Issues](../../issues) 페이지에 등록해 주세요.