import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Reservation } from '../App';
import { getResourceColorClasses, getResourceDotColor } from '../utils/colorUtils';

interface ResourceStatusProps {
  resources: {
    vehicles: { id: string; name: string; shortName?: string }[];
    spaces: { id: string; name: string; shortName?: string }[];
  };
  selectedDate: Date;
  reservations: Reservation[];
  onResourceClick: (resourceType: 'vehicle' | 'space', resourceId: string) => void;
}

export function ResourceStatus({
  resources,
  selectedDate,
  reservations,
  onResourceClick
}: ResourceStatusProps) {
  // 특정 리소스가 선택한 날짜에 예약되어 있는지 확인
  const isResourceBooked = (resourceId: string) => {
    return reservations.some(reservation =>
      reservation.resourceId === resourceId &&
      reservation.date.toDateString() === selectedDate.toDateString()
    );
  };

  // 특정 리소스의 예약 개수 조회
  const getResourceBookingCount = (resourceId: string) => {
    return reservations.filter(reservation =>
      reservation.resourceId === resourceId &&
      reservation.date.toDateString() === selectedDate.toDateString()
    ).length;
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-gray-800">자원 현황</CardTitle>
        <p className="text-xs text-gray-500">
          {selectedDate.toLocaleDateString('ko-KR')} 기준
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-700">차량</h4>
          <div className="grid grid-cols-2 gap-2">
            {resources.vehicles.map(vehicle => {
              const isBooked = isResourceBooked(vehicle.id);
              const bookingCount = getResourceBookingCount(vehicle.id);
              const colors = getResourceColorClasses(vehicle.id);
              
              return (
                <Button
                  key={vehicle.id}
                  variant="outline"
                  className={`p-2 h-16 flex flex-col items-center justify-center text-center relative transition-all duration-150 rounded-lg border ${colors} hover:scale-105`}
                  onClick={() => onResourceClick('vehicle', vehicle.id)}
                >
                  <div className="text-xs font-medium">{vehicle.shortName || vehicle.name}</div>
                  <div className="text-xs mt-0.5">
                    {isBooked ? (
                      <span className="text-gray-600">예약있음({bookingCount}건)</span>
                    ) : (
                      <span className="text-gray-600">예약 가능</span>
                    )}
                  </div>
                  {/* 상태 표시 점 - 예약 있을 때만, 자원별 색상 */}
                  {isBooked && (
                    <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${getResourceDotColor(vehicle.id)}`}></div>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
        
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-700">공간</h4>
          <div className="grid grid-cols-2 gap-2">
            {resources.spaces.map(space => {
              const isBooked = isResourceBooked(space.id);
              const bookingCount = getResourceBookingCount(space.id);
              const colors = getResourceColorClasses(space.id);
              
              return (
                <Button
                  key={space.id}
                  variant="outline"
                  className={`p-2 h-16 flex flex-col items-center justify-center text-center relative transition-all duration-150 rounded-lg border ${colors} hover:scale-105`}
                  onClick={() => onResourceClick('space', space.id)}
                >
                  <div className="text-xs font-medium">{space.shortName || space.name}</div>
                  <div className="text-xs mt-0.5">
                    {isBooked ? (
                      <span className="text-gray-600">예약있음({bookingCount}건)</span>
                    ) : (
                      <span className="text-gray-600">예약 가능</span>
                    )}
                  </div>
                  {/* 상태 표시 점 - 예약 있을 때만, 자원별 색상 */}
                  {isBooked && (
                    <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${getResourceDotColor(space.id)}`}></div>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}