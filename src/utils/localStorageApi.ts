import { formatDateToLocal, parseLocalDate } from './dateUtils';

// 로컬 스토리지 기반 API (즉시 작동 버전)
export interface ReservationAPI {
  id: string;
  type: 'vehicle' | 'space';
  resource_id: string;
  resource_name: string;
  date: string; // YYYY-MM-DD 형식
  start_time: string; // HH:MM 형식
  end_time: string; // HH:MM 형식
  reserved_by: string;
  purpose: string;
  created_at?: string;
}

export interface ResourceData {
  vehicles: Array<{
    id: string;
    name: string;
    type: 'vehicle';
  }>;
  spaces: Array<{
    id: string;
    name: string;
    type: 'space';
  }>;
}

// 로컬 스토리지 키
const RESERVATIONS_KEY = 'reservation_system_data';
const RESOURCES_KEY = 'reservation_system_resources';

// 기본 리소스 데이터
const defaultResources: ResourceData = {
  vehicles: [
    { id: 'vehicle-1', name: '라떼 20노1803', type: 'vehicle' },
    { id: 'vehicle-2', name: '핑크 128무6370', type: 'vehicle' },
    { id: 'vehicle-3', name: '흰둥이 221무7249', type: 'vehicle' },
    { id: 'vehicle-4', name: '베이지 379로5193', type: 'vehicle' }
  ],
  spaces: [
    { id: 'space-a', name: '회의실 20명', type: 'space' },
    { id: 'space-b', name: '강당 60명', type: 'space' }
  ]
};

