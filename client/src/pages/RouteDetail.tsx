import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GoogleMap } from '@/components/GoogleMap';
import { trpc } from '@/lib/trpc';
import { CATEGORIES } from '@shared/types';
import { Loader2, Heart, Bookmark, Share2, MapPin, ArrowLeft, Footprints, Car, CheckCircle2, ShieldCheck, Ticket, Download, RotateCcw, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';
import { NotificationBell } from '@/components/NotificationBell';

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
  const d = R * c;
  return Math.round(d * 100) / 100;
}

export default function RouteDetail() {
  const [match, params] = useRoute('/route/:id');
  const routeId = params?.id ? parseInt(params.id) : null;

  const { data: route, isLoading } = trpc.routes.getById.useQuery(routeId || 0, {
    enabled: !!routeId,
  });

  const { data: me } = trpc.auth.me.useQuery();
  const authorUserId = route?.userId || 0;

  const { data: isFav = false, refetch: refetchFav } = trpc.favorites.isFavorited.useQuery(routeId || 0, {
    enabled: !!routeId && !!me,
  });

  const { data: isSaved = false, refetch: refetchSaved } = trpc.saves.isSaved.useQuery(routeId || 0, {
    enabled: !!routeId && !!me,
  });

  const toggleFavorite = trpc.favorites.toggle.useMutation({
    onSuccess: () => refetchFav()
  });
  const toggleSave = trpc.saves.toggle.useMutation({
    onSuccess: () => refetchSaved()
  });
  
  const verifyReceiptMutation = trpc.routes.verifyReceipt.useMutation();

  // Community & Social Features Setup
  const [commentText, setCommentText] = useState("");
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: comments = [], refetch: refetchComments } = trpc.comments.getByRouteId.useQuery(
    { routeId: routeId || 0 },
    { enabled: !!routeId }
  );

  const { data: followStatus = false, refetch: refetchFollow } = trpc.follows.getStatus.useQuery(
    authorUserId,
    { enabled: !!authorUserId && !!me }
  );

  const { data: followStats, refetch: refetchFollowStats } = trpc.follows.getStats.useQuery(
    authorUserId,
    { enabled: !!authorUserId }
  );

  const { data: userActivity, refetch: refetchActivity } = trpc.activities.getUserStatus.useQuery(
    routeId || 0,
    { enabled: !!routeId && !!me }
  );

  const { data: activityStats, refetch: refetchActivityStats } = trpc.activities.getStats.useQuery(
    routeId || 0,
    { enabled: !!routeId }
  );

  const writeCommentMutation = trpc.comments.create.useMutation({
    onSuccess: () => {
      setCommentText("");
      refetchComments();
      toast.success("댓글이 등록되었습니다.");
    },
    onError: () => {
      toast.error("댓글 등록에 실패했습니다.");
    }
  });

  const writeReplyMutation = trpc.comments.create.useMutation({
    onSuccess: () => {
      setReplyText("");
      setReplyToId(null);
      refetchComments();
      toast.success("답글이 등록되었습니다.");
    },
    onError: () => {
      toast.error("답글 등록에 실패했습니다.");
    }
  });

  const likeCommentMutation = trpc.comments.toggleLike.useMutation({
    onSuccess: () => {
      refetchComments();
    }
  });

  const toggleFollowMutation = trpc.follows.toggle.useMutation({
    onSuccess: (res) => {
      refetchFollow();
      refetchFollowStats();
      toast.success(res.isFollowed ? "팔로우를 시작했습니다." : "팔로우를 취소했습니다.");
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const trackActivityMutation = trpc.activities.track.useMutation({
    onSuccess: () => {
      refetchActivity();
      refetchActivityStats();
    }
  });

  const handleFollowRouteActivity = async () => {
    if (!me) {
      toast.error("인증 참여를 위해 먼저 로그인해 주세요.");
      return;
    }
    await trackActivityMutation.mutateAsync({ routeId: routeId || 0, verified: 1 });
    if (!isFollowing) {
      startFollowChallenge();
    }
    toast.success("🏃 '이 루트 따라가봤어요' 참여 및 동선 챌린지가 동시 전개됩니다!");
  };

  // gamified Tracking States synced with localStorage
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [verifiedSteps, setVerifiedSteps] = useState<number[]>([]);
  const [stepExpenditures, setStepExpenditures] = useState<Record<number, number>>({});
  const [unlockedCoupons, setUnlockedCoupons] = useState<number[]>([]);

  // Local file processing
  const [selectedFileBase64, setSelectedFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Sync state from LocalStorage on mount
  useEffect(() => {
    if (routeId) {
      const storedFollowing = localStorage.getItem(`following_route_${routeId}`);
      if (storedFollowing === 'true') {
        setIsFollowing(true);
        const storedStep = localStorage.getItem(`route_${routeId}_curStep`);
        const storedVerified = localStorage.getItem(`route_${routeId}_verified`);
        const storedExp = localStorage.getItem(`route_${routeId}_expenditures`);
        const storedUnlocks = localStorage.getItem(`route_${routeId}_coupons`);

        if (storedStep) setCurrentStep(parseInt(storedStep));
        if (storedVerified) setVerifiedSteps(JSON.parse(storedVerified));
        if (storedExp) setStepExpenditures(JSON.parse(storedExp));
        if (storedUnlocks) setUnlockedCoupons(JSON.parse(storedUnlocks));
      }
    }
  }, [routeId]);

  // Sync state to LocalStorage
  const saveStateToStorage = (
    following: boolean,
    step: number,
    verified: number[],
    expenditure: Record<number, number>,
    coupons: number[]
  ) => {
    if (!routeId) return;
    localStorage.setItem(`following_route_${routeId}`, following ? 'true' : 'false');
    localStorage.setItem(`route_${routeId}_curStep`, step.toString());
    localStorage.setItem(`route_${routeId}_verified`, JSON.stringify(verified));
    localStorage.setItem(`route_${routeId}_expenditures`, JSON.stringify(expenditure));
    localStorage.setItem(`route_${routeId}_coupons`, JSON.stringify(coupons));
  };

  const startFollowChallenge = () => {
    setIsFollowing(true);
    setCurrentStep(0);
    setVerifiedSteps([]);
    setStepExpenditures({});
    setUnlockedCoupons([]);
    setSelectedFileBase64(null);
    setFileName(null);
    saveStateToStorage(true, 0, [], {}, []);
    toast.success('🚀 신뢰 기반 영수증 연동 정주행 도전이 시작되었습니다!');
  };

  const endFollowChallenge = () => {
    setIsFollowing(false);
    setCurrentStep(0);
    setVerifiedSteps([]);
    setStepExpenditures({});
    setUnlockedCoupons([]);
    setSelectedFileBase64(null);
    setFileName(null);
    if (routeId) {
      localStorage.removeItem(`following_route_${routeId}`);
      localStorage.removeItem(`route_${routeId}_curStep`);
      localStorage.removeItem(`route_${routeId}_verified`);
      localStorage.removeItem(`route_${routeId}_expenditures`);
      localStorage.removeItem(`route_${routeId}_coupons`);
    }
    toast.success('🔄 정주행 도전 기록이 리셋되었습니다.');
  };

  // Image upload parsing helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini Analysis mutation
  const handleVerifyReceipt = async (index: number, placeName: string) => {
    if (!selectedFileBase64) {
      toast.warning('영수증 이미지를 업로드해주세요.');
      return;
    }

    setIsUploading(true);
    try {
      const response = await verifyReceiptMutation.mutateAsync({
        placeName: placeName,
        image: selectedFileBase64
      });

      if (response.success) {
        const spent = response.amount;
        
        const newVerified = [...verifiedSteps, index];
        const newExp = { ...stepExpenditures, [index]: spent };
        const newCoupons = [...unlockedCoupons, index];
        const nextStep = currentStep + 1;

        setVerifiedSteps(newVerified);
        setStepExpenditures(newExp);
        setUnlockedCoupons(newCoupons);
        setCurrentStep(nextStep);

        // Reset stage files
        setSelectedFileBase64(null);
        setFileName(null);

        saveStateToStorage(true, nextStep, newVerified, newExp, newCoupons);

        toast.success(`🎉 ${placeName} 영수증 완벽 검증 완료!\n${spent.toLocaleString('ko-KR')}원 지출 확인 및 연계 할인 혜택이 발급되었습니다.`);
      } else {
        toast.error('영수증 확인에 실패했습니다. 다시 시도해 주세요.');
      }
    } catch (err) {
      console.error(err);
      toast.error('영수증 검증 도중 통신 지연 혹은 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/route/${routeId}`;
    navigator.clipboard.writeText(url);
    toast.success('링크가 클립보드에 복사되었습니다');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 sm:bg-[#F3F4F6] text-[#111827] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[640px] bg-[#FAF8FF] rounded-none sm:rounded-3xl border-0 sm:border border-[#EBE8F3] shadow-none sm:shadow-xl overflow-hidden flex flex-col items-center justify-center p-6 min-h-screen sm:min-h-[920px]">
          <Loader2 className="animate-spin w-8 h-8 text-[#5C36EC] mb-2" />
          <span className="text-sm font-semibold text-gray-400">루트 상세 정보 가져오는 중...</span>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen bg-neutral-50 sm:bg-[#F3F4F6] text-[#111827] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[640px] bg-[#FAF8FF] rounded-none sm:rounded-3xl border-0 sm:border border-[#EBE8F3] shadow-none sm:shadow-xl overflow-hidden flex flex-col items-center justify-center p-6 min-h-screen sm:min-h-[920px] text-center">
          <AlertCircle className="w-12 h-12 text-slate-305 mb-2" />
          <p className="text-gray-500 mb-4 font-semibold text-sm">루트를 찾을 수 없습니다</p>
          <Link href="/routes" className="inline-flex items-center justify-center rounded-2xl text-xs font-bold bg-[#5C36EC] text-white h-10 px-4">
            전체 루트 탐색으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.key === category)?.label || category;
  };

  // Safe totals
  const totalExpenditure = Object.values(stepExpenditures).reduce((sum, val) => sum + val, 0);
  const isFinished = isFollowing && currentStep >= route.places.length;

  return (
    <div className="min-h-screen bg-neutral-50 sm:bg-[#F3F4F6] text-[#111827] flex flex-col items-center py-0 sm:py-6 px-0 sm:px-4 md:px-8">
      {/* Outer frame matching the beautiful mockup wrapper */}
      <div className="w-full max-w-[640px] bg-[#FAF8FF] rounded-none sm:rounded-3xl border-0 sm:border border-[#EBE8F3] shadow-none sm:shadow-xl overflow-hidden flex flex-col p-4 sm:p-5 min-h-screen sm:min-h-[920px] relative">
        
        {/* Active Tracking Banner */}
        {isFollowing && !isFinished && (
          <div className="bg-slate-900 border border-slate-800 text-white py-3 px-4 rounded-2xl mb-4 flex flex-col gap-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <span className="animate-pulse flex h-3.5 w-3.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <div className="text-xs">
                <span className="font-bold text-sky-400">정주행 진행중: </span>
                {currentStep + 1}번째 장소 <strong className="text-white">{route.places[currentStep]?.name}</strong> 인증 단계
              </div>
            </div>
            <div className="text-xs flex items-center justify-between border-t border-slate-800 pt-1.5 mt-0.5">
              <span>💥 현재 누적 검증 식비:</span>
              <strong className="text-sky-300 font-mono font-bold text-sm">{totalExpenditure.toLocaleString('ko-KR')}원</strong>
            </div>
          </div>
        )}

        {/* Completion Celebration Overlay */}
        {isFinished && (
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white py-5 px-4 rounded-2xl mb-4 shadow-xl space-y-3 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center gap-1 text-center">
              <Sparkles className="w-8 h-8 text-yellow-300 animate-spin" />
              <h2 className="text-sm sm:text-base font-bold tracking-tight">🏆 {route.title} 완완주 성공!</h2>
              <p className="text-[10px] text-slate-300 font-light">영수증 인증 기반 신뢰 동선 매칭이 최종 완료되었습니다.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 bg-black/25 rounded-xl p-3 text-center">
              <div>
                <span className="block text-[9px] text-slate-400">총 검증 결제액</span>
                <strong className="text-sky-300 text-sm font-mono font-bold">{totalExpenditure.toLocaleString('ko-KR')}원</strong>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400">발급 완료 쿠폰</span>
                <strong className="text-emerald-400 text-sm">{unlockedCoupons.length}장 획득</strong>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="default" className="flex-1 bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 text-xs py-2 h-9 rounded-xl">
                <Download className="w-3.5 h-3.5 mr-1" />
                다운로드
              </Button>
              <Button size="sm" variant="outline" onClick={endFollowChallenge} className="flex-1 text-white border-white/20 hover:bg-white/10 text-xs py-2 h-9 rounded-xl">
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                재도전
              </Button>
            </div>
          </div>
        )}

        {/* Top Header Controls */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <Link href="/routes" className="flex items-center gap-1 text-sm font-semibold text-[#5C36EC] hover:underline">
            <ArrowLeft className="w-4 h-4" /> 전체 루트 탐색
          </Link>
          <span className="text-base font-extrabold text-[#111827]">
            루트 상세 보기
          </span>
          <NotificationBell />
        </div>

        {/* Route Header Info Card */}
        <div className="bg-white border border-[#EBE8F3] rounded-3xl p-5 mb-5 shadow-xs space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-[9px] px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                Verified Route
              </span>
              {activityStats && activityStats.hikersCount > 0 && (
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 font-extrabold text-[9px] px-2.5 py-1 rounded-full flex items-center gap-1">
                  🏃 {activityStats.hikersCount}명 검증인 참여 ({activityStats.verifiedCount}명 완주)
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight leading-snug">
              {route.title}
            </h1>
          </div>

          <div className="flex gap-2 w-full pt-1">
            <Button
              variant={isFav ? 'default' : 'outline'}
              onClick={() => toggleFavorite.mutate(routeId || 0)}
              disabled={toggleFavorite.isPending}
              className={`flex-1 h-9 rounded-xl text-xs font-bold gap-1 ${isFav ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'border-gray-200 text-gray-600'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current animate-pulse text-rose-550' : ''}`} />
              좋아요 {route.likeCount}
            </Button>
            <Button
              variant={isSaved ? 'default' : 'outline'}
              onClick={() => toggleSave.mutate(routeId || 0)}
              disabled={toggleSave.isPending}
              className={`flex-1 h-9 rounded-xl text-xs font-bold gap-1 ${isSaved ? 'bg-indigo-950 hover:bg-indigo-900 text-white' : 'border-gray-200 text-gray-600'}`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current text-indigo-550' : ''}`} />
              저장 {route.saveCount}
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="px-3.5 h-9 rounded-xl text-xs border-gray-200 text-gray-600 animate-in fade-in"
            >
              <Share2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Creator / Designer Card block */}
        {route.author && (
          <div className="bg-white border border-[#EBE8F3] rounded-2xl p-4 mb-5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50 text-indigo-700 font-extrabold flex items-center justify-center text-sm border border-indigo-200 uppercase shrink-0">
                {route.author.name?.substring(0, 1) || "U"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-gray-900 text-xs sm:text-sm truncate whitespace-nowrap shrink-0">@{route.author.name}</span>
                  <span className="bg-neutral-100 text-[9px] text-gray-500 font-bold px-1.5 py-0.5 rounded">디자이너</span>
                </div>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                  팔로워 <span className="text-gray-700">{followStats?.followers || 0}</span> · 팔로잉 <span className="text-gray-700">{followStats?.following || 0}</span>
                </p>
              </div>
            </div>
            {me && me.id !== route.author.id && (
              <Button 
                size="sm" 
                variant={followStatus ? "outline" : "default"}
                className={`h-8 text-xs font-bold px-3 rounded-full shrink-0 transition-all ${
                  followStatus 
                    ? 'border-neutral-200 text-gray-500 hover:bg-gray-50' 
                    : 'bg-[#5C36EC] hover:bg-indigo-700 text-white shadow-xs'
                }`}
                onClick={() => toggleFollowMutation.mutate(route.author.id)}
                disabled={toggleFollowMutation.isPending}
              >
                {followStatus ? "팔로잉" : "+ 팔로우"}
              </Button>
            )}
          </div>
        )}

        {/* Core Theme / Guidelines Descriptions */}
        {route.description && (
          <div className="bg-white border border-[#EBE8F3] rounded-2xl p-4.5 mb-5 shadow-xs">
            <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wide block mb-1">코스 소개 및 기획 테마</span>
            <p className="text-gray-600 text-xs font-bold whitespace-pre-line leading-relaxed">
              {route.description}
            </p>
          </div>
        )}

        {/* Map simulation viewer - embedded neatly into column */}
        {route.places && route.places.length > 0 && (
          <div className="bg-white border border-[#EBE8F3] rounded-2xl overflow-hidden mb-5 shadow-sm flex flex-col">
            <div className="bg-slate-900 py-2.5 px-4 text-white text-xs font-bold flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 animate-bounce" /> 동선 가상 시각화 시뮬레이터
              </span>
              <span className="text-[9px] text-slate-400 font-mono">Dynamic Line</span>
            </div>
            <div className="h-[280px] w-full relative">
              <GoogleMap
                places={route.places.map(p => ({
                  ...p,
                  color: CATEGORIES.find(c => c.key === p.category)?.color || '#5C36EC',
                }))}
                height="100%"
                drawPath={true}
              />
            </div>
            <div className="p-3 bg-neutral-50/70 border-t border-neutral-100 flex items-center justify-between text-[10px] font-bold text-gray-500">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[#5C36EC]" /> 전체 {route.places?.length}개 경유 코스</span>
              <span className="text-gray-400">지도 동선 반영 완료</span>
            </div>
          </div>
        )}

        {/* Quick Route Summary Matrix */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 bg-white border border-[#EBE8F3] rounded-2xl shadow-xs">
            <span className="block text-[10px] text-gray-400 font-bold mb-0.5">완주 시뮬레이터 구성</span>
            <strong className="text-sm font-black text-gray-900">{route.places?.length}개 지명 코스</strong>
          </div>
          <div className="p-3.5 bg-indigo-50/30 border border-indigo-100/40 rounded-2xl">
            <span className="block text-[10px] text-indigo-700/80 font-bold mb-0.5">총 소요 예상 (도보)</span>
            <strong className="text-sm font-black text-[#5C36EC]">약 {route.places && route.places.length >= 2 ? Math.round(route.places.length * 15) : 0}분 소요</strong>
          </div>
        </div>

        {/* Places 방문 동선 Timeline */}
        <div className="space-y-4 mb-6">
          <h2 className="text-sm sm:text-base font-black text-[#111827] flex items-center justify-between">
            <span>📍 정주행 코스 세부 정보</span>
            <span className="text-xs font-bold text-gray-500 font-mono">동선 마디: {route.places?.length}</span>
          </h2>

          <div className="space-y-3 relative">
            {route.places?.map((place, index) => {
              const isUnlocked = !isFollowing || index <= currentStep;
              const isCompleted = isFollowing && (index < currentStep || verifiedSteps.includes(index));
              const isActive = isFollowing && index === currentStep;

              return (
                <div key={place.id} className="relative">
                  {/* Inter-node navigation stats summary */}
                  {index > 0 && route.places && (
                    <div className="my-2.5 flex justify-center">
                      <div className="bg-white border border-[#EBE8F3] rounded-full px-4 py-1 flex items-center gap-2 text-[10px] font-bold text-gray-500 shadow-sm">
                        <span className="flex items-center">
                          <Footprints className="w-3 h-3 mr-1 text-[#5C36EC]" /> 
                          도보 {Math.max(1, Math.round(getDistanceKm(Number(route.places[index-1].latitude), Number(route.places[index-1].longitude), Number(place.latitude), Number(place.longitude)) * 15))}분
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="flex items-center">
                          <Car className="w-3 h-3 mr-1 text-emerald-500" /> 
                          차량 {Math.max(1, Math.round(getDistanceKm(Number(route.places[index-1].latitude), Number(route.places[index-1].longitude), Number(place.latitude), Number(place.longitude)) * 1.5))}분
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="text-[#5C36EC]">
                          {getDistanceKm(Number(route.places[index-1].latitude), Number(route.places[index-1].longitude), Number(place.latitude), Number(place.longitude))} km
                        </span>
                      </div>
                    </div>
                  )}

                  <Card className={`p-4.5 transition-all relative overflow-hidden border rounded-2xl ${
                    isActive 
                      ? 'border-[#5C36EC] shadow-md ring-1 ring-indigo-100 bg-white' 
                      : isCompleted 
                        ? 'border-emerald-200 bg-emerald-50/10' 
                        : !isUnlocked 
                          ? 'opacity-50 border-neutral-200 bg-neutral-100/50 select-none' 
                          : 'border-[#EBE8F3] bg-white hover:border-gray-300'
                  }`}>
                    
                    {/* State Labels and Badges */}
                    <div className="absolute top-4 right-4 flex gap-1 select-none text-[9px] font-bold">
                      {isCompleted && (
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center border border-emerald-200 font-extrabold">
                          <ShieldCheck className="w-3 h-3 mr-0.5 text-emerald-600" />
                          검증완료
                        </span>
                      )}
                      {isActive && (
                        <span className="bg-[#5C36EC] text-white px-2.5 py-0.5 rounded-full flex items-center border border-indigo-700 animate-pulse font-extrabold">
                          🔥 현재 도전지
                        </span>
                      )}
                      {!isUnlocked && (
                        <span className="bg-neutral-200 text-neutral-500 px-2 py-0.5 rounded-full flex items-center border border-neutral-300 font-extrabold">
                          🔒 미개방
                        </span>
                      )}
                    </div>

                    <div className="flex gap-4">
                      {/* Place index marker */}
                      <div className={`p-2 w-9 h-9 rounded-xl font-black flex items-center justify-center shrink-0 text-xs border ${
                        isActive
                          ? 'bg-[#5C36EC] text-white border-[#5C36EC]'
                          : isCompleted
                            ? 'bg-emerald-500 text-white border-emerald-600'
                            : 'bg-neutral-100 text-gray-500 border-neutral-200'
                      }`}>
                        {index + 1}
                      </div>

                      <div className="space-y-1.5 min-w-0 flex-1 pr-14 sm:pr-20">
                        <h3 className="font-extrabold text-gray-900 text-sm sm:text-base flex items-center gap-1.5 truncate">
                          {place.name}
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold leading-none">
                          {getCategoryLabel(place.category)}
                        </p>
                        {place.address && (
                          <p className="text-[11px] text-gray-500 font-bold truncate">{place.address}</p>
                        )}
                        {place.description && (
                          <p className="text-xs text-gray-600 leading-relaxed bg-[#FAF8FF] p-2 rounded-xl border border-neutral-100 mt-2 font-bold">
                            {place.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Verified Expenditures if completed */}
                    {isCompleted && stepExpenditures[index] && (
                      <div className="mt-3.5 pt-3 border-t border-dashed border-emerald-100 flex justify-between items-center text-[10px] sm:text-xs font-bold">
                        <span className="text-emerald-700">OCR 인증금액 자동분석</span>
                        <span className="text-emerald-800 font-black font-mono">
                          💸 +{stepExpenditures[index].toLocaleString('ko-KR')}원 합산 완료
                        </span>
                      </div>
                    )}

                    {/* Active Step Receipts Image Upload Verification tool */}
                    {isActive && (
                      <div className="mt-4 pt-4 border-t border-indigo-100/50 space-y-4">
                        <div className="p-3 bg-indigo-50/50 border border-indigo-100/40 rounded-xl text-[10px] sm:text-xs font-bold text-indigo-950 flex gap-2 w-full">
                          <AlertCircle className="w-4 h-4 text-[#5C36EC] shrink-0 mt-0.5" />
                          <span>
                            방문 내역 인증용 {place.name}의 실물/온라인 영수증 사진 이미지를 업로드해 주세요.
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch gap-3">
                          <div className="flex-1 relative border border-dashed border-indigo-200/60 hover:border-[#5C36EC] bg-indigo-50/20 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer min-h-[90px]">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full animate-in"
                            />
                            <FileText className="w-6 h-6 text-[#5C36EC] mb-1 animate-pulse" />
                            <span className="text-[11px] font-bold text-indigo-900 block truncate max-w-[200px]">
                              {fileName ? fileName : '실물 영수증 이미지 드롭/선택'}
                            </span>
                            <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">JPG, PNG 확장자 호환</span>
                          </div>

                          {selectedFileBase64 && (
                            <div className="shrink-0 w-22 h-22 border border-indigo-200 rounded-xl overflow-hidden bg-neutral-50 flex items-center justify-center relative mx-auto sm:mx-0">
                              <img src={selectedFileBase64} alt="Recipe Preview" className="w-full h-full object-cover" />
                              <button
                                onClick={() => { setSelectedFileBase64(null); setFileName(null); }}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] leading-none shadow-md font-bold"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => handleVerifyReceipt(index, place.name)}
                          disabled={isUploading || !selectedFileBase64}
                          className="w-full h-10 bg-[#5C36EC] hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm"
                        >
                          {isUploading ? (
                            <span className="flex items-center gap-1.5">
                              <Loader2 className="animate-spin w-4 h-4 text-white" />
                              영수증 판독 중...
                            </span>
                          ) : (
                            '🔍 영수증 고속 판독 및 실시간 인증'
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Unlocked special co-brand coupon */}
                    {unlockedCoupons.includes(index) && (
                      <div className="mt-3 bg-gradient-to-r from-amber-50 to-amber-100 p-3 rounded-xl border border-amber-200 flex items-center justify-between text-[11px] animate-in zoom-in-95 duration-200 w-full min-w-0">
                        <div className="flex items-center gap-2 text-amber-900 font-bold min-w-0 flex-1">
                          <Ticket className="w-4 h-4 text-amber-600 shrink-0 fill-amber-300" />
                          <div className="min-w-0 flex-1">
                            <span className="block font-black text-xs text-amber-950 truncate">🎁 제휴사 15% 쿠폰</span>
                            <span className="text-[9px] text-amber-700 font-semibold truncate block">{place.name} 완주 연계</span>
                          </div>
                        </div>
                        <span className="font-mono bg-amber-200 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase shrink-0">
                          RM{routeId}V-{index}
                        </span>
                      </div>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Follow Challenge action card */}
        {!isFollowing && (
          <Card className="p-5 border-indigo-100 shadow-md bg-indigo-50/20 text-center space-y-4 rounded-2xl mb-6">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Sparkles className="w-8 h-8 text-[#5C36EC] fill-indigo-100 animate-bounce" />
              <h3 className="text-sm sm:text-base font-black text-gray-900">✨ 이 루트 정주행에 참여해볼까요?</h3>
              <p className="text-xs text-gray-500 font-bold max-w-sm leading-relaxed text-center">
                실제 영수증 결제인증을 바탕으로 정직하고 확실한 완주 기록을 만듭니다. 완주 시 VIP 쿠폰을 수령할 수 있습니다!
              </p>
            </div>
            
            <div className="flex flex-col gap-2 max-w-sm mx-auto w-full">
              <Button 
                onClick={startFollowChallenge} 
                className="w-full h-11 bg-[#5C36EC] hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                🚀 영수증 검증 챌린지 시작
              </Button>
              <Button 
                variant="outline" 
                onClick={handleFollowRouteActivity}
                disabled={trackActivityMutation.isPending}
                className="w-full h-11 border-neutral-200 text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-center gap-1 font-bold text-xs rounded-xl shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                이 코스 다녀왔어요 (기본인증)
              </Button>
            </div>
          </Card>
        )}

        {isFollowing && !isFinished && (
          <div className="bg-white border border-[#EBE8F3] rounded-2xl p-4 mb-6 flex justify-between items-center text-xs shadow-xs">
            <span className="text-gray-400 font-bold">도전을 중단하거나 포기하시겠습니까?</span>
            <Button variant="ghost" size="sm" onClick={endFollowChallenge} className="text-rose-500 font-bold hover:bg-rose-50 rounded-lg">
              초기화
            </Button>
          </div>
        )}

        {/* Combined Memo & Comments Session Block */}
        <div className="bg-white border border-[#EBE8F3] rounded-3xl p-5 mb-5 shadow-xs space-y-5">
          <h3 className="text-sm sm:text-base font-black text-gray-900 border-b border-neutral-100 pb-3 flex items-center gap-1.5">
            💬 실시간 방문 메모 & 피드백 ({comments.length}개)
          </h3>

          {/* New message input write board */}
          {me ? (
            <div className="space-y-2.5">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="꿀팁, 웨이팅 정보, 주차 정보 등을 자유롭게 작성해주세요..."
                className="w-full min-h-[90px] p-3 text-xs border border-[#DCD7EC] bg-neutral-50/30 rounded-2xl focus:border-[#5C36EC] outline-none resize-none font-bold placeholder-gray-400 leading-normal"
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => {
                    if (!commentText.trim()) return;
                    writeCommentMutation.mutate({ routeId: routeId!, content: commentText });
                  }}
                  disabled={writeCommentMutation.isPending}
                  className="bg-[#5C36EC] hover:bg-indigo-700 text-white font-extrabold h-9 text-xs px-4 rounded-xl shadow-xs"
                >
                  {writeCommentMutation.isPending ? "작성 중..." : "글 남기기"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-center text-xs text-gray-400 font-bold">
              회원 로그인 시 피드백 코멘트 남기기가 가능합니다.
            </div>
          )}

          {/* Feedback list */}
          <div className="space-y-4 divide-y divide-gray-100 pt-1">
            {comments.filter(c => !c.parentId).map((comment) => {
              const replies = comments.filter(r => r.parentId === comment.id);
              return (
                <div key={comment.id} className="pt-4 space-y-3 first:pt-0">
                  
                  {/* Master comment wrapper */}
                  <div className="flex gap-3 text-xs">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-100 to-gray-50 border border-gray-200/50 font-black text-gray-700 flex items-center justify-center shrink-0 uppercase">
                      {comment.user?.name?.substring(0, 1) || "U"}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-gray-900 truncate whitespace-nowrap shrink-0">@{comment.user?.name}</span>
                        <span className="text-[9px] text-gray-300 font-bold font-mono shrink-0">
                          {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <p className="text-gray-600 font-bold leading-relaxed whitespace-pre-line text-[11px] sm:text-xs">
                        {comment.content}
                      </p>
                      
                      <div className="flex items-center gap-3 pt-1">
                        <button 
                          onClick={() => likeCommentMutation.mutate(comment.id)}
                          className={`flex items-center gap-0.5 text-[10px] font-bold transition-colors ${comment.likedByMe ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" />
                          좋아요 {comment.likeCount}
                        </button>
                        <button 
                          onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                          className="text-[10px] text-gray-400 font-bold hover:text-gray-600"
                        >
                          답글 {replies.length > 0 && `(${replies.length})`}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Reply editor input trigger toggle block */}
                  {replyToId === comment.id && me && (
                    <div className="ml-8 p-3 bg-neutral-50/50 border border-neutral-100 rounded-2xl space-y-2 animate-in slide-in-from-top-1 duration-150">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="전달하고 싶은 답글을 정성스레 적어보세요..."
                        className="w-full min-h-[60px] p-2.5 text-xs bg-white border border-[#DCD7EC] rounded-xl focus:border-[#5C36EC] outline-none resize-none font-bold"
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setReplyToId(null)}
                          className="h-7 text-xs text-gray-400 font-bold hover:bg-neutral-100 rounded-lg"
                        >
                          취소
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => {
                            if (!replyText.trim()) return;
                            writeReplyMutation.mutate({ routeId: routeId!, parentId: comment.id, content: replyText });
                          }}
                          disabled={writeReplyMutation.isPending}
                          className="bg-[#5C36EC] hover:bg-indigo-700 text-white font-extrabold h-7 text-xs px-3 rounded-lg"
                        >
                          등록
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Sub replies mapping container */}
                  {replies.length > 0 && (
                    <div className="ml-8 space-y-3 pt-1 border-l-2 border-neutral-100 pl-3">
                      {replies.map((reply) => (
                        <div key={reply.id} className="flex gap-2.5 text-xs">
                          <div className="w-6.5 h-6.5 rounded-full bg-neutral-100 font-extrabold text-gray-700 flex items-center justify-center shrink-0 uppercase text-[9px]">
                            {reply.user?.name?.substring(0, 1) || "U"}
                          </div>
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-gray-800 truncate whitespace-nowrap shrink-0">@{reply.user?.name}</span>
                              <span className="text-[8px] text-gray-300 font-mono shrink-0">
                                {new Date(reply.createdAt).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                            <p className="text-gray-600 font-semibold leading-relaxed text-[11px] whitespace-pre-line">
                              {reply.content}
                            </p>
                            <button 
                              onClick={() => likeCommentMutation.mutate(reply.id)}
                              className={`flex items-center gap-0.5 text-[9px] font-bold ${reply.likedByMe ? 'text-[#5C36EC]' : 'text-gray-400'}`}
                            >
                              <Heart className="w-2.5 h-2.5" /> 좋아요 {reply.likeCount}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {comments.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-400 font-bold">
                첫 번째 코멘트를 작성해 마디 기록을 풍성하게 해주세요!
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
