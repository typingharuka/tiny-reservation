import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "./components/ui/dialog";
import { Badge } from "./components/ui/badge";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import { CustomCalendar } from "./components/CustomCalendar";
import { ReservationForm } from "./components/ReservationForm";
import { ResourceStatus } from "./components/ResourceStatus";
import { ReservationDetail } from "./components/ReservationDetail";
import ErrorBoundary from "./components/ErrorBoundary";
import { getResourceColorClasses } from "./utils/colorUtils";

// Safe API imports with try-catch
let reservationAPI: any = null;
let resourceAPI: any = null;
let apiUtils: any = null;
let healthAPI: any = null;

try {
  // 우선 로컬 스토리지 API 사용 (즉시 작동)
  const localApi = require("./utils/localStorageApi");
  reservationAPI = localApi.localReservationAPI;
  resourceAPI = localApi.localResourceAPI;
  apiUtils = localApi.localApiUtils;
  healthAPI = localApi.localHealthAPI;
  console.log(
    "✅ 로컬 스토리지 API 로드 완료 - 즉시 사용 가능!",
  );

  // Supabase API가 사용 가능하면 그것을 우선 사용
  try {
    const supabaseApi = require("./utils/api");
    if (supabaseApi.healthAPI) {
      reservationAPI = supabaseApi.reservationAPI;
      resourceAPI = supabaseApi.resourceAPI;
      apiUtils = supabaseApi.apiUtils;
      healthAPI = supabaseApi.healthAPI;
      console.log("✅ Supabase API 로드 완료 - 서버 연결 시도");
    }
  } catch (supabaseError) {
    console.log(
      "💡 Supabase API 사용 불가 - 로컬 스토리지 API 사용",
    );
  }
} catch (error) {
  console.error("❌ 모든 API 모듈 로드 실패:", error);
}

export interface Reservation {
  id: string;
  type: "vehicle" | "space";
  resourceId: string;
  resourceName: string;
  date: Date;
  startTime: string;
  endTime: string;
  reservedBy: string;
  purpose: string;
}

const defaultResources = {
  vehicles: [
    {
      id: "vehicle-1",
      name: "라떼 20노1803",
      shortName: "라떼",
      plateNumber: "20노1803",
    },
    {
      id: "vehicle-2",
      name: "핑크 128무6370",
      shortName: "핑크",
      plateNumber: "128무6370",
    },
    {
      id: "vehicle-3",
      name: "흰둥이 221무7249",
      shortName: "흰둥이",
      plateNumber: "221무7249",
    },
    {
      id: "vehicle-4",
      name: "베이지 379로5193",
      shortName: "베이지",
      plateNumber: "379로5193",
    },
  ],
  spaces: [
    {
      id: "space-a",
      name: "회의실 20명",
      shortName: "회의실",
      capacity: "20명",
    },
    {
      id: "space-b",
      name: "강당 60명",
      shortName: "강당",
      capacity: "60명",
    },
  ],
};