// 로컬 스토리지 헬퍼 함수들
function getStoredReservations(): ReservationAPI[] {
  try {
    const stored = localStorage.getItem(RESERVATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to parse stored reservations:', error);
    return [];
  }
}

function saveReservations(reservations: ReservationAPI[]): void {
  try {
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
  } catch (error) {
    console.error('Failed to save reservations:', error);
  }
}

function getStoredResources(): ResourceData {
  try {
    const stored = localStorage.getItem(RESOURCES_KEY);
    if (stored) {
      const parsedResources = JSON.parse(stored);
      // 기존 데이터가 이전 형식인지 확인하고 업데이트
      if (parsedResources.vehicles && parsedResources.vehicles[0] && 
          (parsedResources.vehicles[0].name === '차량 1호' || 
           parsedResources.vehicles[0].name.includes('차량 1호'))) {
        console.log('Updating stored resources to new format...');
        localStorage.setItem(RESOURCES_KEY, JSON.stringify(defaultResources));
        return defaultResources;
      }
      return parsedResources;
    } else {
      // 첫 실행시 기본 리소스 저장
      localStorage.setItem(RESOURCES_KEY, JSON.stringify(defaultResources));
      return defaultResources;
    }
  } catch (error) {
    console.error('Failed to parse stored resources:', error);
    localStorage.setItem(RESOURCES_KEY, JSON.stringify(defaultResources));
    return defaultResources;
  }
}

// 예약 API 함수들
export const localReservationAPI = {
  // 월별 예약 조회
  async fetchByMonth(year: number, month: number): Promise<ReservationAPI[]> {
    await new Promise(resolve => setTimeout(resolve, 100)); // 실제 API 호출 시뮬레이션
    
    const allReservations = getStoredReservations();
    const monthlyReservations = allReservations.filter(reservation => {
      const reservationDate = new Date(reservation.date);
      return reservationDate.getFullYear() === year && 
             reservationDate.getMonth() + 1 === month;
    });
    
    console.log(`LocalStorage: Found ${monthlyReservations.length} reservations for ${year}-${month}`);
    return monthlyReservations;
  },

  // 새 예약 생성
  async create(reservation: Omit<ReservationAPI, 'id' | 'created_at'>): Promise<ReservationAPI> {
    await new Promise(resolve => setTimeout(resolve, 200)); // 실제 API 호출 시뮬레이션
    
    const allReservations = getStoredReservations();
    
    // 예약 충돌 검사
    const hasConflict = allReservations.some(existing => {
      return existing.resource_id === reservation.resource_id &&
             existing.date === reservation.date &&
             (
               (reservation.start_time >= existing.start_time && reservation.start_time < existing.end_time) ||
               (reservation.end_time > existing.start_time && reservation.end_time <= existing.end_time) ||
               (reservation.start_time <= existing.start_time && reservation.end_time >= existing.end_time)
             );
    });

    if (hasConflict) {
      throw new Error('Reservation conflict detected');
    }
    
    // 새 예약 생성
    const newReservation: ReservationAPI = {
      id: `reservation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...reservation,
      created_at: new Date().toISOString()
    };
    
    allReservations.push(newReservation);
    saveReservations(allReservations);
    
    console.log('LocalStorage: Created new reservation:', newReservation.id);
    return newReservation;
  },

  // 예약 삭제
  async delete(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 150)); // 실제 API 호출 시뮬레이션
    
    const allReservations = getStoredReservations();
    const filteredReservations = allReservations.filter(r => r.id !== id);
    
    if (filteredReservations.length === allReservations.length) {
      throw new Error('Reservation not found');
    }
    
    saveReservations(filteredReservations);
    console.log('LocalStorage: Deleted reservation:', id);
  }
};

// 리소스 API 함수들
export const localResourceAPI = {
  // 모든 리소스 조회
  async fetchAll(): Promise<ResourceData> {
    await new Promise(resolve => setTimeout(resolve, 50)); // 실제 API 호출 시뮬레이션
    
    const resources = getStoredResources();
    console.log('LocalStorage: Fetched resources');
    return resources;
  }
};

// 헬스 체크
export const localHealthAPI = {
  async check(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 10));
    console.log('LocalStorage: Health check passed');
    return true; // 로컬 스토리지는 항상 사용 가능
  }
};

// 유틸리티 함수들
export const localApiUtils = {
  // API 형식의 예약 데이터를 앱 내부 형식으로 변환
  toAppReservation(apiReservation: ReservationAPI): any {
    try {
      return {
        id: apiReservation.id,
        type: apiReservation.type,
        resourceId: apiReservation.resource_id,
        resourceName: apiReservation.resource_name,
        date: new Date(apiReservation.date),
        startTime: apiReservation.start_time,
        endTime: apiReservation.end_time,
        reservedBy: apiReservation.reserved_by,
        purpose: apiReservation.purpose,
      };
    } catch (error) {
      console.error('Failed to convert API reservation to app format:', error);
      throw new Error('데이터 형식 변환 중 오류가 발생했습니다.');
    }
  },

  // 앱 내부 형식의 예약 데이터를 API 형식으로 변환
  toApiReservation(appReservation: any): Omit<ReservationAPI, 'id' | 'created_at'> {
    try {
      return {
        type: appReservation.type,
        resource_id: appReservation.resourceId,
        resource_name: appReservation.resourceName,
        date: appReservation.date instanceof Date 
          ? formatDateToLocal(appReservation.date)
          : appReservation.date,
        start_time: appReservation.startTime,
        end_time: appReservation.endTime,
        reserved_by: appReservation.reservedBy,
        purpose: appReservation.purpose,
      };
    } catch (error) {
      console.error('Failed to convert app reservation to API format:', error);
      throw new Error('데이터 형식 변환 중 오류가 발생했습니다.');
    }
  },

  // 에러 메시지 한국어 변환
  translateError(error: Error): string {
    if (!error || !error.message) {
      return '알 수 없는 오류가 발생했습니다.';
    }
    
    const message = error.message.toLowerCase();
    
    if (message.includes('conflict')) {
      return '선택한 시간에 이미 예약이 있습니다.';
    } else if (message.includes('not found')) {
      return '예약을 찾을 수 없습니다.';
    } else if (message.includes('network') || message.includes('fetch')) {
      return '네트워크 연결을 확인해주세요.';
    } else if (message.includes('required')) {
      return '필수 정보가 누락되었습니다.';
    } else if (message.includes('timeout')) {
      return '요청 시간이 초과되었습니다. 다시 시도해주세요.';
    } else {
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
  },
};

// 로컬 스토리지 데이터 관리 함수들
export const localStorageManager = {
  // 모든 데이터 초기화
  clearAll(): void {
    try {
      localStorage.removeItem(RESERVATIONS_KEY);
      localStorage.removeItem(RESOURCES_KEY);
      console.log('LocalStorage: All data cleared');
    } catch (error) {
      console.error('Failed to clear local storage:', error);
    }
  },

  // 데이터 내보내기 (JSON 파일로 다운로드)
  exportData(): void {
    try {
      const reservations = getStoredReservations();
      const resources = getStoredResources();
      
      const exportData = {
        reservations,
        resources,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `reservation_data_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      console.log('LocalStorage: Data exported');
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  },

  // 데이터 가져오기
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.reservations && Array.isArray(data.reservations)) {
        saveReservations(data.reservations);
      }
      
      if (data.resources) {
        localStorage.setItem(RESOURCES_KEY, JSON.stringify(data.resources));
      }
      
      console.log('LocalStorage: Data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  },

  // 저장된 데이터 통계
  getStats(): { reservationCount: number; lastModified: string | null } {
    try {
      const reservations = getStoredReservations();
      return {
        reservationCount: reservations.length,
        lastModified: reservations.length > 0 
          ? reservations
              .map(r => r.created_at || '')
              .sort()
              .pop() || null
          : null
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return { reservationCount: 0, lastModified: null };
    }
  }
};