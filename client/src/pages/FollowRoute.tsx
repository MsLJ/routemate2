import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GoogleMap } from '@/components/GoogleMap';
import { trpc } from '@/lib/trpc';
import { CATEGORIES } from '@shared/types';
import { 
  ArrowLeft, 
  MoreVertical, 
  MapPin, 
  Footprints, 
  Clock, 
  Bell, 
  X, 
  Sparkles, 
  Play, 
  Check, 
  CheckCircle2, 
  Navigation,
  Compass,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface RouteSpot {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  address?: string;
  description?: string;
}

// 4 iconic Seoul Spots matching the user's provided mockup image
const DEFAULT_FOLLOW_SPOTS: RouteSpot[] = [
  {
    id: 901,
    name: '빛의 시어터',
    latitude: 37.5453,
    longitude: 127.1105,
    category: 'hotplace',
    address: '서울특별시 광진구 워커힐로 177',
    description: '빛과 소리로 빚어낸 찬란한 미디어아트 전시 공간'
  },
  {
    id: 902,
    name: '아르떼뮤지엄',
    latitude: 37.5621,
    longitude: 127.0508,
    category: 'cafe',
    address: '서울특별시 성동구 왕십리로 가득한 정원 부근',
    description: '시공을 초월한 자연의 정수를 만끽할 수 있는 눈부신 가상정원'
  },
  {
    id: 903,
    name: '그라운드시소',
    latitude: 37.5582,
    longitude: 126.9821,
    category: 'hotplace',
    address: '서울특별시 중구 소나무숲 남산길 어귀',
    description: '트렌디하고 감동적인 현대미술 일러스트레이션 플랫폼'
  },
  {
    id: 904,
    name: 'DDP 디자인전시관',
    latitude: 37.5364,
    longitude: 127.0102,
    category: 'hotplace',
    address: '서울특별시 중구 을지로 281',
    description: '한국의 미래 지형과 트렌드를 주도하는 곡선형 우주 디자인 로드'
  }
];

export default function FollowRoute() {
  const [match, params] = useRoute('/route/:id/follow') as any;
  const [, setLocation] = useLocation();
  const routeId = params?.id ? parseInt(params.id) : null;

  // Retrieve route from DB (if routeId is valid)
  const { data: dbRoute, isLoading: isDbLoading } = trpc.routes.getById.useQuery(routeId || 0, {
    enabled: !!routeId && routeId > 0 && routeId < 100, // Query only physical reasonable IDs
    retry: false
  });

  // Decide spots list: Use fetched DB route spots if available, otherwise use iconic mockups
  const spots: RouteSpot[] = dbRoute && dbRoute.places && dbRoute.places.length > 0 
    ? dbRoute.places.map((p, idx) => ({
        id: p.id || idx,
        name: p.name || `코스 스팟 ${idx+1}`,
        latitude: parseFloat(String(p.latitude)) || DEFAULT_FOLLOW_SPOTS[idx % 4].latitude,
        longitude: parseFloat(String(p.longitude)) || DEFAULT_FOLLOW_SPOTS[idx % 4].longitude,
        category: p.category || 'hotplace',
        address: p.address || '',
        description: p.description || ''
      }))
    : DEFAULT_FOLLOW_SPOTS;

  const routeTitle = dbRoute?.title || '주말 힐링 아케이드 투어';

  // Tracking states
  const [activeStep, setActiveStep] = useState<number>(1); // 0-indexed, but starting tracking step 1 (아르떼뮤지엄, mapping index 1)
  const [countdown, setCountdown] = useState<number>(300); // 5:00 = 300 seconds
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState<boolean>(false);

  // Run Countdown Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format Countdown Seconds to "MM:SS"
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Distance computation helper
  const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Safe Index helpers
  const totalStepsCount = spots.length;
  const currentDestIndex = Math.min(activeStep, totalStepsCount - 1);
  const nextDestIndex = Math.min(activeStep + 1, totalStepsCount - 1);

  // Current Destination Spot details
  const currentSpot = spots[currentDestIndex] || spots[0];
  const nextSpot = spots[nextDestIndex] || spots[spots.length - 1];

  // Simulated GPS location slightly offset near the previous spot or between them
  const prevSpot = spots[Math.max(0, activeStep - 1)] || spots[0];
  const gpsLat = prevSpot.latitude + (currentSpot.latitude - prevSpot.latitude) * 0.4;
  const gpsLng = prevSpot.longitude + (currentSpot.longitude - prevSpot.longitude) * 0.4;

  // Calculate dynamic walking distance and estimated arrival time
  const dynamicDistance = getDistanceKm(gpsLat, gpsLng, currentSpot.latitude, currentSpot.longitude);
  const formattedDistanceString = dynamicDistance < 1
    ? `${Math.round(dynamicDistance * 1000)}m`
    : `${dynamicDistance.toFixed(1)}km`;

  // Estimate walking speed (approx 15 mins per km)
  const estimatedMins = Math.max(1, Math.round(dynamicDistance * 15));
  const estimatedArrivalHour = new Date(Date.now() + estimatedMins * 60000).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const handleNextStep = () => {
    if (activeStep < totalStepsCount - 1) {
      setActiveStep(prev => prev + 1);
      setCountdown(300); // Reset timer to 5:00
      toast.success(`🎉 '${currentSpot.name}' 스팟 도착 완료! 다음 지점으로 이동합니다.`);
    } else {
      toast.success('🏆 정주행 축하드립니다! 코스의 모든 지점을 끝까지 완주하였습니다!');
      setLocation('/my');
    }
  };

  const handleResetStep = () => {
    setActiveStep(0);
    setCountdown(300);
    toast.info('동선 도전을 처음부터 다시 추적합니다.');
  };

  const handleCancelRoute = () => {
    toast.error('🚶 루트 따라가기가 취소되었습니다.');
    setLocation('/my');
  };

  return (
    <div className="min-h-screen bg-neutral-100 sm:bg-[#F3F4F6] text-[#111827] flex flex-col items-center py-0 sm:py-6 px-0 sm:px-4 md:px-8 font-sans select-none">
      {/* Phone Mockup Framer Container exactly like image */}
      <div className="w-full max-w-[640px] bg-white rounded-none sm:rounded-[36px] border-0 sm:border border-[#EBE8F3] shadow-none sm:shadow-2xl overflow-hidden flex flex-col p-4 sm:p-5 min-h-screen sm:min-h-[920px] pb-32 relative">
        
        {/* Top Header: ← 뒤로가기 + ⋮ More Button */}
        <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-neutral-100 shrink-0">
          <button
            type="button"
            onClick={() => setLocation('/my')}
            className="flex items-center gap-1 bg-transparent hover:bg-neutral-50 px-2 py-1.5 rounded-full border-0 font-extrabold text-[#111827] text-sm cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-5.5 h-5.5 stroke-[2.25] text-neutral-800" />
            <span className="text-base tracking-tight">뒤로가기</span>
          </button>
          
          <div className="flex items-center gap-2">
            {/* Developer interactive simulation helper toggle */}
            <button
              onClick={() => {
                setIsDemoMode(!isDemoMode);
                toast.info(isDemoMode ? '시뮬레이터 가상 제어판 비활성화' : '시뮬레이터 가상 제어판 활성화! 코스를 손쉽게 테스트해보세요.');
              }}
              className="bg-[#FAF8FF] border border-[#ECE9FF] text-[#5C36EC] text-[10px] font-black px-2.5 py-1.5 rounded-full flex items-center gap-1 hover:bg-[#EEECFF] transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5C36EC] animate-spin" />
              데모 컨트롤
            </button>
            
            <button className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors bg-transparent border-0 cursor-pointer text-neutral-800">
              <MoreVertical className="w-6 h-6 stroke-[1.75]" />
            </button>
          </div>
        </div>

        {/* Demo Controller Mode Floating Tray */}
        {isDemoMode && (
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-3.5 mb-3.5 flex flex-col gap-2 shadow-xl animate-in slide-in-from-top-3 duration-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-sky-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 animate-pulse" />
                가상 동션 시뮬레이터 어시스턴트
              </span>
              <span className="text-[10px] text-slate-400 font-mono">RM-Simulator v2.4</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1.5">
              <Button
                size="sm"
                variant="outline"
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 text-[10px] h-8 rounded-lg"
                onClick={handleResetStep}
              >
                처음부터 다시 추적
              </Button>
              <Button
                size="sm"
                className="bg-[#5C36EC] hover:bg-indigo-600 text-white text-[10px] h-8 rounded-lg font-bold border-0"
                onClick={handleNextStep}
              >
                {activeStep < totalStepsCount - 1 ? '다음 스팟 이동하기' : '완주 후 마무리'}
              </Button>
            </div>

            <div className="text-[9.5px] leading-relaxed text-slate-400 border-t border-slate-800 pt-1.5 mt-0.5">
              ✏️ <strong>상태:</strong> 현재 <strong>{currentSpot.name}</strong>(으)로 향하는 가상의 GPS 로드가 구동중입니다. 상단의 지도를 클릭하거나 다음 동작 트레이를 통해 자유롭게 완료를 기록할 수 있습니다.
            </div>
          </div>
        )}

        {/* 1. MAP AREA: Stunning customized Seoul GMap (With SVG styling logic) */}
        <div className="h-[360px] w-full rounded-[24px] border border-[#ECE9FF] overflow-hidden relative shadow-inner mb-4 flex-shrink-0 bg-[#FAF9FC]">
          
          {/* Integrated Interactive GMap or Fallback Map */}
          <div className="absolute inset-0 w-full h-full">
            <GoogleMap
              places={spots.map((p, idx) => ({
                id: p.id,
                name: p.name,
                latitude: p.latitude,
                longitude: p.longitude,
                category: p.category,
                color: idx === currentDestIndex ? '#5C36EC' : '#9CA3AF'
              }))}
              height="100%"
              drawPath={true}
              center={{ lat: gpsLat, lng: gpsLng }}
              zoom={13}
            />

            {/* Custom high-fidelity overlay elements directly overlaying the map view */}
            {/* Pulsing Active Blue GPS Circle Node inside the maps bounds */}
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-700 ease-out"
              style={{ left: '48%', top: '56%' }}
            >
              <span className="flex h-12 w-12 relative items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-35"></span>
                <span className="absolute inline-flex h-8 w-8 rounded-full bg-blue-100 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-500 border-3 border-white shadow-xl flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </span>
              </span>
            </div>

            {/* Custom speech bubble callout pins exactly matching third image behavior */}
            {spots.map((p, idx) => {
              // Custom fixed coordinates for Seoul landmark SVG pins so they match the mock perfectly
              // 1. 빛의 시어터 (top: 13%, left: 33%)
              // 2. 아르떼뮤지엄 (top: 31%, left: 40%) - Next target!
              // 3. 그라운드시소 (top: 51%, left: 60%)
              // 4. DDP 디자인전시관 (top: 73%, left: 54%)
              const layoutStyles = [
                { top: '15%', left: '33%' },
                { top: '33%', left: '40%' },
                { top: '52%', left: '60%' },
                { top: '75%', left: '54%' }
              ];
              const styles = layoutStyles[idx] || { top: '50%', left: '50%' };
              const isTargetSpot = idx === currentDestIndex;

              return (
                <div 
                  key={p.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-in-out"
                  style={styles}
                >
                  <div className="flex items-center gap-1.5 bg-white border border-[#ECE0FF] shadow-lg rounded-full px-2.5 py-1.5 animate-in fade-in-0 mt-2 select-none relative">
                    {/* Ring Number Marker */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      idx < activeStep 
                        ? 'bg-emerald-500 text-white' 
                        : isTargetSpot 
                          ? 'bg-[#5C36EC] text-white animate-pulse ring-2 ring-indigo-200' 
                          : 'bg-indigo-950 text-white'
                    }`}>
                      {idx + 1}
                    </div>

                    {/* Landmark Name Label */}
                    <span className="text-[10px] font-extrabold text-neutral-800 tracking-tight pr-1">
                      {p.name}
                    </span>

                    {/* Subtle point indicator stem */}
                    <div className="absolute left-1/2 bottom-[-6px] transform -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-[#ECE0FF] rotate-45 z-[-1]" />
                  </div>
                </div>
              );
            })}

            {/* Floating Top Left HUD: 진행률 Badge */}
            <div className="absolute top-3 left-3 bg-white border border-[#ECE9FF] rounded-full px-3.5 py-2 flex items-center gap-1.5 shadow-md pointer-events-none select-none">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5C36EC] animate-ping shrink-0" />
              <span className="text-[11px] font-black tracking-tight text-neutral-800 flex items-center gap-1">
                진행률 
                <strong className="text-[#5C36EC] font-extrabold text-xs ml-0.5">
                  {activeStep} / {totalStepsCount}
                </strong>
              </span>
            </div>

            {/* GPS Compass target icon re-centering floating map action button */}
            <button 
              onClick={() => {
                toast.success('🗺️ 내 현재 GPS 위치 기준으로 안전하게 중심점 조정을 마쳤습니다.');
              }}
              className="absolute right-3 bottom-15 bg-white border border-[#ECE9FF] rounded-full w-11 h-11 flex items-center justify-center text-neutral-700 shadow-md hover:bg-neutral-50 active:scale-95 transition-all outline-none cursor-pointer"
              title="현재 위치로 지도 재중심"
            >
              <Compass className="w-5.5 h-5.5 text-[#5C36EC] stroke-[2]" />
            </button>
          </div>
        </div>

        {/* 2. NEXT DESTINATION INFO PANEL CARDS (SCROLLABLE OR FIXED) */}
        <div className="flex-1 flex flex-col justify-between">
          
          <div className="space-y-3 shrink-0">
            {/* Card A: 다음 장소 카드 (The Next Spot Details) */}
            <Card 
              onClick={handleNextStep}
              className="p-5 rounded-[28px] bg-white border border-[#ECE9FF] hover:border-[#DED5FF] shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer select-none group"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-dashed border-neutral-100">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Soft Purple pin round icon card wrapper */}
                  <div className="w-13 h-13 rounded-[18px] bg-[#FAF8FF] border border-[#ECE9FF] flex items-center justify-center shrink-0">
                    <MapPin className="w-6.5 h-6.5 text-[#5C36EC] fill-[#5C36EC]/15 stroke-[2] group-hover:animate-bounce" />
                  </div>

                  <div className="min-w-0">
                    <span className="block text-[11px] font-extrabold text-[#5C36EC] uppercase tracking-wide">
                      다음 장소
                    </span>
                    <h4 className="text-xl font-black text-neutral-950 tracking-tight truncate mt-0.5 leading-tight">
                      {currentSpot.name}
                    </h4>
                  </div>
                </div>

                <div className="p-1 hover:bg-[#FAF8FF] rounded-full transition-colors">
                  <ArrowLeft className="w-5.5 h-5.5 text-[#5C36EC] rotate-180" />
                </div>
              </div>

              {/* Grid with walking distance, estimated hours & clock indexes */}
              <div className="grid grid-cols-2 gap-4 pt-3.5 px-0.5">
                {/* Column 1: 남은 거리 */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center shrink-0 border border-neutral-100">
                    <Footprints className="w-5 h-5 text-neutral-800" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold text-neutral-400">남은 거리</span>
                    <strong className="text-base font-black text-neutral-800 block leading-tight tracking-tight">
                      {formattedDistanceString}
                    </strong>
                  </div>
                </div>

                {/* Column 2: 예상 도착 시간 */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center shrink-0 border border-neutral-100">
                    <Clock className="w-5 h-5 text-neutral-800" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold text-neutral-400">예상 도착 시간</span>
                    <strong className="text-base font-black text-neutral-800 block leading-tight tracking-tight">
                      {estimatedArrivalHour}
                    </strong>
                  </div>
                </div>
              </div>
            </Card>

            {/* Card B: 다음 루트 알림 (Next Spot Notification) */}
            <div className="p-4 rounded-[24px] bg-[#FAF9FC] border border-[#ECE9FF] flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Bell Icon in soft purple box */}
                <div className="w-12 h-12 rounded-[16px] bg-[#EEECFF] border border-[#DEDCFF] flex items-center justify-center shrink-0 text-[#5C36EC]">
                  <Bell className="w-5.5 h-5.5 fill-[#5C36EC]/15 animate-swing" />
                </div>

                <div className="min-w-0">
                  <span className="block text-[11px] font-black text-[#5C36EC]">
                    다음 루트 알림
                  </span>
                  <p className="text-[12px] font-bold text-neutral-800 leading-snug mt-0.5 truncate max-w-[280px]">
                    {currentSpot.name} 도착 후 5분 뒤 {nextSpot.name}로 이동
                  </p>
                </div>
              </div>

              {/* Countdown badge timer widget */}
              <div className="bg-[#FAF8FF] border border-[#ECE9FF] text-[#5C36EC] rounded-full px-3.5 py-1.5 flex items-center justify-center shadow-2xs font-extrabold text-[12px] font-mono shrink-0 gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#5C36EC] animate-pulse" />
                {formatTime(countdown)}
              </div>
            </div>
          </div>

          {/* Card C: 루트 취소하기 Action Trigger */}
          <div className="pt-5 pb-2 shrink-0">
            {showConfirmCancel ? (
              <div className="p-4 border-2 border-red-200 bg-red-50/40 rounded-2xl animate-in zoom-in-95 duration-150 space-y-3">
                <div className="flex gap-2 text-xs font-bold text-red-950 align-top">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  <p>동작 중인 루트 따라가기 추적 상태를 중지하고 종료하시겠습니까? 현재까지의 실시간 경로 진척률이 모두 리셋됩니다.</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowConfirmCancel(false)}
                    className="flex-1 border-neutral-300 text-neutral-700 bg-white"
                  >
                    아니요
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCancelRoute}
                    className="flex-1 bg-red-600 font-extrabold text-white border-0 hover:bg-red-700"
                  >
                    네, 중단하기
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowConfirmCancel(true)}
                className="w-full h-15 bg-white hover:bg-neutral-50 text-red-600 border border-red-300 rounded-[24px] font-bold text-base flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-99 transition-all"
              >
                <div className="w-6 h-6 rounded-full border-2 border-red-200 flex items-center justify-center shrink-0">
                  <X className="w-4 h-4 text-red-600 stroke-[2.5]" />
                </div>
                루트 취소하기
              </Button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
