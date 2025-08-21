// 날짜 처리 유틸리티 함수들
// 타임존 문제를 해결하기 위한 로컬 날짜 기준 처리

/**
 * Date 객체를 로컬 타임존 기준 YYYY-MM-DD 형식 문자열로 변환
 * UTC 변환으로 인한 날짜 오차를 방지
 */
export function formatDateToLocal(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * YYYY-MM-DD 형식 문자열을 로컬 타임존 기준 Date 객체로 변환
 * UTC 변환으로 인한 날짜 오차를 방지
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) {
    return new Date();
  }
  
  const [year, month, day] = dateString.split('-').map(Number);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return new Date();
  }
  
  // 로컬 타임존 기준으로 Date 객체 생성 (month는 0-based이므로 -1)
  return new Date(year, month - 1, day);
}

/**
 * 두 날짜가 같은 날인지 비교 (시간 무시)
 */
export function isSameDate(date1: Date, date2: Date): boolean {
  if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime())) {
    return false;
  }
  
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * 현재 날짜를 로컬 타임존 기준으로 가져오기
 */
export function getCurrentLocalDate(): Date {
  return new Date();
}

/**
 * Date 객체를 한국어 형식으로 포맷 (예: 2024. 1. 15.)
 */
export function formatDateToKorean(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return '';
  }
  
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
}

/**
 * Date 객체를 한국어 요일 포함 형식으로 포맷 (예: 2024. 1. 15. (월))
 */
export function formatDateToKoreanWithWeekday(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return '';
  }
  
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short'
  });
}

/**
 * 날짜 유효성 검사
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * 날짜 문자열 유효성 검사 (YYYY-MM-DD 형식)
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString) return false;
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = parseLocalDate(dateString);
  return isValidDate(date) && formatDateToLocal(date) === dateString;
}

/**
 * 두 날짜 사이의 일수 계산
 */
export function daysBetween(date1: Date, date2: Date): number {
  if (!isValidDate(date1) || !isValidDate(date2)) {
    return 0;
  }
  
  const oneDay = 24 * 60 * 60 * 1000; // 밀리초 단위 하루
  const firstDate = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const secondDate = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  
  return Math.round((secondDate.getTime() - firstDate.getTime()) / oneDay);
}

/**
 * 날짜에 일수 더하기
 */
export function addDays(date: Date, days: number): Date {
  if (!isValidDate(date)) {
    return new Date();
  }
  
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 오늘 날짜인지 확인
 */
export function isToday(date: Date): boolean {
  return isSameDate(date, new Date());
}

/**
 * 과거 날짜인지 확인
 */
export function isPastDate(date: Date): boolean {
  if (!isValidDate(date)) return false;
  
  const today = new Date();
  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  return compareDate.getTime() < todayDate.getTime();
}

/**
 * 미래 날짜인지 확인
 */
export function isFutureDate(date: Date): boolean {
  if (!isValidDate(date)) return false;
  
  const today = new Date();
  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  return compareDate.getTime() > todayDate.getTime();
}