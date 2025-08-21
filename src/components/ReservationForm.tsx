import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle, Clock, Car, Building } from 'lucide-react';
import { Reservation } from '../App';
import { checkReservationConflict, validateReservationTime } from '../utils/reservationUtils';
import { formatDateToLocal, parseLocalDate, isValidDate, formatDateToKoreanWithWeekday } from '../utils/dateUtils';
import { getResourceColors } from '../utils/colorUtils';

interface ReservationFormProps {
  resources: {
    vehicles: { id: string; name: string }[];
    spaces: { id: string; name: string }[];
  };
  selectedDate: Date;
  existingReservations: Reservation[];
  preselectedResource?: { type: 'vehicle' | 'space'; resourceId: string };
  onSubmit: (reservation: Omit<Reservation, 'id'>) => void;
  onCancel: () => void;
}

export function ReservationForm({ 
  resources, 
  selectedDate, 
  existingReservations,
  preselectedResource,
  onSubmit, 
  onCancel 
}: ReservationFormProps) {
  const [formData, setFormData] = useState({
    type: preselectedResource?.type || 'vehicle' as 'vehicle' | 'space',
    resourceId: preselectedResource?.resourceId || '',
    date: selectedDate,
    startTime: '09:00',
    endTime: '10:00',
    reservedBy: '',
    purpose: ''
  });

  const [validationErrors, setValidationErrors] = useState<{
    time?: string;
    conflict?: string;
  }>({});

  // selectedDate prop이 변경될 때 formData.date 업데이트
  useEffect(() => {
    setFormData(prev => ({ ...prev, date: selectedDate }));
  }, [selectedDate]);

  // preselectedResource가 변경될 때 formData 업데이트
  useEffect(() => {
    if (preselectedResource) {
      setFormData(prev => ({
        ...prev,
        type: preselectedResource.type,
        resourceId: preselectedResource.resourceId
      }));
    }
  }, [preselectedResource]);

  // 실시간 유효성 검사
  useEffect(() => {
    const errors: typeof validationErrors = {};

    // 날짜가 유효하지 않으면 검사하지 않음
    if (!formData.date || isNaN(formData.date.getTime())) {
      return;
    }

    // 시간 유효성 검사
    const timeValidation = validateReservationTime(formData.startTime, formData.endTime);
    if (!timeValidation.isValid) {
      errors.time = timeValidation.error;
    }

    // 충돌 검사 (리소스가 선택되었을 때만)
    if (formData.resourceId && !errors.time) {
      const conflictCheck = checkReservationConflict(
        {
          resourceId: formData.resourceId,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime
        },
        existingReservations
      );

      if (conflictCheck.hasConflict && conflictCheck.conflictingReservation) {
        const conflicting = conflictCheck.conflictingReservation;
        errors.conflict = `이미 ${conflicting.startTime}-${conflicting.endTime}에 ${conflicting.reservedBy}님이 예약하셨습니다.`;
      }
    }

    setValidationErrors(errors);
  }, [formData.resourceId, formData.date, formData.startTime, formData.endTime, existingReservations]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 날짜 유효성 검사
    if (!formData.date || isNaN(formData.date.getTime())) {
      alert('유효한 날짜를 선택해주세요.');
      return;
    }
    
    if (!formData.resourceId || !formData.reservedBy || !formData.purpose) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    // 유효성 검사 확인
    if (validationErrors.time || validationErrors.conflict) {
      alert('입력 정보를 확인해주세요.');
      return;
    }

    const allResources = [...resources.vehicles, ...resources.spaces];
    const selectedResource = allResources.find(r => r.id === formData.resourceId);
    
    if (!selectedResource) {
      alert('선택한 자원을 찾을 수 없습니다.');
      return;
    }

    onSubmit({
      type: formData.type,
      resourceId: formData.resourceId,
      resourceName: selectedResource.name,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      reservedBy: formData.reservedBy,
      purpose: formData.purpose
    });
  };

  const currentResources = formData.type === 'vehicle' ? resources.vehicles : resources.spaces;

  // 시간 옵션 생성 (30분 간격)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeStr);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label className="text-sm font-medium mb-2 block text-gray-700">예약 유형</Label>
        <div className="flex gap-3">
          <div 
            className={`flex items-center space-x-2 p-2.5 rounded-lg flex-1 border cursor-pointer transition-all duration-150 ${
              formData.type === 'vehicle' 
                ? 'bg-rose-50 border-rose-200 ring-1 ring-rose-200' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
            onClick={() => setFormData(prev => ({ ...prev, type: 'vehicle', resourceId: '' }))}
          >
            <input
              type="radio"
              name="reservationType"
              value="vehicle"
              checked={formData.type === 'vehicle'}
              onChange={() => setFormData(prev => ({ ...prev, type: 'vehicle', resourceId: '' }))}
              className="w-4 h-4 text-rose-600 bg-gray-100 border-gray-300 focus:ring-rose-500"
            />
            <Label className="text-sm font-medium text-gray-700 cursor-pointer">차량</Label>
          </div>
          <div 
            className={`flex items-center space-x-2 p-2.5 rounded-lg flex-1 border cursor-pointer transition-all duration-150 ${
              formData.type === 'space' 
                ? 'bg-sky-50 border-sky-200 ring-1 ring-sky-200' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
            onClick={() => setFormData(prev => ({ ...prev, type: 'space', resourceId: '' }))}
          >
            <input
              type="radio"
              name="reservationType"
              value="space"
              checked={formData.type === 'space'}
              onChange={() => setFormData(prev => ({ ...prev, type: 'space', resourceId: '' }))}
              className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 focus:ring-sky-500"
            />
            <Label className="text-sm font-medium text-gray-700 cursor-pointer">공간</Label>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="resource" className="text-sm font-medium mb-2 block text-gray-700">
          {formData.type === 'vehicle' ? '차량 선택' : '공간 선택'} *
        </Label>
        <Select 
          value={formData.resourceId} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, resourceId: value }))}
        >
          <SelectTrigger className="h-10 rounded-lg border-gray-300 bg-gray-50">
            <SelectValue placeholder={`${formData.type === 'vehicle' ? '차량을' : '공간을'} 선택하세요`} />
          </SelectTrigger>
          <SelectContent>
            {currentResources.map(resource => (
              <SelectItem key={resource.id} value={resource.id}>
                {resource.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="date" className="text-sm font-medium mb-2 block text-gray-700">예약 날짜 *</Label>
        <div 
          className="relative h-10 rounded-lg border border-gray-300 bg-gray-50 cursor-pointer flex items-center px-3"
          onClick={() => {
            const input = document.getElementById('date-input') as HTMLInputElement;
            input?.showPicker?.();
          }}
        >
          <Input
            id="date-input"
            type="date"
            value={isValidDate(formData.date) ? formatDateToLocal(formData.date) : ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                const newDate = parseLocalDate(value);
                if (isValidDate(newDate)) {
                  setFormData(prev => ({ ...prev, date: newDate }));
                }
              } else {
                // Clear 버튼을 누른 경우 - 오늘 날짜로 리셋
                setFormData(prev => ({ ...prev, date: new Date() }));
              }
            }}
            className="absolute inset-0 opacity-0 cursor-pointer h-full w-full border-0 bg-transparent"
          />
          <span className="text-sm text-gray-700 pointer-events-none">
            {isValidDate(formData.date) 
              ? formatDateToKoreanWithWeekday(formData.date)
              : '날짜를 선택하세요'
            }
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="startTime" className="text-sm font-medium mb-2 block text-gray-700 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            시작 시간 *
          </Label>
          <Select 
            value={formData.startTime}
            onValueChange={(value) => setFormData(prev => ({ ...prev, startTime: value }))}
          >
            <SelectTrigger className="h-10 rounded-lg border-gray-300 bg-gray-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map(time => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="endTime" className="text-sm font-medium mb-2 block text-gray-700 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            종료 시간 *
          </Label>
          <Select 
            value={formData.endTime}
            onValueChange={(value) => setFormData(prev => ({ ...prev, endTime: value }))}
          >
            <SelectTrigger className="h-10 rounded-lg border-gray-300 bg-gray-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map(time => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 오류 표시 */}
      {(validationErrors.time || validationErrors.conflict) && (
        <Alert variant="destructive" className="rounded-lg border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {validationErrors.time || validationErrors.conflict}
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="reservedBy" className="text-sm font-medium mb-2 block text-gray-700">예약자 *</Label>
        <Input
          type="text"
          placeholder="이름을 입력하세요"
          value={formData.reservedBy}
          onChange={(e) => setFormData(prev => ({ ...prev, reservedBy: e.target.value }))}
          className="h-10 rounded-lg border-gray-300 bg-gray-50"
        />
      </div>

      <div>
        <Label htmlFor="purpose" className="text-sm font-medium mb-2 block text-gray-700">사용 목적 *</Label>
        <Textarea
          placeholder="사용 목적을 간략히 입력하세요"
          value={formData.purpose}
          onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
          className="rounded-lg border-gray-300 bg-gray-50 min-h-[80px] text-sm"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-3">
        <Button 
          type="submit" 
          className="flex-1 h-10 bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white rounded-lg text-sm font-medium border-0"
          disabled={!!(validationErrors.time || validationErrors.conflict)}
        >
          예약하기
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          className="flex-1 h-10 rounded-lg text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          취소
        </Button>
      </div>
    </form>
  );
}