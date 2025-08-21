import { Reservation } from '../App';

// 시간을 분 단위로 변환
export const timeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// 두 시간 범위가 겹치는지 확인
export const timeRangesOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);

  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
};

// 특정 예약이 기존 예약들과 충돌하는지 확인
export const checkReservationConflict = (
  newReservation: {
    resourceId: string;
    date: Date;
    startTime: string;
    endTime: string;
  },
  existingReservations: Reservation[],
  excludeId?: string
): { hasConflict: boolean; conflictingReservation?: Reservation } => {
  // 같은 날짜, 같은 리소스의 예약들 필터링
  const conflictingReservations = existingReservations.filter(reservation => {
    // 수정 시 자기 자신은 제외
    if (excludeId && reservation.id === excludeId) {
      return false;
    }
    
    return (
      reservation.resourceId === newReservation.resourceId &&
      reservation.date.toDateString() === newReservation.date.toDateString()
    );
  });

  // 시간 충돌 검사
  for (const reservation of conflictingReservations) {
    if (timeRangesOverlap(
      newReservation.startTime,
      newReservation.endTime,
      reservation.startTime,
      reservation.endTime
    )) {
      return {
        hasConflict: true,
        conflictingReservation: reservation
      };
    }
  }

  return { hasConflict: false };
};

// 예약 시간 유효성 검사
export const validateReservationTime = (startTime: string, endTime: string): { isValid: boolean; error?: string } => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes >= endMinutes) {
    return {
      isValid: false,
      error: '종료 시간은 시작 시간보다 늦어야 합니다.'
    };
  }

  if (endMinutes - startMinutes < 30) {
    return {
      isValid: false,
      error: '최소 30분 이상 예약해야 합니다.'
    };
  }

  return { isValid: true };
};

// 예약 가능한 시간대 조회 (선택사항)
export const getAvailableTimeSlots = (
  resourceId: string,
  date: Date,
  existingReservations: Reservation[],
  slotDuration: number = 60 // 분 단위
): string[] => {
  const dayReservations = existingReservations.filter(reservation =>
    reservation.resourceId === resourceId &&
    reservation.date.toDateString() === date.toDateString()
  );

  const availableSlots: string[] = [];
  const startHour = 6; // 06:00부터
  const endHour = 22; // 22:00까지

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endMinutes = hour * 60 + minute + slotDuration;
      const endHour = Math.floor(endMinutes / 60);
      const endMinute = endMinutes % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

      // 22:00를 넘어가면 중단
      if (endHour >= 22) break;

      // 충돌 검사
      const hasConflict = dayReservations.some(reservation =>
        timeRangesOverlap(startTime, endTime, reservation.startTime, reservation.endTime)
      );

      if (!hasConflict) {
        availableSlots.push(startTime);
      }
    }
  }

  return availableSlots;
};