export default function App() {
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(),
  );
  const [currentDate, setCurrentDate] = useState<Date>(
    new Date(),
  );
  const [reservations, setReservations] = useState<
    Reservation[]
  >([]);
  const [resources, setResources] = useState(defaultResources);
  const [calendarView, setCalendarView] = useState<
    "month" | "week"
  >("month");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [preselectedResource, setPreselectedResource] =
    useState<
      | { type: "vehicle" | "space"; resourceId: string }
      | undefined
    >();
  const [isLoading, setIsLoading] = useState(true);
  const [loadedMonths, setLoadedMonths] = useState<string[]>(
    [],
  );
  const [isServerConnected, setIsServerConnected] =
    useState(false);

  // 특정 월의 예약 데이터 로드 (useCallback으로 메모이제이션)
  const loadReservationsForMonth = useCallback(
    async (date: Date) => {
      if (!reservationAPI || !apiUtils) {
        console.warn(
          "API modules not available, skipping data load",
        );
        return;
      }

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthKey = `${year}-${month}`;

      // 이미 로드된 월이면 스킵
      if (loadedMonths.includes(monthKey)) {
        return;
      }

      try {
        console.log(
          `Loading reservations for ${year}-${month}`,
        );
        const apiReservations =
          await reservationAPI.fetchByMonth(year, month);

        const convertedReservations = apiReservations.map(
          (apiReservation: any) =>
            apiUtils.toAppReservation(apiReservation),
        );

        setReservations((prev) => {
          // 기존 예약에서 해당 월의 예약 제거
          const filteredPrev = prev.filter((r) => {
            const rYear = r.date.getFullYear();
            const rMonth = r.date.getMonth() + 1;
            return !(rYear === year && rMonth === month);
          });

          // 새로운 예약 데이터 추가
          return [...filteredPrev, ...convertedReservations];
        });

        setLoadedMonths((prev) => [...prev, monthKey]);
        console.log(
          `Successfully loaded ${convertedReservations.length} reservations for ${monthKey}`,
        );
      } catch (error) {
        console.error(
          `Failed to load reservations for ${monthKey}:`,
          error,
        );
        if (
          apiUtils &&
          typeof apiUtils.translateError === "function"
        ) {
          toast.error(
            `${month}월 예약 데이터를 불러오지 못했습니다: ` +
              apiUtils.translateError(error as Error),
          );
        } else {
          toast.error(
            `${month}월 예약 데이터를 불러오지 못했습니다`,
          );
        }
      }
    },
    [loadedMonths],
  );

  // 서버 연결 확인 및 초기 데이터 로드
  useEffect(() => {
    let isMounted = true;

    async function initializeApp() {
      try {
        if (!isMounted) return;
        setIsLoading(true);

        // API 모듈이 없으면 오프라인 모드
        if (!healthAPI) {
          console.warn(
            "API modules not available, using offline mode",
          );
          if (isMounted) {
            toast.warning(
              "API를 불러올 수 없습니다. 오프라인 모드로 작동합니다.",
            );
            setIsServerConnected(false);
            setIsLoading(false);
          }
          return;
        }

        // 서버 헬스체크
        const isServerHealthy = await healthAPI.check();
        if (!isMounted) return;

        if (!isServerHealthy) {
          console.warn(
            "Server health check failed, using offline mode",
          );
          toast.error(
            "서버 연결에 실패했습니다. 오프라인 모드로 작동합니다.",
          );
          setIsServerConnected(false);
          setIsLoading(false);
          return;
        }

        setIsServerConnected(true);
        console.log("Server is healthy, loading data...");

        // 리소스 데이터 로드
        if (resourceAPI) {
          try {
            const resourceData = await resourceAPI.fetchAll();
            if (isMounted) {
              setResources(resourceData);
            }
          } catch (error) {
            console.warn(
              "Failed to load resources, using defaults:",
              error,
            );
            if (isMounted) {
              toast.warning(
                "리소스 정보를 불러오지 못했습니다. 기본값을 사용합니다.",
              );
            }
          }
        }

        // 현재 월의 예약 데이터 로드
        await loadReservationsForMonth(new Date());

        if (isMounted) {
          toast.success("데이터를 성공적으로 불러왔습니다!");
        }
      } catch (error) {
        console.error("Failed to initialize app:", error);
        if (isMounted) {
          if (
            apiUtils &&
            typeof apiUtils.translateError === "function"
          ) {
            toast.error(
              "초기화 중 오류가 발생했습니다: " +
                apiUtils.translateError(error as Error),
            );
          } else {
            toast.error("초기화 중 오류가 발생했습니다");
          }
          setIsServerConnected(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to run only once

  // 날짜 변경 시 필요한 월 데이터 로드
  const handleDateChange = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      setCurrentDate(date);

      if (!isServerConnected) {
        return;
      }

      // 새로운 월이면 데이터 로드
      loadReservationsForMonth(date);

      // 이전/다음 월도 미리 로드 (성능 최적화)
      const prevMonth = new Date(
        date.getFullYear(),
        date.getMonth() - 1,
        1,
      );
      const nextMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        1,
      );
      loadReservationsForMonth(prevMonth);
      loadReservationsForMonth(nextMonth);
    },
    [isServerConnected, loadReservationsForMonth],
  );

  const handleReservationClick = useCallback(
    (reservation: Reservation) => {
      setSelectedReservation(reservation);
      setIsDetailOpen(true);
    },
    [],
  );

  const handleResourceClick = useCallback(
    (resourceType: "vehicle" | "space", resourceId: string) => {
      setPreselectedResource({
        type: resourceType,
        resourceId,
      });
      setIsFormOpen(true);
    },
    [],
  );

  const handleReservationSubmit = useCallback(
    async (reservationData: Omit<Reservation, "id">) => {
      // 로컬 스토리지 API는 항상 사용 가능
      if (!reservationAPI || !apiUtils) {
        toast.error("예약 시스템을 불러올 수 없습니다.");
        return;
      }

      try {
        console.log("Submitting reservation:", reservationData);

        // API 형식으로 변환
        const apiReservationData =
          apiUtils.toApiReservation(reservationData);

        // 서버에 생성 요청
        const createdReservation = await reservationAPI.create(
          apiReservationData,
        );

        // 앱 형식으로 다시 변환하여 로컬 상태 업데이트
        const newReservation = apiUtils.toAppReservation(
          createdReservation,
        );

        setReservations((prev) => [...prev, newReservation]);
        setIsFormOpen(false);
        setPreselectedResource(undefined);

        toast.success("예약이 완료되었습니다!", {
          description: `${reservationData.resourceName} - ${reservationData.startTime}~${reservationData.endTime}`,
        });
      } catch (error) {
        console.error("Failed to create reservation:", error);
        const errorMessage =
          apiUtils &&
          typeof apiUtils.translateError === "function"
            ? apiUtils.translateError(error as Error)
            : "예약 생성 중 오류가 발생했습니다";
        toast.error("예약 생성 실패: " + errorMessage);
      }
    },
    [],
  );

  const handleDeleteReservation = useCallback(
    async (id: string) => {
      // 로컬 스토리지 API는 항상 사용 가능
      if (!reservationAPI || !apiUtils) {
        toast.error("예약 시스템을 불러올 수 없습니다.");
        return;
      }

      try {
        console.log("Deleting reservation:", id);

        // 서버에서 삭제
        await reservationAPI.delete(id);

        // 로컬 상태에서 제거
        setReservations((prev) =>
          prev.filter((r) => r.id !== id),
        );

        toast.success("예약이 삭제되었습니다.");
      } catch (error) {
        console.error("Failed to delete reservation:", error);
        const errorMessage =
          apiUtils &&
          typeof apiUtils.translateError === "function"
            ? apiUtils.translateError(error as Error)
            : "예약 삭제 중 오류가 발생했습니다";
        toast.error("예약 삭제 실패: " + errorMessage);
      }
    },
    [],
  );

  const handleFormCancel = useCallback(() => {
    setIsFormOpen(false);
    setPreselectedResource(undefined);
  }, []);

  const getReservationsForDate = useCallback(
    (date: Date): Reservation[] => {
      return reservations.filter(
        (reservation) =>
          reservation.date.toDateString() ===
          date.toDateString(),
      );
    },
    [reservations],
  );

  const selectedDateReservations = getReservationsForDate(
    selectedDate,
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // 로딩 중일 때 표시할 UI
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            데이터를 불러오는 중입니다...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="mb-3 text-3xl font-bold text-gray-800">
              구로삶터 예약시스템
            </h1>
            <p className="text-gray-600 text-lg">
              차량 및 공간을 예약하세요
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 달력 영역 */}
            <div className="lg:col-span-3">
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg text-gray-800">
                    예약 달력
                  </CardTitle>
                  <div className="flex gap-3">
                    <Tabs
                      value={calendarView}
                      onValueChange={(value) =>
                        setCalendarView(
                          value as "month" | "week",
                        )
                      }
                    >
                      <TabsList className="bg-gray-100 border border-gray-200">
                        <TabsTrigger
                          value="month"
                          className="text-gray-700"
                        >
                          월별
                        </TabsTrigger>
                        <TabsTrigger
                          value="week"
                          className="text-gray-700"
                        >
                          주별
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Dialog
                      open={isFormOpen}
                      onOpenChange={setIsFormOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          className="bg-gradient-to-r from-violet-400 to-purple-400 hover:from-violet-500 hover:to-purple-500 text-white px-4 shadow-sm border-0"
                          onClick={() =>
                            setPreselectedResource(undefined)
                          }
                        >
                          새 예약
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg bg-white border border-gray-200 shadow-lg">
                        <DialogHeader className="pb-4">
                          <DialogTitle className="text-lg text-gray-800">
                            새 예약 만들기
                          </DialogTitle>
                          <DialogDescription>
                            원하는 자원과 시간을 선택해서
                            예약하세요.
                          </DialogDescription>
                        </DialogHeader>
                        <ReservationForm
                          resources={resources}
                          selectedDate={selectedDate}
                          existingReservations={reservations}
                          preselectedResource={
                            preselectedResource
                          }
                          onSubmit={handleReservationSubmit}
                          onCancel={handleFormCancel}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <CustomCalendar
                    currentDate={currentDate}
                    view={calendarView}
                    reservations={reservations}
                    onDateChange={handleDateChange}
                    onReservationClick={handleReservationClick}
                    selectedDate={selectedDate}
                  />
                </CardContent>
              </Card>
            </div>

            {/* 사이드바 영역 */}
            <div className="space-y-4">
              {/* 자원 현황 */}
              <ResourceStatus
                resources={resources}
                selectedDate={selectedDate}
                reservations={reservations}
                onResourceClick={handleResourceClick}
              />

              {/* 선택한 날짜의 예약 */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-gray-800">
                    선택한 날짜의 예약
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-700 text-xs"
                    >
                      {selectedDate.toLocaleDateString(
                        "ko-KR",
                        {
                          month: "short",
                          day: "numeric",
                          weekday: "short",
                        },
                      )}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {selectedDateReservations.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        선택한 날짜에 예약이 없습니다.
                      </p>
                    ) : (
                      selectedDateReservations.map(
                        (reservation) => (
                          <div
                            key={reservation.id}
                            className="p-3 border rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                            onClick={() =>
                              handleReservationClick(
                                reservation,
                              )
                            }
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant="secondary"
                                    className={`${getResourceColorClasses(reservation.resourceId)} border text-xs`}
                                  >
                                    {reservation.resourceName}
                                  </Badge>
                                  <span className="text-sm text-gray-600">
                                    {reservation.startTime} -{" "}
                                    {reservation.endTime}
                                  </span>
                                </div>
                                <p className="font-medium text-gray-800">
                                  {reservation.reservedBy}
                                </p>
                                <p className="text-sm text-gray-600 truncate">
                                  {reservation.purpose}
                                </p>
                              </div>
                            </div>
                          </div>
                        ),
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* 예약 상세 다이얼로그 */}
        <ReservationDetail
          reservation={selectedReservation}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedReservation(null);
          }}
          onDelete={handleDeleteReservation}
        />

        <Toaster />
      </div>
    </ErrorBoundary>
  );
}