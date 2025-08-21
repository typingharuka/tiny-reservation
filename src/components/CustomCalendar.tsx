import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Reservation } from '../App';
import { timeToMinutes } from '../utils/reservationUtils';
import { getResourceColorClasses } from '../utils/colorUtils';

interface CustomCalendarProps {
  currentDate: Date;
  view: 'month' | 'week';
  reservations: Reservation[];
  onDateChange: (date: Date) => void;
  onReservationClick?: (reservation: Reservation) => void;
  selectedDate?: Date;
}

// 한국 공휴일 정의
const koreanHolidays: { [key: string]: string } = {
  '2025-01-01': '신정',
  '2025-01-28': '설날',
  '2025-01-29': '설날',
  '2025-01-30': '설날',
  '2025-03-01': '삼일절',
  '2025-05-05': '어린이날',
  '2025-05-13': '어버이날',
  '2025-06-06': '현충일',
  '2025-08-15': '광복절',
  '2025-09-06': '추석',
  '2025-09-07': '추석',
  '2025-09-08': '추석',
  '2025-10-03': '개천절',
  '2025-10-09': '한글날',
  '2025-12-25': '크리스마스'
};

export function CustomCalendar({ 
  currentDate, 
  view, 
  reservations, 
  onDateChange,
  onReservationClick,
  selectedDate 
}: CustomCalendarProps) {
  const today = new Date();
  
  // 사용목적 텍스트 줄이기 함수
  const truncatePurpose = (purpose: string, maxLength = 8) => {
    if (purpose.length <= maxLength) return purpose;
    return purpose.substring(0, maxLength) + '...';
  };
  
  // 자원 ID를 기반으로 shortName 매핑
  const getResourceShortName = (resourceId: string) => {
    const resourceMap: { [key: string]: string } = {
      'vehicle-1': '라떼',
      'vehicle-2': '핑크', 
      'vehicle-3': '흰둥이',
      'vehicle-4': '베이지',
      'space-a': '회의실',
      'space-b': '강당'
    };
    return resourceMap[resourceId] || resourceId;
  };
  
  // 오늘로 이동하는 함수
  const goToToday = () => {
    onDateChange(today);
  };
  
  // 한국 공휴일 체크
  const isKoreanHoliday = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return koreanHolidays[dateStr];
  };
  
  // 월별 뷰 헬퍼 함수들
  const getMonthStart = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getMonthEnd = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  const getCalendarDays = (date: Date) => {
    const start = getMonthStart(date);
    const end = getMonthEnd(date);
    const startOfWeek = new Date(start);
    startOfWeek.setDate(start.getDate() - start.getDay());
    
    const days = [];
    const current = new Date(startOfWeek);
    
    while (current <= end || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // 주별 뷰 헬퍼 함수들
  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    return start;
  };

  const getWeekDays = (date: Date) => {
    const start = getWeekStart(date);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  // 특정 날짜의 예약 조회 (시간순 정렬)
  const getReservationsForDate = (date: Date) => {
    return reservations
      .filter(reservation => 
        reservation.date.toDateString() === date.toDateString()
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // 네비게이션
  const navigatePrevious = () => {
    if (view === 'month') {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() - 1);
      onDateChange(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      onDateChange(newDate);
    }
  };

  const navigateNext = () => {
    if (view === 'month') {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() + 1);
      onDateChange(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      onDateChange(newDate);
    }
  };

  const formatHeaderDate = () => {
    if (view === 'month') {
      return `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;
    } else {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${weekStart.getFullYear()}년 ${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 - ${weekEnd.getDate()}일`;
      } else {
        return `${weekStart.getFullYear()}년 ${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 - ${weekEnd.getMonth() + 1}월 ${weekEnd.getDate()}일`;
      }
    }
  };

  if (view === 'month') {
    const days = getCalendarDays(currentDate);
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="w-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={navigatePrevious} className="hover:bg-gray-100">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-medium text-gray-800">{formatHeaderDate()}</h2>
            <Button variant="ghost" size="sm" onClick={navigateNext} className="hover:bg-gray-100">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToToday}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800 border-gray-300"
          >
            <CalendarDays className="w-3 h-3" />
            오늘로 가기
          </Button>
        </div>

        {/* 모바일에서 최소 너비 적용 및 가로 스크롤 */}
        <div className="w-full overflow-x-auto">
          <div style={{ minWidth: '640px' }}>
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 mb-2">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                <div key={day} className={`p-3 text-center text-sm font-medium ${
                  index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
                }`}>
                  {day}
                </div>
              ))}
            </div>

            {/* 달력 그리드 */}
            <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7">
                  {week.map((date, dayIndex) => {
                    const dayReservations = getReservationsForDate(date);
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                    const isToday = date.toDateString() === today.toDateString();
                    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                    const cellHeight = Math.max(80, 50 + dayReservations.length * 24);

                    return (
                      <div
                        key={dayIndex}
                        className={`p-3 border-r border-b border-gray-100 flex flex-col cursor-pointer transition-all duration-200 relative ${ 
                          !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white hover:bg-gray-50'
                        } ${isToday && !isSelected ? 'bg-blue-50/40' : ''} ${ 
                          isSelected ? 'bg-violet-50 relative' : ''
                        } ${ 
                          dayIndex === 6 ? 'border-r-0' : ''
                        } ${weekIndex === weeks.length - 1 ? 'border-b-0' : ''}`}
                        style={{ minHeight: `${cellHeight}px` }}
                        onClick={() => onDateChange(date)}
                      >
                        {/* 선택된 날짜 강조 링 (오늘 날짜보다 우선) */}
                        {isSelected && (
                          <div className="absolute inset-0 rounded-md border-2 border-violet-400 bg-violet-50/50 shadow-sm pointer-events-none"></div>
                        )}
                        
                        <div className={`text-sm mb-2 relative z-10 ${ 
                          isSelected ? 'font-semibold text-violet-600' :
                          isToday ? 'font-semibold text-blue-600' : 
                          dayIndex === 0 ? 'text-red-500' : 
                          dayIndex === 6 ? 'text-blue-500' : 
                          'text-gray-700'
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1 flex-1 relative z-10">
                          {dayReservations.map((reservation) => (
                            <div
                              key={reservation.id}
                              className={`text-xs p-1.5 rounded cursor-pointer transition-all duration-150 hover:scale-105 ${getResourceColorClasses(reservation.resourceId)} border`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onReservationClick?.(reservation);
                              }}
                            >
                              <div className="font-medium truncate">{reservation.startTime} {truncatePurpose(reservation.purpose)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 주별 뷰 - 연속된 블록으로 예약 표시 (높이 축소 및 날짜 선택 가능)
  const weekDays = getWeekDays(currentDate);
  
  // 컨테이너 너비 측정을 위한 ref와 상태
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1200);

  // 컨테이너 너비 감지
  useEffect(() => {
    const measureWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
      }
    };

    measureWidth();

    const resizeObserver = new ResizeObserver(measureWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // 각 날짜별 최대 동시 예약 수 계산 (같은 시간대만)
  const getMaxOverlappingCount = (date: Date) => {
    const dayReservations = getReservationsForDate(date);
    
    if (dayReservations.length === 0) return 0;
    
    // 시간대별로 그룹화
    const timeGroups: { [timeKey: string]: Reservation[] } = {};
    dayReservations.forEach(reservation => {
      const timeKey = reservation.startTime;
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = [];
      }
      timeGroups[timeKey].push(reservation);
    });
    
    // 가장 많은 동시 예약이 있는 시간대의 예약 개수 반환
    return Math.max(...Object.values(timeGroups).map(group => group.length));
  };
  
  // 각 날짜별 최대 겹침 개수 배열 생성
  const dailyMaxOverlaps = weekDays.map(date => getMaxOverlappingCount(date));
  
  // 전체 필요 너비 계산 (스크롤 여부 판단용)
  const timeColumnWidth = 80;
  const boxWidth = 60; 
  const minColumnWidth = 80;
  const padding = 8;
  
  const requiredWidths = dailyMaxOverlaps.map(reservationCount => {
    if (reservationCount === 0) return minColumnWidth;
    const required = (reservationCount * boxWidth) + padding;
    return Math.max(required, minColumnWidth);
  });
  
  const totalRequiredWidth = timeColumnWidth + requiredWidths.reduce((sum, width) => sum + width, 0);
  const needsScrolling = totalRequiredWidth > containerWidth;
  
  // 동적 그리드 템플릿 생성 (시간 칸 + 각 날짜별 동적 폭)
  const generateGridTemplate = () => {
    // 사용 가능한 전체 너비 결정
    const availableWidth = totalRequiredWidth > containerWidth 
      ? totalRequiredWidth // 필요한 너비가 컨테이너보다 크면 필요한 만큼 사용 (스크롤 허용)
      : Math.max(containerWidth, totalRequiredWidth); // 그렇지 않으면 컨테이너 전체 너비 활용
    
    // 날짜 컬럼들이 사용할 수 있는 너비
    const dateColumnsWidth = availableWidth - timeColumnWidth;
    
    // 추가로 배분할 수 있는 너비
    const extraWidth = Math.max(0, dateColumnsWidth - requiredWidths.reduce((sum, width) => sum + width, 0));
    
    // 추가 너비를 7개 날짜 컬럼에 균등 배분
    const extraPerColumn = extraWidth / 7;
    
    const columns = [`${timeColumnWidth}px`];
    
    requiredWidths.forEach(requiredWidth => {
      const finalWidth = requiredWidth + extraPerColumn;
      columns.push(`${Math.round(finalWidth)}px`);
    });
    
    return columns.join(' ');
  };
  
  const gridTemplate = generateGridTemplate();
  
  // 예약을 위치와 높이로 변환 (축소된 높이)
  const getReservationStyle = (reservation: Reservation, xIndex = 0, totalResources = 1) => {
    const startMinutes = timeToMinutes(reservation.startTime);
    const endMinutes = timeToMinutes(reservation.endTime);
    const duration = endMinutes - startMinutes;
    
    // 6:00을 기준점(0)으로 하는 상대 위치
    const baseMinutes = 6 * 60; // 6:00 AM
    const relativeStart = startMinutes - baseMinutes;
    
    // 15분 = 1 슬롯, 각 슬롯은 1rem 높이 (기존 3rem에서 축소)
    const slotHeight = 16; // 1rem = 16px (기존 48px에서 축소)
    const minutesPerSlot = 15;
    
    // 시간 기반 y축 위치 (시간이 y축 결정)
    const top = (relativeStart / minutesPerSlot) * slotHeight;
    const height = (duration / minutesPerSlot) * slotHeight;
    
    // 예약 박스의 폭 고정
    const boxWidth = 60; // 60px로 고정
    
    // 리소스별 x축 위치 (리소스가 x축 결정)
    const leftOffset = xIndex * boxWidth;
    
    return {
      top: `${top}px`,
      height: `${Math.max(height, slotHeight)}px`,
      minHeight: `${slotHeight}px`,
      width: `${boxWidth}px`,
      left: `${leftOffset}px`
    };
  };

  // 리소스별 x축 배치 함수 (시간이 y축, 리소스가 x축)
  const findResourceColumnReservations = (reservations: Reservation[]) => {
    const result: Array<{ 
      reservation: Reservation; 
      xIndex: number; 
      totalResources: number;
    }> = [];
    
    // 모든 리소스 ID를 수집하여 x축 위치 매핑 생성
    const allResourceIds = [...new Set(reservations.map(r => r.resourceId))].sort();
    const resourceColumnMap: { [resourceId: string]: number } = {};
    allResourceIds.forEach((resourceId, index) => {
      resourceColumnMap[resourceId] = index;
    });
    
    // 각 예약에 리소스별 x축 위치 할당
    reservations.forEach(reservation => {
      result.push({
        reservation,
        xIndex: resourceColumnMap[reservation.resourceId], // 리소스별 x축 위치
        totalResources: allResourceIds.length
      });
    });
    
    return result;
  };

  // 리소스별 라인 + 시간별 x축 배치 결합 함수
  const findResourceLineAndTimeReservations = (reservations: Reservation[]) => {
    const result: Array<{ 
      reservation: Reservation; 
      resourceLineIndex: number; 
      totalResourceLines: number;
      xIndex: number;
    }> = [];
    
    // 리소스별로 그룹화하여 각 리소스에 고정된 라인 할당
    const resourceGroups: { [resourceId: string]: Reservation[] } = {};
    reservations.forEach(reservation => {
      if (!resourceGroups[reservation.resourceId]) {
        resourceGroups[reservation.resourceId] = [];
      }
      resourceGroups[reservation.resourceId].push(reservation);
    });
    
    // 리소스 ID 순서대로 정렬하여 일관된 라인 배치
    const sortedResourceIds = Object.keys(resourceGroups).sort();
    
    sortedResourceIds.forEach((resourceId, resourceLineIndex) => {
      const resourceReservations = resourceGroups[resourceId];
      
      // 같은 리소스 내에서 시간별로 그룹화
      const timeGroups: { [timeKey: string]: Reservation[] } = {};
      resourceReservations.forEach(reservation => {
        const timeKey = reservation.startTime;
        if (!timeGroups[timeKey]) {
          timeGroups[timeKey] = [];
        }
        timeGroups[timeKey].push(reservation);
      });
      
      // 각 시간별 그룹에서 x축 순서 할당
      Object.values(timeGroups).forEach(timeGroupReservations => {
        // 같은 시간대 내에서 ID로 정렬하여 일관된 순서 유지
        timeGroupReservations.sort((a, b) => a.id.localeCompare(b.id));
        
        timeGroupReservations.forEach((reservation, xIndex) => {
          result.push({
            reservation,
            resourceLineIndex, // 리소스별 고정 라인
            totalResourceLines: sortedResourceIds.length,
            xIndex // 같은 시간대 내에서의 x축 순서
          });
        });
      });
    });
    
    return result;
  };

  // 시간대별로 예약들을 그룹화하고 x축 배치하는 함수
  const findTimeBasedReservations = (reservations: Reservation[]) => {
    const result: Array<{ 
      reservation: Reservation; 
      xIndex: number; 
      totalAtSameTime: number;
    }> = [];
    
    // 시간대별로 그룹화
    const timeGroups: { [timeKey: string]: Reservation[] } = {};
    reservations.forEach(reservation => {
      const timeKey = reservation.startTime; // 시작 시간으로 그룹화
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = [];
      }
      timeGroups[timeKey].push(reservation);
    });
    
    // 각 시간대별로 x축 순서 할당
    Object.values(timeGroups).forEach(timeGroupReservations => {
      // 같은 시간대 내에서 리소스 ID로 정렬하여 일관된 순서 유지
      timeGroupReservations.sort((a, b) => a.resourceId.localeCompare(b.resourceId));
      
      timeGroupReservations.forEach((reservation, xIndex) => {
        result.push({
          reservation,
          xIndex, // 같은 시간대 내에서의 x축 순서
          totalAtSameTime: timeGroupReservations.length
        });
      });
    });
    
    return result;
  };

  // 예약들을 나란히 배치하는 함수 - 시간순으로 정렬
  const findSideBySideReservations = (reservations: Reservation[]) => {
    const result: Array<{ reservation: Reservation; index: number; total: number }> = [];
    
    // 시간순으로 정렬된 예약들을 순서대로 배치
    reservations.forEach((reservation, index) => {
      result.push({
        reservation,
        index, // 순서대로 배치
        total: reservations.length
      });
    });
    
    return result;
  };

  // 리소스별 라인 배치 + 나란히 배치 결합 함수
  const findResourceLineReservations = (reservations: Reservation[]) => {
    const result: Array<{ 
      reservation: Reservation; 
      resourceLineIndex: number; 
      totalResourceLines: number;
      indexInResource: number;
    }> = [];
    
    // 리소스별로 그룹화하여 각 리소스에 고정된 라인 할당
    const resourceGroups: { [resourceId: string]: Reservation[] } = {};
    reservations.forEach(reservation => {
      if (!resourceGroups[reservation.resourceId]) {
        resourceGroups[reservation.resourceId] = [];
      }
      resourceGroups[reservation.resourceId].push(reservation);
    });
    
    // 리소스 ID 순서대로 정렬하여 일관된 라인 배치
    const sortedResourceIds = Object.keys(resourceGroups).sort();
    
    sortedResourceIds.forEach((resourceId, resourceLineIndex) => {
      const resourceReservations = resourceGroups[resourceId];
      
      // 같은 리소스 내에서 시간순 정렬
      resourceReservations.sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      // 같은 리소스의 예약들을 나란히 배치
      resourceReservations.forEach((reservation, indexInResource) => {
        result.push({
          reservation,
          resourceLineIndex, // 리소스별 고정 라인
          totalResourceLines: sortedResourceIds.length,
          indexInResource // 같은 리소스 내에서의 순서
        });
      });
    });
    
    return result;
  };

  // 겹치는 예약 감지 함수 - 같은 리소스는 같은 라인에 배치
  const findOverlappingReservations = (reservations: Reservation[]) => {
    const result: Array<{ reservation: Reservation; overlappingIndex: number; totalOverlapping: number }> = [];
    
    // 리소스별로 그룹화하여 각 리소스에 고정된 라인 할당
    const resourceGroups: { [resourceId: string]: Reservation[] } = {};
    reservations.forEach(reservation => {
      if (!resourceGroups[reservation.resourceId]) {
        resourceGroups[reservation.resourceId] = [];
      }
      resourceGroups[reservation.resourceId].push(reservation);
    });
    
    // 리소스 ID 순서대로 정렬하여 일관된 라인 배치
    const sortedResourceIds = Object.keys(resourceGroups).sort();
    
    sortedResourceIds.forEach((resourceId, resourceIndex) => {
      const resourceReservations = resourceGroups[resourceId];
      
      // 같은 리소스 내에서 시간 겹침 확인
      resourceReservations.forEach(reservation => {
        const reservationStart = timeToMinutes(reservation.startTime);
        const reservationEnd = timeToMinutes(reservation.endTime);
        
        // 같은 리소스 내에서 겹치는 예약들 찾기
        let overlappingInResource = [reservation];
        
        resourceReservations.forEach(other => {
          if (reservation.id === other.id) return;
          
          const otherStart = timeToMinutes(other.startTime);
          const otherEnd = timeToMinutes(other.endTime);
          
          if (reservationStart < otherEnd && reservationEnd > otherStart) {
            overlappingInResource.push(other);
          }
        });
        
        // 이미 처리된 예약인지 확인
        const alreadyProcessed = result.some(item => item.reservation.id === reservation.id);
        if (!alreadyProcessed) {
          // 겹치는 예약들을 시간순으로 정렬
          overlappingInResource.sort((a, b) => a.startTime.localeCompare(b.startTime));
          
          overlappingInResource.forEach((res, indexInOverlap) => {
            result.push({
              reservation: res,
              overlappingIndex: resourceIndex, // 리소스별 고정 라인
              totalOverlapping: sortedResourceIds.length // 전체 리소스 수
            });
          });
        }
      });
    });
    
    return result;
  };

  // 시간대 우선 + 리소스별 y축 배치 함수
  const findTimeFirstReservations = (reservations: Reservation[]) => {
    const result: Array<{ 
      reservation: Reservation; 
      resourceLineIndex: number; 
      totalResourceLines: number;
      xIndex: number;
    }> = [];
    
    // 먼저 모든 리소스 ID를 수집하여 y축 라인 매핑 생성
    const allResourceIds = [...new Set(reservations.map(r => r.resourceId))].sort();
    const resourceLineMap: { [resourceId: string]: number } = {};
    allResourceIds.forEach((resourceId, index) => {
      resourceLineMap[resourceId] = index;
    });
    
    // 시간대별로 그룹화 (시간 우선)
    const timeGroups: { [timeKey: string]: Reservation[] } = {};
    reservations.forEach(reservation => {
      const timeKey = reservation.startTime;
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = [];
      }
      timeGroups[timeKey].push(reservation);
    });
    
    // 각 시간대별로 x축 순서 할당
    Object.values(timeGroups).forEach(timeGroupReservations => {
      // 같은 시간대 내에서 리소스 ID로 정렬하여 일관된 x축 순서 유지
      timeGroupReservations.sort((a, b) => a.resourceId.localeCompare(b.resourceId));
      
      timeGroupReservations.forEach((reservation, xIndex) => {
        result.push({
          reservation,
          resourceLineIndex: resourceLineMap[reservation.resourceId], // 리소스별 y축 라인
          totalResourceLines: allResourceIds.length,
          xIndex // 같은 시간대 내에서의 x축 순서
        });
      });
    });
    
    return result;
  };

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={navigatePrevious} className="hover:bg-gray-100">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-medium text-gray-800">{formatHeaderDate()}</h2>
          <Button variant="ghost" size="sm" onClick={navigateNext} className="hover:bg-gray-100">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={goToToday}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-800 border-gray-300"
        >
          <CalendarDays className="w-3 h-3" />
          오늘로 가기
        </Button>
      </div>

      {/* 주별 뷰 컨테이너 - 조건부 스크롤 */}
      <div ref={containerRef} className={needsScrolling ? "w-full overflow-x-auto" : "w-full"}>
        {/* 주별 뷰 그리드 */}
        <div 
          className="bg-white rounded-lg overflow-hidden border border-gray-200" 
          style={{ 
            minWidth: needsScrolling ? `${totalRequiredWidth}px` : '100%',
            width: needsScrolling ? `${totalRequiredWidth}px` : '100%'
          }}
        >
          {/* 날짜 헤더 */}
          <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: gridTemplate }}>
            <div className="p-3 bg-gray-50 text-center text-sm font-medium text-gray-600">시간</div>
            {weekDays.map((date, index) => {
              const isToday = date.toDateString() === today.toDateString();
              const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
              return (
                <div
                  key={index}
                  className={`p-3 text-center border-l border-gray-200 cursor-pointer transition-colors duration-150 ${
                    isSelected ? 'bg-violet-50 font-semibold text-violet-600' :
                    isToday ? 'bg-blue-50/40 font-semibold text-blue-600' : 
                    'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => onDateChange(date)}
                >
                  <div className="text-sm">
                    {['일', '월', '화', '수', '목', '금', '토'][index]}
                  </div>
                  <div className={`text-base ${
                    isSelected ? 'text-violet-600' :
                    isToday ? 'text-blue-600' : 
                    'text-gray-700'
                  }`}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 시간대별 그리드 - 높이 축소 */}
          <div className="relative">
            {/* 시간 라벨 및 격자 */}
            {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((hour) => (
              <div key={hour} className="grid border-b border-gray-100" style={{ height: '64px', gridTemplateColumns: gridTemplate }}>
                <div className="p-2 bg-gray-50 border-r border-gray-200 text-sm text-gray-600 flex items-start">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {weekDays.map((date, dayIndex) => {
                  const isToday = date.toDateString() === today.toDateString();
                  const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`border-l border-gray-100 cursor-pointer relative transition-colors duration-150 ${
                        isSelected ? 'bg-violet-50/30 hover:bg-violet-50/50' :
                        isToday ? 'bg-blue-50/20 hover:bg-blue-50/30' :
                        'hover:bg-gray-50/50'
                      }`}
                      onClick={() => onDateChange(date)}
                    >
                      {/* 15분 간격 점선 */}
                      <div className="absolute top-4 left-0 right-0 border-t border-dashed border-gray-200 opacity-40"></div>
                      <div className="absolute top-8 left-0 right-0 border-t border-dashed border-gray-200 opacity-40"></div>
                      <div className="absolute top-12 left-0 right-0 border-t border-dashed border-gray-200 opacity-40"></div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* 예약 블록 오버레이 */}
            {weekDays.map((date, dayIndex) => {
              const dayReservations = getReservationsForDate(date);
              const resourceColumnReservations = findResourceColumnReservations(dayReservations);
              
              return (
                <div key={dayIndex} className="absolute inset-0">
                  <div className="grid h-full" style={{ gridTemplateColumns: gridTemplate }}>
                    <div></div> {/* 시간 라벨 공간 */}
                    {Array.from({ length: 7 }, (_, colIndex) => {
                      if (colIndex !== dayIndex) return <div key={colIndex}></div>;
                      
                      return (
                        <div key={colIndex} className="relative">
                          {resourceColumnReservations.map((item) => {
                            const { reservation, xIndex, totalResources } = item;
                            const style = getReservationStyle(reservation, xIndex, totalResources);
                            const colors = getResourceColorClasses(reservation.resourceId);
                            return (
                              <div
                                key={reservation.id}
                                className={`absolute rounded shadow-sm cursor-pointer z-10 p-1 transition-all duration-150 hover:scale-105 hover:z-30 ${colors} border hover:shadow-md`}
                                style={style}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReservationClick?.(reservation);
                                }}
                              >
                                <div className="text-xs font-medium truncate">{reservation.startTime}</div>
                                <div className="text-xs opacity-90 truncate">({reservation.reservedBy})</div>
                                <div className="text-xs opacity-90 leading-tight truncate">{reservation.purpose}</div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}