# API 구현 가이드

## 현재 상태
현재 예약 시스템은 프론트엔드만 구현되어 있으며, 예약 데이터는 React state로 관리되고 있습니다.

## API 구현 옵션

### 1. Supabase 사용 (권장)
Figma Make에서 Supabase 연결을 지원하므로 가장 간편한 방법입니다.

**테이블 구조:**
```sql
-- reservations 테이블
CREATE TABLE reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('vehicle', 'space')),
  resource_id VARCHAR(50) NOT NULL,
  resource_name VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reserved_by VARCHAR(100) NOT NULL,
  purpose TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- resources 테이블 (선택사항)
CREATE TABLE resources (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('vehicle', 'space'))
);
```

**필요한 API 엔드포인트:**
- `GET /api/reservations?year=2025&month=1` - 월별 예약 조회
- `POST /api/reservations` - 새 예약 생성
- `DELETE /api/reservations/:id` - 예약 삭제
- `PUT /api/reservations/:id` - 예약 수정 (향후)

### 2. 다른 백엔드 옵션
- **Firebase Firestore**: 실시간 업데이트 지원
- **Node.js + Express + MongoDB/PostgreSQL**: 완전한 커스텀 API
- **Next.js API Routes**: 풀스택 React 애플리케이션

## 프론트엔드 수정사항

### 1. API 서비스 함수 생성
```typescript
// utils/api.ts
export interface ReservationAPI {
  id: string;
  type: 'vehicle' | 'space';
  resourceId: string;
  resourceName: string;
  date: string; // ISO date string
  startTime: string;
  endTime: string;
  reservedBy: string;
  purpose: string;
}

export async function fetchReservations(year: number, month: number): Promise<ReservationAPI[]> {
  const response = await fetch(`/api/reservations?year=${year}&month=${month}`);
  return response.json();
}

export async function createReservation(reservation: Omit<ReservationAPI, 'id'>): Promise<ReservationAPI> {
  const response = await fetch('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reservation),
  });
  return response.json();
}

export async function deleteReservation(id: string): Promise<void> {
  await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
}
```

### 2. App.tsx 수정
```typescript
// 현재 하드코딩된 reservations state를 API 호출로 변경
const [reservations, setReservations] = useState<Reservation[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadReservations() {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const apiReservations = await fetchReservations(year, month);
      
      // API 데이터를 앱 내부 형식으로 변환
      const formattedReservations = apiReservations.map(r => ({
        ...r,
        date: new Date(r.date)
      }));
      
      setReservations(formattedReservations);
    } catch (error) {
      console.error('Failed to load reservations:', error);
    } finally {
      setLoading(false);
    }
  }
  
  loadReservations();
}, [currentDate]); // currentDate 변경시 재로딩
```

### 3. 예약 생성/삭제 함수 수정
```typescript
const handleReservation = async (reservation: Omit<Reservation, 'id'>) => {
  try {
    const apiReservation = {
      ...reservation,
      date: reservation.date.toISOString().split('T')[0]
    };
    
    const newReservation = await createReservation(apiReservation);
    
    setReservations(prev => [...prev, {
      ...newReservation,
      date: new Date(newReservation.date)
    }]);
    
    setIsFormOpen(false);
  } catch (error) {
    console.error('Failed to create reservation:', error);
    alert('예약 생성에 실패했습니다.');
  }
};

const handleDeleteReservation = async (id: string) => {
  try {
    await deleteReservation(id);
    setReservations(prev => prev.filter(r => r.id !== id));
  } catch (error) {
    console.error('Failed to delete reservation:', error);
    alert('예약 삭제에 실패했습니다.');
  }
};
```

## 다음 단계

1. **Supabase 연결** (추천): Figma Make의 Supabase 연결 도구 사용
2. **테이블 생성**: 위의 SQL로 필요한 테이블 생성
3. **API 함수 구현**: utils/api.ts 파일 생성
4. **App.tsx 수정**: 하드코딩된 데이터를 API 호출로 변경
5. **에러 처리 및 로딩 상태** 추가
6. **실시간 업데이트** (선택사항): 다른 사용자의 예약 변경사항 실시간 반영

이렇게 구현하면 완전한 데이터베이스 기반 예약 시스템이 완성됩니다!