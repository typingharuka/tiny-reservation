// 각 자원별 고유 색상 정의
export const resourceColors = {
  // 차량별 색상
  'vehicle-1': { // 라떼
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200',
    hover: 'hover:bg-amber-200',
    dot: 'bg-amber-500',
  },
  'vehicle-2': { // 핑크
    bg: 'bg-pink-100',
    text: 'text-pink-800',
    border: 'border-pink-200',
    hover: 'hover:bg-pink-200',
    dot: 'bg-pink-500',
  },
  'vehicle-3': { // 흰둥이
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    hover: 'hover:bg-slate-200',
    dot: 'bg-slate-500',
  },
  'vehicle-4': { // 베이지
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    hover: 'hover:bg-orange-200',
    dot: 'bg-orange-500',
  },
  // 공간별 색상
  'space-a': { // 회의실
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-200',
    dot: 'bg-blue-500',
  },
  'space-b': { // 강당
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
    hover: 'hover:bg-purple-200',
    dot: 'bg-purple-500',
  },
} as const;

// 자원 ID로 색상 클래스 가져오기
export function getResourceColors(resourceId: string) {
  return resourceColors[resourceId as keyof typeof resourceColors] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    hover: 'hover:bg-gray-200',
    dot: 'bg-gray-500',
  };
}

// Tailwind 클래스를 동적으로 생성하기 위한 함수
export function getResourceColorClasses(resourceId: string) {
  return `resource-${resourceId}`;
}

// 호버 효과를 포함한 클래스  
export function getResourceColorClassesWithHover(resourceId: string) {
  const colors = getResourceColors(resourceId);
  return `resource-${resourceId} ${colors.hover}`;
}

// 점 색상만 가져오기
export function getResourceDotColor(resourceId: string) {
  return `dot-${resourceId}`;
}