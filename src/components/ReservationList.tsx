import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Trash2, Clock, User, FileText } from 'lucide-react';
import { Reservation } from '../App';

interface ReservationListProps {
  reservations: Reservation[];
  onDelete: (id: string) => void;
}

export function ReservationList({ reservations, onDelete }: ReservationListProps) {
  if (reservations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg">이 날짜에 예약이 없습니다.</p>
        <p className="text-sm mt-1">새 예약을 추가해보세요</p>
      </div>
    );
  }

  const sortedReservations = [...reservations].sort((a, b) => 
    a.startTime.localeCompare(b.startTime)
  );

  return (
    <div className="space-y-2">
      {sortedReservations.map((reservation) => (
        <Card key={reservation.id} className="relative bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-150">
          <CardContent className="p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant={reservation.type === 'vehicle' ? 'default' : 'secondary'} 
                       className={`${
                         reservation.type === 'vehicle' 
                           ? 'bg-pink-100 text-pink-700 border border-pink-200' 
                           : 'bg-blue-100 text-blue-700 border border-blue-200'
                       } text-xs rounded-full`}>
                  {reservation.type === 'vehicle' ? '차량' : '회의실'}
                </Badge>
                <span className="text-sm font-medium text-gray-800">{reservation.resourceName}</span>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>예약 삭제</AlertDialogTitle>
                    <AlertDialogDescription>
                      <span className="font-medium">{reservation.resourceName}</span>의 예약을 삭제하시겠습니까?
                      <br />
                      <span className="text-sm text-gray-500">
                        {reservation.startTime} - {reservation.endTime} ({reservation.reservedBy})
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDelete(reservation.id)}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-3 h-3" />
                <span className="font-medium">{reservation.startTime} - {reservation.endTime}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-3 h-3" />
                <span>{reservation.reservedBy}</span>
              </div>
              
              <div className="flex items-start gap-2 text-gray-600">
                <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2 leading-tight">{reservation.purpose}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Calendar icon component for empty state
function Calendar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}