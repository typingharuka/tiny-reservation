import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';

const app = new Hono();

// CORS 설정
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// 로깅
app.use('*', logger(console.log));

// Supabase 클라이언트 초기화
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// 예약 데이터 타입 정의
interface ReservationData {
  id?: string;
  type: 'vehicle' | 'space';
  resource_id: string;
  resource_name: string;
  date: string; // YYYY-MM-DD 형식
  start_time: string; // HH:MM 형식
  end_time: string; // HH:MM 형식
  reserved_by: string;
  purpose: string;
  created_at?: string;
}

// 서버 시작시 기본 리소스 데이터 생성
async function initializeDatabase() {
  console.log('Initializing database with default resources...');
  
  try {
    // resources 테이블이 비어있으면 기본 데이터 추가
    const { data: existingResources, error: checkError } = await supabase
      .from('resources')
      .select('id')
      .limit(1);

    if (checkError) {
      console.log('Resources table might not exist, skipping initialization:', checkError.message);
      return;
    }

    if (!existingResources || existingResources.length === 0) {
      const defaultResources = [
        { id: 'vehicle-1', name: '라떼 20노1803', type: 'vehicle' },
        { id: 'vehicle-2', name: '핑크 128무6370', type: 'vehicle' },
        { id: 'vehicle-3', name: '흰둥이 221무7249', type: 'vehicle' },
        { id: 'vehicle-4', name: '베이지 379로5193', type: 'vehicle' },
        { id: 'space-a', name: '회의실 20명', type: 'space' },
        { id: 'space-b', name: '강당 60명', type: 'space' }
      ];

      const { error: insertError } = await supabase
        .from('resources')
        .insert(defaultResources);

      if (insertError) {
        console.error('Error inserting default resources:', insertError);
      } else {
        console.log('Default resources initialized successfully');
      }
    } else {
      console.log('Resources already exist, skipping initialization');
    }

  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// 월별 예약 조회 - GET /make-server-3e989cb8/reservations?year=2025&month=1
app.get('/make-server-3e989cb8/reservations', async (c) => {
  try {
    const year = c.req.query('year');
    const month = c.req.query('month');
    
    if (!year || !month) {
      return c.json({ error: 'Year and month parameters are required' }, 400);
    }

    // 해당 년월의 예약 데이터 조회
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;

    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return c.json({ 
        success: false,
        error: 'Failed to fetch reservations',
        details: error.message 
      }, 500);
    }
    
    console.log(`Retrieved ${reservations?.length || 0} reservations for ${year}-${month}`);
    
    return c.json({
      success: true,
      data: reservations || [],
      count: reservations?.length || 0
    });

  } catch (error) {
    console.error('Error fetching reservations:', error);
    return c.json({ 
      success: false,
      error: 'Failed to fetch reservations',
      details: error.message 
    }, 500);
  }
});

// 새 예약 생성 - POST /make-server-3e989cb8/reservations
app.post('/make-server-3e989cb8/reservations', async (c) => {
  try {
    const reservationData: ReservationData = await c.req.json();
    
    // 입력 데이터 검증
    if (!reservationData.type || !reservationData.resource_id || !reservationData.date || 
        !reservationData.start_time || !reservationData.end_time || !reservationData.reserved_by) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // 예약 충돌 검사
    const { data: conflictingReservations, error: conflictError } = await supabase
      .from('reservations')
      .select('id')
      .eq('resource_id', reservationData.resource_id)
      .eq('date', reservationData.date)
      .or(`and(start_time.lte.${reservationData.start_time},end_time.gt.${reservationData.start_time}),and(start_time.lt.${reservationData.end_time},end_time.gte.${reservationData.end_time}),and(start_time.gte.${reservationData.start_time},end_time.lte.${reservationData.end_time})`);

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError);
      return c.json({ 
        success: false,
        error: 'Failed to check reservation conflicts',
        details: conflictError.message 
      }, 500);
    }

    if (conflictingReservations && conflictingReservations.length > 0) {
      return c.json({ 
        success: false,
        error: 'Reservation conflict detected',
        message: '선택한 시간에 이미 예약이 있습니다.'
      }, 409);
    }
    
    // 새 예약 데이터 준비 (id와 created_at은 데이터베이스에서 자동 생성)
    const newReservationData = {
      type: reservationData.type,
      resource_id: reservationData.resource_id,
      resource_name: reservationData.resource_name,
      date: reservationData.date,
      start_time: reservationData.start_time,
      end_time: reservationData.end_time,
      reserved_by: reservationData.reserved_by,
      purpose: reservationData.purpose
    };

    // 데이터베이스에 예약 생성
    const { data: newReservation, error: insertError } = await supabase
      .from('reservations')
      .insert([newReservationData])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating reservation:', insertError);
      return c.json({ 
        success: false,
        error: 'Failed to create reservation',
        details: insertError.message 
      }, 500);
    }
    
    console.log(`Created new reservation: ${newReservation.id} for ${reservationData.resource_name} on ${reservationData.date}`);
    
    return c.json({
      success: true,
      data: newReservation,
      message: '예약이 생성되었습니다.'
    });

  } catch (error) {
    console.error('Error creating reservation:', error);
    return c.json({ 
      success: false,
      error: 'Failed to create reservation',
      details: error.message 
    }, 500);
  }
});

