import { projectId, publicAnonKey } from './supabase/info';

// API 베이스 URL
const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-3e989cb8`;

// API 예약 데이터 타입
export interface ReservationAPI {
  id: string;
  type: 'vehicle' | 'space';
  resourceId: string;
  resourceName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  reservedBy: string;
  purpose: string;
  createdAt: string;
}

// 리소스 타입
export interface Resource {
  id: string;
  name: string;
  type: 'vehicle' | 'space';
}

// API 에러 타입
export interface APIError {
  error: string;
  conflicts?: Array<{
    id: string;
    time: string;
    reservedBy: string;
  }>;
}

// HTTP 요청 헬퍼 함수
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData: APIError = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`
    }));
    
    console.error(`API Error (${response.status}):`, errorData);
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// 월별 예약 조회
export async function fetchReservations(year: number, month: number): Promise<ReservationAPI[]> {
  try {
    console.log(`Fetching reservations for ${year}-${month}`);
    const reservations = await apiRequest<ReservationAPI[]>(
      `/api/reservations?year=${year}&month=${month}`
    );
    console.log(`Retrieved ${reservations.length} reservations`);
    return reservations;
  } catch (error) {
    console.error('Failed to fetch reservations:', error);
    throw error;
  }
}

// 새 예약 생성
export async function createReservation(
  reservation: Omit<ReservationAPI, 'id' | 'createdAt'>
): Promise<ReservationAPI> {
  try {
    console.log('Creating reservation:', reservation);
    const newReservation = await apiRequest<ReservationAPI>(
      '/api/reservations',
      {
        method: 'POST',
        body: JSON.stringify(reservation),
      }
    );
    console.log('Reservation created:', newReservation.id);
    return newReservation;
  } catch (error) {
    console.error('Failed to create reservation:', error);
    throw error;
  }
}

// 예약 삭제
export async function deleteReservation(id: string): Promise<void> {
  try {
    console.log('Deleting reservation:', id);
    await apiRequest(`/api/reservations/${id}`, {
      method: 'DELETE',
    });
    console.log('Reservation deleted:', id);
  } catch (error) {
    console.error('Failed to delete reservation:', error);
    throw error;
  }
}

// 리소스 목록 조회
export async function fetchResources(): Promise<Resource[]> {
  try {
    console.log('Fetching resources');
    const resources = await apiRequest<Resource[]>('/api/resources');
    console.log(`Retrieved ${resources.length} resources`);
    return resources;
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    throw error;
  }
}

// 헬스체크
export async function healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
  try {
    return await apiRequest('/health');
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

// 예약 충돌 에러 확인 유틸리티
export function isConflictError(error: Error): boolean {
  return error.message.includes('Time conflict detected');
}

// 날짜/시간 변환 유틸리티
export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

export function parseAPIDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}