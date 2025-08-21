import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Clock, User, FileText, Calendar, Car, Building, Trash2 } from 'lucide-react';
import { Reservation } from '../App';

interface ReservationDetailProps {
  reservation: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (reservation: Reservation) => void;
  onDelete?: (id: string) => void;
}

export function ReservationDetail({
  reservation,
  isOpen,
  onClose,
  onEdit,
  onDelete
}: ReservationDetailProps) {
  if (!reservation) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }).format(date);
  };

  const ResourceIcon = reservation.type === 'vehicle' ? Car : Building;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white border border-gray-200 shadow-lg">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-lg text-gray-800">
            <div className={`p-2 rounded-full ${
              reservation.type === 'vehicle' ? 'bg-pink-100' : 'bg-blue-100'
            }`}>
              <ResourceIcon className={`w-4 h-4 ${
                reservation.type === 'vehicle' ? 'text-pink-600' : 'text-blue-600'
              }`} />
            </div>
            예약 상세 정보
          </DialogTitle>
          <DialogDescription>
            {reservation.resourceName}의 예약 정보를 확인하고 관리하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 리소스 정보 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-base text-gray-800">{reservation.resourceName}</h3>
              <Badge 
                variant={reservation.type === 'vehicle' ? 'default' : 'secondary'}
                className={`mt-1 text-xs ${
                  reservation.type === 'vehicle' 
                    ? 'bg-pink-100 text-pink-700 border border-pink-200' 
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}
              >
                {reservation.type === 'vehicle' ? '차량' : '회의실'}
              </Badge>
            </div>
          </div>

          <Separator className="bg-gray-200" />

          {/* 예약 정보 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-800">{formatDate(reservation.date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {reservation.startTime} - {reservation.endTime}
                </p>
                <p className="text-xs text-gray-500">
                  {(() => {
                    const start = new Date(`2000-01-01 ${reservation.startTime}`);
                    const end = new Date(`2000-01-01 ${reservation.endTime}`);
                    const diff = (end.getTime() - start.getTime()) / (1000 * 60);
                    const hours = Math.floor(diff / 60);
                    const minutes = diff % 60;
                    return `${hours > 0 ? `${hours}시간 ` : ''}${minutes > 0 ? `${minutes}분` : ''}`;
                  })()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-800">{reservation.reservedBy}</p>
                <p className="text-xs text-gray-500">예약자</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 mb-1">사용 목적</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {reservation.purpose}
                </p>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-200" />

          {/* 액션 버튼 */}
          <div className="flex gap-3">
            {onEdit && (
              <Button 
                onClick={() => onEdit(reservation)}
                className="flex-1 bg-gradient-to-r from-violet-400 to-purple-400 hover:from-violet-500 hover:to-purple-500 text-white text-sm border-0"
              >
                수정
              </Button>
            )}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 text-sm"
                  >
                    삭제
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>예약 삭제</AlertDialogTitle>
                    <AlertDialogDescription>
                      이 예약을 삭제하시겠습니까?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => {
                        onDelete(reservation.id);
                        onClose();
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
            >
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}