// 예약 삭제 - DELETE /make-server-3e989cb8/reservations/:id
app.delete('/make-server-3e989cb8/reservations/:id', async (c) => {
  try {
    const reservationId = c.req.param('id');
    
    if (!reservationId) {
      return c.json({ error: 'Reservation ID is required' }, 400);
    }

    // 예약 존재 확인 후 삭제
    const { data: deletedReservation, error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservationId)
      .select()
      .single();

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        return c.json({ 
          success: false,
          error: 'Reservation not found',
          message: '예약을 찾을 수 없습니다.'
        }, 404);
      }
      
      console.error('Error deleting reservation:', deleteError);
      return c.json({ 
        success: false,
        error: 'Failed to delete reservation',
        details: deleteError.message 
      }, 500);
    }

    if (!deletedReservation) {
      return c.json({ 
        success: false,
        error: 'Reservation not found',
        message: '예약을 찾을 수 없습니다.'
      }, 404);
    }
    
    console.log(`Deleted reservation: ${reservationId}`);
    
    return c.json({
      success: true,
      message: '예약이 삭제되었습니다.',
      data: deletedReservation
    });

  } catch (error) {
    console.error('Error deleting reservation:', error);
    return c.json({ 
      success: false,
      error: 'Failed to delete reservation',
      details: error.message 
    }, 500);
  }
});

// 리소스 목록 조회
app.get('/make-server-3e989cb8/resources', async (c) => {
  try {
    const { data: resources, error } = await supabase
      .from('resources')
      .select('*')
      .order('type', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching resources:', error);
      return c.json({ 
        success: false,
        error: 'Failed to fetch resources',
        details: error.message 
      }, 500);
    }

    // 차량과 공간으로 분류
    const vehicles = resources?.filter(r => r.type === 'vehicle') || [];
    const spaces = resources?.filter(r => r.type === 'space') || [];
    
    return c.json({
      success: true,
      data: {
        vehicles,
        spaces
      }
    });

  } catch (error) {
    console.error('Error fetching resources:', error);
    return c.json({ 
      success: false,
      error: 'Failed to fetch resources',
      details: error.message 
    }, 500);
  }
});

// 헬스 체크
app.get('/make-server-3e989cb8/health', async (c) => {
  try {
    // 데이터베이스 연결 테스트
    const { error } = await supabase
      .from('reservations')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Database health check failed:', error);
      return c.json({ 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        message: 'Database connection failed',
        details: error.message
      }, 500);
    }

    return c.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Reservation API is running with database connection'
    });
  } catch (error) {
    console.error('Health check error:', error);
    return c.json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      details: error.message
    }, 500);
  }
});

// 서버 시작시 데이터베이스 초기화
await initializeDatabase();

Deno.serve(app.fetch);