import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Loader2, 
  Search, 
  ChevronRight, 
  Bookmark, 
  MapPin, 
  Sparkles, 
  LogIn, 
  Settings,
  Coins,
  Gift,
  ExternalLink,
  Heart,
  SlidersHorizontal,
  Footprints,
  CalendarDays,
  Music,
  Globe,
  Palette,
  Compass
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { NotificationBell } from "@/components/NotificationBell";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [savedPlaceIds, setSavedPlaceIds] = useState<number[]>([]);

  // Ad monetization settings states
  const [coupangLink, setCoupangLink] = useState("https://search.shopping.naver.com/search/all?query=에버랜드+자유이용권");
  const [adsenseHtml, setAdsenseHtml] = useState("");
  const [isAdSettingsOpen, setIsAdSettingsOpen] = useState(false);
  const [tempCoupangLink, setTempCoupangLink] = useState("");
  const [tempAdsenseHtml, setTempAdsenseHtml] = useState("");

  // Scroll ref for horizontal lists
  const recommendedScrollRef = useRef<HTMLDivElement>(null);

  // Load saved places & monetization on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("saved_place_ids");
      if (stored) {
        setSavedPlaceIds(JSON.parse(stored));
      }

      const savedCoupang = localStorage.getItem("coupang_partners_link");
      if (savedCoupang) {
        setCoupangLink(savedCoupang);
        setTempCoupangLink(savedCoupang);
      } else {
        setTempCoupangLink("https://search.shopping.naver.com/search/all?query=에버랜드+자유이용권");
      }

      const savedAdsense = localStorage.getItem("adsense_active_html");
      if (savedAdsense) {
        setAdsenseHtml(savedAdsense);
        setTempAdsenseHtml(savedAdsense);
      }
    } catch (e) {
      console.error("Failed to load saved settings:", e);
    }
  }, []);

  // Fetch all user-created routes to showcase down in '실시간 커뮤니티'
  const { data: routes = [], isLoading: routesLoading } = trpc.routes.getAll.useQuery({
    sortBy: "recent"
  });

  const [activeLocalRoute, setActiveLocalRoute] = useState<any>(null);
  const [activeStepVal, setActiveStepVal] = useState<number>(0);

  // Track active following route dynamically
  useEffect(() => {
    if (routes && routes.length > 0) {
      const active = routes.find((r: any) => localStorage.getItem(`following_route_${r.id}`) === 'true');
      if (active) {
        setActiveLocalRoute(active);
        const step = parseInt(localStorage.getItem(`route_${active.id}_curStep`) || "0");
        setActiveStepVal(step);
      } else {
        setActiveLocalRoute(null);
      }
    }
  }, [routes]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/routes?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      setLocation("/routes");
    }
  };

  const [showSeoulSubCategories, setShowSeoulSubCategories] = useState(true);

  const handleCategoryClick = (categoryName: string) => {
    if (categoryName === "서울") {
      setShowSeoulSubCategories(prev => !prev);
      toast.info("📍 서울 지역의 성수・홍대・이태원・잠실 핫플레이스 목록을 보려면 다시 클릭해보세요.");
    } else {
      setLocation(`/routes?region=서울&search=${encodeURIComponent(categoryName)}`);
      toast.info(`📍 서울 '${categoryName}' 해시태그 게시글만을 필터링하여 찾아드립니다!`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <Loader2 className="animate-spin w-8 h-8 text-[#5C36EC]" />
      </div>
    );
  }

  // Exact Week Curations mockups matching user reference image
  const curatedWeekRoutes = [
    {
      id: "curated-1",
      title: "힐링하기 좋은 서울 미디어 전시 루트",
      authorName: "김지현",
      authorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
      image: "https://images.unsplash.com/photo-1549417229-aa67d3263c09?auto=format&fit=crop&w=600&q=80",
      tag: "전시・문화",
      tagColor: "bg-[#F0EDFF] text-[#5C36EC]",
      description: "서울의 감성적인 미디어 전시 공간을 담은 힐링 코스입니다. 빛과 음악, 예술이 어우러진 공간을 순서대로 경험해보세요.",
      time: "도보 181분",
      stops: "4개 경유지",
      hearts: "128",
      bookmarks: "342",
      badge: "이주의 추천"
    },
    {
      id: "curated-2",
      title: "감성 가득 성수동 빈티지 투어",
      authorName: "이진아",
      authorImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
      image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80",
      tag: "데이트",
      tagColor: "bg-[#E6F9F5] text-teal-600",
      description: "성수동의 숨겨진 감성 가득한 에스프레소 바와 빈티지 숍들을 엮어 가볍게 산책하기 편안한 힐링 데이트 코스입니다.",
      time: "도보 85분",
      stops: "3개 경유지",
      hearts: "95",
      bookmarks: "220",
      badge: "인기 데이트"
    }
  ];

  // Under '추천 루트' Section
  const recommendedCuratedRoutes = [
    {
      id: "rec-1",
      title: "서울 도심 야경 전시 산책",
      authorName: "박서연",
      dateLabel: "6월 19일",
      authorImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80",
      tag: "야경・문화",
      tagColor: "bg-indigo-50 text-indigo-600",
      description: "서울의 밤을 더욱 아름답게 만드는 야경 전시 공간을 따라 걷는 감성 루트입니다.",
      time: "도보 159분",
      stops: "3개 경유지",
      hearts: "154",
      bookmarks: "289",
      region: "서울"
    },
    {
      id: "rec-2",
      title: "디자인과 우주를 잇는 전시 루트",
      authorName: "최준호",
      dateLabel: "6월 18일",
      authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=300&q=80",
      tag: "디자인・전시",
      tagColor: "bg-purple-50 text-purple-600",
      description: "디자인과 우주를 테마로 한 전시 공간을 연결한 창의적인 코스입니다.",
      time: "도보 181분",
      stops: "4개 경유지",
      hearts: "201",
      bookmarks: "412",
      region: "경기"
    }
  ];

  // Regional categories capturing the user preference
  const regionalSpots = [
    {
      name: "서울",
      subtext: "성수・홍대・이태원・잠실 일대",
      image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=400&q=80",
      badge: "메인 서울 핫플",
      description: "트렌디한 핫플레이스를 집대성한 대표 코스"
    },
    {
      name: "경기",
      subtext: "용인・가평・수원",
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80",
      badge: "수려한 근교 힐링",
      description: "한적한 근교 드라이브 명소"
    },
    {
      name: "인천",
      subtext: "송도・바다 드라이브",
      image: "https://images.unsplash.com/photo-1616719543714-c13f631fcce2?auto=format&fit=crop&w=300&q=80",
      badge: "로맨틱 서해 바람",
      description: "감성 가득 바닷가 코스"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#1F2937] flex flex-col items-center py-0 sm:py-8 px-0 sm:px-4 md:px-8 font-sans">
      
      {/* Device Container Simulating Spacious & Fluid Interface (max-w 640px) */}
      <div className="w-full max-w-[640px] bg-white rounded-none sm:rounded-[36px] border-0 sm:border border-[#ECEAF5] shadow-none sm:shadow-2xl overflow-hidden flex flex-col p-5 sm:p-7 min-h-screen sm:min-h-[920px] pb-32">
        
        {/* Top Header - Pure Brand Craft */}
        <div className="flex items-center justify-between mb-6 select-none border-b border-neutral-50 pb-4">
          <Link href="/" className="flex items-center shrink-0">
            <span className="text-3xl font-black bg-gradient-to-r from-[#5C36EC] to-[#8063f2] bg-clip-text text-transparent tracking-tighter">
              RUTEMATE
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <NotificationBell />
            {isAuthenticated ? (
              <Link href="/my" className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#5C36EC] shadow-md hover:scale-105 active:scale-95 duration-150 transition-all cursor-pointer">
                <img 
                  referrerPolicy="no-referrer"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" 
                  alt="Profile"
                  className="w-full h-full object-cover" 
                />
              </Link>
            ) : (
              <a 
                href={getLoginUrl()} 
                className="flex items-center gap-1.5 text-xs font-black text-white bg-[#5C36EC] hover:bg-[#4b2bc9] px-5 py-3 rounded-2xl transition-all shadow-sm active:scale-95"
                id="login-btn"
              >
                <LogIn className="w-3.5 h-3.5" />
                로그인
              </a>
            )}
          </div>
        </div>

        {/* Welcome Phrase */}
        <div className="mb-6 select-none text-left">
          <h2 className="text-2xl sm:text-[26px] font-black tracking-tight leading-snug text-gray-950">
            어디로 떠나볼까요?<br />
            <span className="bg-gradient-to-r from-[#5C36EC] to-indigo-500 bg-clip-text text-transparent">낭만 가득한 맞춤 루트 추천</span> ✨
          </h2>
          <p className="text-sm font-bold text-gray-400 mt-1.5">이색적인 일정과 나들이 스팟을 한눈에 설계해 보세요</p>
        </div>

        {/* Premium Large Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full mb-8">
          <div className="flex items-center bg-[#FAF9FF] rounded-[24px] border border-[#DECEFF] focus-within:border-[#5C36EC] focus-within:ring-4 focus-within:ring-[#5C36EC]/10 focus-within:bg-white shadow-xs hover:shadow-sm transition-all pr-2 pl-4 py-1.5">
            <Search className="w-5 h-5 text-[#9CA3AF] shrink-0" />
            <input
              type="text"
              className="flex-1 min-w-0 bg-transparent text-sm sm:text-base py-3 px-3 outline-none text-gray-900 placeholder-[#9CA3AF] font-bold"
              placeholder="장소, 지하철역 혹은 역명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="h-6 w-[1px] bg-neutral-200 mx-2 shrink-0" />
            <button
              type="button"
              onClick={() => setLocation("/routes")}
              className="flex items-center gap-1.5 text-xs font-black text-[#5C36EC] bg-white border border-[#E9E4FF] hover:bg-[#F0EDFF] transition-all px-4 py-2.5 rounded-2xl shrink-0 shadow-3xs active:scale-95"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>필터</span>
            </button>
          </div>
        </form>

        {/* Dynamic Partner Banner */}
        {adsenseHtml ? (
          <div className="w-full bg-white border border-[#DECEFF] rounded-[26px] p-2.5 mb-8 relative overflow-hidden shadow-xs hover:shadow-sm transition-all">
            <div className="absolute top-2.5 right-2.5 z-20">
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAdSettingsOpen(true); }}
                className="p-1 rounded bg-black/40 text-white hover:bg-black/60 transition-all"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
            <div 
              className="w-full overflow-hidden flex justify-center text-xs"
              dangerouslySetInnerHTML={{ __html: adsenseHtml }}
            />
          </div>
        ) : (
          <div
            onClick={() => setIsAdSettingsOpen(true)}
            className="w-full bg-gradient-to-r from-[#FAF8FF] to-[#F1ECFF] border border-[#DECEFF] rounded-[26px] p-5 mb-8 flex items-center justify-between relative overflow-hidden cursor-pointer group shadow-xs hover:shadow-md transition-all duration-300"
          >
            <div className="flex flex-col pr-6 text-left">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="bg-[#5C36EC] text-white text-[9px] font-black px-2 py-0.5 rounded-lg font-sans">AFFILIATE</span>
                <span className="text-xs font-bold text-[#5C36EC] flex items-center gap-1">특가 연동 파트너스 <ExternalLink className="w-3 h-3 text-[#5C36EC]" /></span>
              </div>
              <p className="text-gray-950 text-sm sm:text-base font-black leading-snug">
                에버랜드 & 아르떼뮤지엄 할인 티켓<br />
                <span className="text-[#5C36EC] font-bold">최대 40% 단독 정산 할인 진행 완료</span>
              </p>
            </div>
            <Gift className="w-9 h-9 text-[#5C36EC] shrink-0 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
          </div>
        )}

        {/* Section: Sub-regions Horizontal Quick Ribbon */}
        <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-none snap-x select-none mb-8">
          <div
            onClick={() => {
              setShowSeoulSubCategories(prev => !prev);
              toast.info(showSeoulSubCategories ? "📌 서울 카테고리를 축소했습니다." : "📌 서울 카테고리를 전체 펼쳤습니다.");
            }}
            className={`snap-start shrink-0 flex items-center gap-2 px-5 py-4 rounded-[20px] border cursor-pointer text-sm font-black transition-all ${
              showSeoulSubCategories 
                ? "bg-[#5C36EC] text-white border-[#5C36EC] shadow-md shadow-[#5C36EC]/15" 
                : "bg-white text-gray-800 border-[#EBE8F3] hover:border-[#5C36EC]"
            }`}
          >
            <MapPin className="w-4 h-4 shrink-0" />
            <span>서울 전체보기</span>
          </div>

          <div
            onClick={() => handleCategoryClick("성수")}
            className="snap-start shrink-0 flex items-center gap-2 px-5 py-4 bg-white border border-[#EBE8F3] hover:border-[#5C36EC] rounded-[20px] cursor-pointer text-sm font-black text-gray-850 hover:text-[#5C36EC] hover:shadow-xs hover:-translate-y-px transition-all"
          >
            <Palette className="w-4 h-4 text-violet-500 shrink-0" />
            <span>성수 팝업 🎨</span>
          </div>

          <div
            onClick={() => handleCategoryClick("홍대")}
            className="snap-start shrink-0 flex items-center gap-2 px-5 py-4 bg-white border border-[#EBE8F3] hover:border-[#5C36EC] rounded-[20px] cursor-pointer text-sm font-black text-gray-850 hover:text-emerald-600 hover:shadow-xs hover:-translate-y-px transition-all"
          >
            <Music className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>홍대 버스킹 🎸</span>
          </div>

          <div
            onClick={() => handleCategoryClick("이태원")}
            className="snap-start shrink-0 flex items-center gap-2 px-5 py-4 bg-white border border-[#EBE8F3] hover:border-[#5C36EC] rounded-[20px] cursor-pointer text-sm font-black text-gray-850 hover:text-rose-600 hover:shadow-xs hover:-translate-y-px transition-all"
          >
            <Globe className="w-4 h-4 text-rose-500 shrink-0" />
            <span>이태원 맛집 🍕</span>
          </div>

          <div
            onClick={() => handleCategoryClick("잠실")}
            className="snap-start shrink-0 flex items-center gap-2 px-5 py-4 bg-white border border-[#EBE8F3] hover:border-[#5C36EC] rounded-[20px] cursor-pointer text-sm font-black text-gray-850 hover:text-[#0284C7] hover:shadow-xs hover:-translate-y-px transition-all"
          >
            <Compass className="w-4 h-4 text-sky-500 shrink-0" />
            <span>잠실 호수 🎡</span>
          </div>
        </div>

        {/* Section: Ongoing Tracker Dashboard */}
        <div className="w-full mb-8 text-left">
          <div className="flex items-end justify-between mb-3 select-none">
            <h3 className="text-xs sm:text-sm font-extrabold text-gray-400 uppercase tracking-widest">진행 중인 이색 코스 🗺️</h3>
          </div>

          {activeLocalRoute ? (
            <div className="relative w-full bg-gradient-to-br from-[#5C36EC] via-[#6e4bee] to-[#8063f2] text-white rounded-[28px] p-6 shadow-md shadow-[#5C36EC]/15 overflow-hidden group select-none transition-all duration-300">
              {/* Decorative faint circles */}
              <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute -left-10 -top-10 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

              <div className="relative z-10 flex flex-col text-left">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-white/20 backdrop-blur-xs text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider text-purple-100 flex items-center gap-1.5 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    나침반 연동 트래킹 중
                  </span>
                  <span className="text-[11px] font-bold text-purple-200">
                    총 {activeLocalRoute.places?.length || 0}곳 코스
                  </span>
                </div>

                <h4 className="text-xl font-black mb-1.5 text-white leading-tight truncate">
                  {activeLocalRoute.title}
                </h4>
                
                <p className="text-xs text-purple-200 font-bold mb-5 truncate">
                  {activeLocalRoute.places?.[activeStepVal]?.name ? `현재 목적지: ${activeLocalRoute.places[activeStepVal].name}` : "이색적인 도보 여정을 순서대로 밟아보세요"}
                </p>

                {/* Tracking Progress Bar */}
                <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden mb-5">
                  <div 
                    className="bg-white h-3 rounded-full transition-all duration-700 shadow-inner" 
                    style={{ width: `${Math.max(12, Math.round((activeStepVal / (activeLocalRoute.places?.length || 1)) * 100))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-100">
                    전체 중 <strong className="text-white text-base font-black">{activeStepVal}곳</strong> 발견 완료 ({Math.round((activeStepVal / (activeLocalRoute.places?.length || 1)) * 100)}%)
                  </span>

                  <button
                    onClick={() => {
                      setLocation(`/route/${activeLocalRoute.id}`);
                      toast.success("진행하시던 트래킹 안내지도로 이동합니다!");
                    }}
                    className="flex items-center gap-1.5 text-xs font-black text-[#5C36EC] bg-white hover:bg-neutral-50 hover:scale-103 active:scale-97 transition-all px-4.5 py-3 rounded-xl shadow-md border-0 cursor-pointer"
                  >
                    이어서 완주하기 🚀
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full bg-gradient-to-r from-[#FAF9FF] to-[#FAF8FF] border-2 border-dashed border-[#5C36EC]/25 rounded-[30px] p-6 text-center shadow-xs select-none hover:bg-[#F4F1FF]/50 transition-colors duration-200">
              <span className="inline-block p-3.5 rounded-2xl bg-[#F0EDFF] text-[#5C36EC] mb-3">
                <Compass className="w-7 h-7" />
              </span>
              <p className="text-neutral-950 text-sm sm:text-base font-black leading-snug mb-1">
                아직 진행 중인 탐험 코스가 없어요 🎒
              </p>
              <p className="text-neutral-400 text-xs font-bold mb-4">
                마음에 드는 명소 루트를 선택하고 [실시간 내비게이션 시작하기]를 가볍게 탭해 보세요!
              </p>
              <button
                onClick={() => {
                  setLocation("/routes");
                  toast.success("명소들의 발자취가 담긴 추천 페이지로 향합니다!");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-[#5C36EC] hover:bg-[#4a27ce] px-5 py-3 rounded-2xl transition-all shadow-sm active:scale-97 cursor-pointer border-0"
              >
                추천 코스 둘러보기
              </button>
            </div>
          )}
        </div>

        {/* Section: Curated Weekly Curation Slides (이주의 루트) */}
        <div className="w-full mb-8">
          <div className="flex items-end justify-between mb-4 select-none">
            <div className="flex flex-col text-left">
              <h3 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">이주의 추천 코스 🏆</h3>
              <p className="text-xs text-gray-400 font-bold">에디터가 엄선해 다녀온 주간 누적 최고 평점 루트</p>
            </div>
            <Link href="/routes" className="text-xs font-black text-[#5C36EC] bg-[#F0EDFF] hover:bg-[#E5E1FF] px-3.5 py-1.5 rounded-xl transition-colors shrink-0 flex items-center gap-0.5">
              <span>더보기</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Swipe / Scroll Card Ribbon (cueing of 1.4 items) */}
          <div className="flex gap-4.5 overflow-x-auto pb-4 px-0.5 scrollbar-none snap-x snap-mandatory">
            {curatedWeekRoutes.map((cur) => (
              <div 
                key={cur.id}
                onClick={() => {
                  toast.success(`'${cur.title}' 코스를 로드했습니다!`);
                  setLocation(`/routes?search=${encodeURIComponent(cur.tag)}`);
                }}
                className="snap-start shrink-0 w-[275px] sm:w-[310px] bg-white border border-[#ECEAF5] rounded-[28px] overflow-hidden shadow-2xs hover:shadow-sm hover:border-[#5C36EC] transition-all cursor-pointer flex flex-col p-4"
              >
                <div className="relative h-40 rounded-2xl overflow-hidden mb-3 bg-neutral-100 shrink-0">
                  <img
                    referrerPolicy="no-referrer"
                    src={cur.image}
                    alt={cur.title}
                    className="w-full h-full object-cover rounded-2xl transform hover:scale-103 transition-transform duration-300"
                  />
                  <span className="absolute top-2.5 left-2.5 text-[9px] font-black px-2.5 py-1 rounded bg-black/65 text-white backdrop-blur-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                    {cur.badge}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2.5 shrink-0 min-w-0">
                  <img
                    referrerPolicy="no-referrer"
                    src={cur.authorImage}
                    alt={cur.authorName}
                    className="w-6 h-6 rounded-full object-cover border border-[#E9E4FF] shrink-0"
                  />
                  <span className="text-xs text-[#5C36EC] font-black truncate max-w-[80px] whitespace-nowrap shrink-0 font-semibold">@{cur.authorName}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ml-auto ${cur.tagColor} shrink-0`}>
                    {cur.tag}
                  </span>
                </div>

                <h4 className="text-sm sm:text-base font-black text-gray-900 mb-1 leading-snug line-clamp-1 text-left">
                  {cur.title}
                </h4>
                <p className="text-xs text-gray-400 mb-3.5 line-clamp-2 leading-relaxed text-left h-[36px]">
                  {cur.description}
                </p>

                {/* Hashtags */}
                <div className="flex flex-wrap gap-1 mb-3.5 select-none overflow-hidden h-[18px]">
                  {getRouteHashtags({ title: cur.title, description: cur.description }).slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/routes?search=${encodeURIComponent(tag)}`);
                        toast.info(`📍 '${tag}' 무드 검색을 수행합니다.`);
                      }}
                      className="text-[9px] font-black text-[#5C36EC] bg-[#F0EDFF] hover:bg-[#E5E1FF] px-1.5 py-0.5 rounded transition-colors cursor-pointer shrink-0"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer specs */}
                <div className="border-t border-neutral-100 pt-3.5 mt-auto flex items-center justify-between text-[11px] font-bold text-gray-400 shrink-0 select-none">
                  <span className="flex items-center gap-1 text-gray-800 font-extrabold">
                    <Footprints className="w-3.5 h-3.5 text-[#5C36EC]" /> 
                    {cur.time.replace("도보 ", "")}
                  </span>
                  <span>•</span>
                  <span>{cur.stops}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-rose-500 font-extrabold">
                    <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> 
                    {cur.hearts}
                  </span>
                </div>
              </div>
            ))}

            {/* Compact Call-to-action Card */}
            <div 
              onClick={() => {
                setLocation("/routes");
                toast.success("전체 다이내믹 루트 페이지로 이동합니다! 🚀");
              }}
              className="snap-start shrink-0 w-[140px] bg-[#FAF8FF] border border-dashed border-[#5C36EC]/30 rounded-[28px] hover:bg-[#F2EDFF]/70 cursor-pointer flex flex-col items-center justify-center p-4 transition-all select-none"
            >
              <div className="w-10 h-10 rounded-full bg-[#5C36EC] text-white flex items-center justify-center mb-2 shadow-sm shrink-0">
                <ChevronRight className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-gray-900 font-sans">전체 더보기</span>
              <span className="text-[10px] text-[#5C36EC] font-bold mt-1 font-sans">112개 코스 발견</span>
            </div>
          </div>
        </div>

        {/* Section: Create Route CTA Banner */}
        <Link href="/create-route" className="w-full mb-8 block">
          <div className="w-full bg-[#F6F4FF] border-2 border-dashed border-[#5C36EC]/40 rounded-[28px] p-5 flex items-center justify-between hover:bg-[#EFEBFF] cursor-pointer group transition-all duration-300">
            <div className="flex flex-col pr-4 text-left">
              <span className="text-[#5C36EC] text-[10px] font-black tracking-widest uppercase mb-1 flex items-center gap-1.5 font-sans">
                ✨ 크리에이터 메이트 도전
              </span>
              <p className="text-gray-950 text-sm font-black leading-snug">
                직접 밟은 아기자기한 팝업・주변 골목길을 엮어<br />
                <span className="text-[#5C36EC] font-extrabold">나만의 시그니처 코스</span>를 발행해 볼까요?
              </p>
            </div>
            <div className="bg-[#5C36EC] text-white p-3 rounded-2xl group-hover:scale-105 duration-300 transition-transform shrink-0 shadow-sm">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Section: Recommended Routes (추천 루트) - Overhauled as Beautiful Horizontal Swipe Carousel */}
        <div className="w-full mb-8">
          <div className="flex items-end justify-between mb-4 select-none">
            <div className="flex flex-col text-left">
              <h3 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">오늘의 인기 핫픽 🗺️</h3>
              <p className="text-xs text-gray-400 font-bold">인생샷 성지부터 산책로까지 어우러지는 기분전환 코스</p>
            </div>
            <Link href="/routes" className="text-xs font-black text-[#5C36EC] bg-[#F0EDFF] hover:bg-[#E5E1FF] px-3.5 py-1.5 rounded-xl transition-colors shrink-0 flex items-center gap-0.5">
              <span>전체보기</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex gap-4.5 overflow-x-auto pb-4 px-0.5 scrollbar-none snap-x snap-mandatory">
            {recommendedCuratedRoutes.map((rec) => (
              <div 
                key={rec.id}
                onClick={() => {
                  toast.success(`'${rec.title}' 루트 가이드로 이동합니다.`);
                  setLocation(`/routes?search=${encodeURIComponent(rec.title)}`);
                }}
                className="snap-start shrink-0 w-[270px] sm:w-[300px] bg-white border border-[#ECEAF5] rounded-[28px] overflow-hidden shadow-2xs hover:shadow-sm hover:border-[#5C36EC] transition-all cursor-pointer flex flex-col p-4"
              >
                <div className="relative h-36 rounded-xl overflow-hidden mb-3 bg-neutral-150 shrink-0">
                  <img
                    referrerPolicy="no-referrer"
                    src={rec.image}
                    alt={rec.title}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <span className="absolute top-2.5 left-2.5 text-[9px] font-black px-2.5 py-1 rounded bg-black/60 text-white backdrop-blur-xs">
                    {rec.region}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2 shrink-0 min-w-0">
                  <img
                    referrerPolicy="no-referrer"
                    src={rec.authorImage}
                    alt={rec.authorName}
                    className="w-5.5 h-5.5 rounded-full object-cover border border-[#E9E4FF] shrink-0"
                  />
                  <span className="text-xs text-[#5C36EC] font-black truncate max-w-[70px] whitespace-nowrap shrink-0 font-semibold">@{rec.authorName}</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ml-auto text-indigo-700 bg-indigo-50 shrink-0`}>
                    {rec.tag}
                  </span>
                </div>

                <h4 className="text-sm font-black text-gray-950 mb-1 leading-snug line-clamp-1 text-left">
                  {rec.title}
                </h4>
                <p className="text-xs text-gray-400 mb-3.5 line-clamp-1 leading-relaxed text-left">
                  {rec.description}
                </p>

                {/* Hashtags */}
                <div className="flex flex-wrap gap-1 mb-3.5 select-none overflow-hidden h-[18px]">
                  {getRouteHashtags({ title: rec.title, description: rec.description }).slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/routes?search=${encodeURIComponent(tag)}`);
                        toast.info(`📍 '${tag}' 검색을 적용합니다.`);
                      }}
                      className="text-[9px] font-black text-[#5C36EC] bg-[#F0EDFF] hover:bg-[#E5E1FF] px-1.5 py-0.5 rounded transition-colors cursor-pointer shrink-0"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Core specs footer */}
                <div className="border-t border-neutral-100 pt-3.5 mt-auto flex items-center justify-between text-[11px] font-bold text-gray-400 shrink-0 select-none">
                  <span className="flex items-center gap-1 text-gray-800 font-extrabold">
                    <Footprints className="w-3.5 h-3.5 text-[#5C36EC]" /> 
                    {rec.time.replace("도보 ", "")}
                  </span>
                  <span>•</span>
                  <span>{rec.stops}</span>
                  <span>•</span>
                  <div className="flex items-center gap-2 text-neutral-400 font-semibold select-none">
                    <span className="flex items-center gap-1 text-rose-500 font-extrabold">
                      <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> 
                      {rec.hearts}
                    </span>
                    <span className="flex items-center gap-1 text-sky-500 font-extrabold">
                      <Bookmark className="w-3 h-3 text-sky-500 fill-sky-500" /> 
                      {rec.bookmarks}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Regional Hotspots Carousel list */}
        <div className="w-full mb-8">
          <div className="flex items-end justify-between mb-4 select-none">
            <div className="flex flex-col text-left">
              <h3 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">지역별 감성 아지트 🗺️</h3>
              <p className="text-xs text-gray-400 font-bold">서울, 경기, 인천 도심 주말 나들이 명코스 가이드</p>
            </div>
            <Link href="/routes" className="text-xs font-black text-[#5C36EC] bg-[#F0EDFF] hover:bg-[#E5E1FF] px-3.5 py-1.5 rounded-xl transition-colors shrink-0 flex items-center gap-0.5 animate-pulse">
              <span>목록보기</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex gap-4 scrollbar-none overflow-x-auto pb-4 snap-x snap-mandatory">
            {regionalSpots.map((spot, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setLocation(`/routes?region=${spot.name}`);
                  toast.success(`📍 '${spot.name}' 지역 기반 코스들을 탐색합니다.`);
                }}
                className="snap-start shrink-0 w-[245px] h-[180px] rounded-[24px] overflow-hidden relative shadow-2xs hover:shadow-sm hover:scale-[1.01] transition-all cursor-pointer group"
              >
                {/* Background image & gradient overlay */}
                <div className="absolute inset-0 bg-neutral-250">
                  <img
                    referrerPolicy="no-referrer"
                    src={spot.image}
                    alt={spot.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 duration-500 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none" />
                </div>

                {/* Float Elements inside Card */}
                <div className="absolute inset-0 p-4.5 flex flex-col justify-between items-start text-white select-none z-10 text-left">
                  <span className="bg-[#5C36EC] text-[9px] font-black px-2 py-1 rounded-[8px] uppercase tracking-wider shadow-xs font-sans">
                    {spot.badge}
                  </span>

                  <div className="w-full mt-auto">
                    <h4 className="text-lg font-black text-white flex items-center gap-1 mb-0.5 leading-none">
                      {spot.name}
                      <ChevronRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform" />
                    </h4>
                    <p className="text-[11px] text-gray-200 font-bold mb-1 truncate">
                      {spot.subtext}
                    </p>
                    <p className="text-[9px] text-gray-300 font-medium line-clamp-1 leading-snug">
                      {spot.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Real User Community Routes Showcase */}
        {routes.length > 0 && (
          <div className="w-full mb-4">
            <div className="flex items-center justify-between mb-4 select-none">
              <div className="flex flex-col text-left">
                <h3 className="text-lg sm:text-xl font-black text-gray-950">공유된 실시간 발자취 ⚡</h3>
                <p className="text-xs text-gray-400 font-bold">인기 메이트 회원들이 방금 정교하게 만들어 올린 루트</p>
              </div>
              <Link href="/routes" className="text-xs font-black text-gray-400 hover:text-[#5C36EC] flex items-center">
                <span>전체보기 &gt;</span>
              </Link>
            </div>

            <div 
              ref={recommendedScrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory px-0.5"
            >
              {routes.slice(0, 6).map((route: any) => {
                const firstPlace = route.places?.[0];
                const meta = firstPlace ? getPlaceMeta(firstPlace.name) : { 
                  image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773", 
                  tag: "힐링", 
                  tagColor: "bg-indigo-50 text-indigo-700" 
                };

                return (
                  <Link key={route.id} href={`/route/${route.id}`} className="snap-start shrink-0 w-[165px] block group text-left">
                    <div className="relative w-[165px] h-[115px] rounded-2xl overflow-hidden bg-gray-200 mb-2 shadow-2xs">
                      <img
                        referrerPolicy="no-referrer"
                        src={meta.image}
                        alt={route.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      />
                      <span className="absolute bottom-2 right-2 text-[9px] font-black px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                        {route.places?.length || 0}곳 경유
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-[#5C36EC] font-black truncate whitespace-nowrap shrink-0 font-semibold">@{route.authorName || "User"}</span>
                      <h4 className="text-xs sm:text-sm font-black text-gray-850 truncate group-hover:text-[#5C36EC] leading-tight mt-0.5">
                        {route.title}
                      </h4>
                      {/* Hashtags display */}
                      <div className="flex flex-wrap gap-0.5 mt-1 select-none overflow-hidden h-[18px]">
                        {getRouteHashtags(route).slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setLocation(`/routes?search=${encodeURIComponent(tag)}`);
                              toast.info(`📍 '${tag}' 카테고리 검색을 수행합니다.`);
                            }}
                            className="text-[8px] font-black text-[#5C36EC] bg-[#F0EDFF] hover:bg-[#E5E1FF] px-1 rounded transition-colors cursor-pointer shrink-0"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* AD Monetization Hub Setup Modal */}
      <Dialog open={isAdSettingsOpen} onOpenChange={setIsAdSettingsOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6 border border-[#EBE8F3] shadow-xl overflow-y-auto max-h-[85vh] scrollbar-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              수익성 제휴 광고 & 애드센스 설정실
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 leading-snug">
              아직 구글 광고를 받기 전이라도, <b>쿠팡파트너스</b>나 <b>크룩 제휴링크</b>를 통해 실질적인 매출 수수료(CPA)를 Earn할 수 있습니다! 직접 연동해보세요.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 mt-4">
            
            <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                방법 ①: 나만의 제휴 제안 링크 (쿠팡/크룩 등)
              </span>
              <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                사용자가 광고 배너를 클릭했을 때 이동할 <b>실제 단축 제휴 코드</b>를 입력하세요. 미입력 시 에버랜드 검색 화면으로 연결됩니다.
              </p>
              <input
                type="text"
                placeholder="https://link.coupang.com/a/..."
                value={tempCoupangLink}
                onChange={(e) => setTempCoupangLink(e.target.value)}
                className="w-full text-xs p-3 border rounded-xl border-gray-200 outline-none focus:border-amber-400 bg-white"
              />
            </div>

            <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-purple-50/40 border border-purple-100">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                <Settings className="w-3.5 h-3.5 text-indigo-600" />
                방법 ②: 구글 애드센스 / HTML 광고 태그 소스
              </span>
              <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                구글 애드센스 승인 후 발급받은 광고 스크립트 코드나 이미지 배너 HTML을 여기에 붙여넣으세요. 입력하는 즉시 광고 영역에 실시간 렌더링됩니다!
              </p>
              <textarea
                placeholder="예: iframe 이나 Google AdSense 스크립값 소스 코드 입력"
                rows={4}
                value={tempAdsenseHtml}
                onChange={(e) => setTempAdsenseHtml(e.target.value)}
                className="w-full text-xs font-mono p-3 border rounded-xl border-gray-200 outline-none focus:border-indigo-400 bg-white"
              />
            </div>

            <div className="text-[11px] text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-150 flex items-start gap-2 leading-relaxed">
              <span className="font-extrabold text-[#111827]">수익화 꿀팁:</span>
              <p className="mt-0.5">
                에버랜드, 아르떼뮤지엄 등 핫플레이스 위주로 구성되어 있으므로, <b>크룩(Klook) 파트너스</b>나 <b>와그(WAUG) 파트너스</b>에 가입하여 제휴 혜택 링크를 배치하면 매우 높은 CPA 성과를 올릴 수 있습니다.
              </p>
            </div>

            <div className="flex gap-2 border-t pt-4">
              <Button
                variant="outline"
                className="flex-1 text-xs py-5 rounded-xl border-gray-200 font-bold"
                onClick={() => setIsAdSettingsOpen(false)}
              >
                취소
              </Button>
              <Button
                className="flex-1 text-xs py-5 rounded-xl bg-[#5C36EC] hover:bg-[#4a27ce] text-white font-bold"
                onClick={() => {
                  localStorage.setItem("coupang_partners_link", tempCoupangLink);
                  localStorage.setItem("adsense_active_html", tempAdsenseHtml);
                  setCoupangLink(tempCoupangLink);
                  setAdsenseHtml(tempAdsenseHtml);
                  setIsAdSettingsOpen(false);
                  toast.success("💰 수익화 파트너스 광고 설정이 실시간 적용되었습니다!");
                }}
              >
                저장 적용하기
              </Button>
            </div>

          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export const PLACE_METADATA: Record<string, {
  image: string;
  tag: string;
  location: string;
  rating: number;
  tagColor: string;
}> = {
  "빛의 시어터": {
    image: "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=600&auto=format&fit=crop&q=80",
    tag: "전시",
    tagColor: "bg-purple-50 text-[#8B5CF6] border-purple-100",
    location: "서울 광진구",
    rating: 4.8
  },
  "아르떼뮤지엄": {
    image: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=600&auto=format&fit=crop&q=80",
    tag: "전시",
    tagColor: "bg-purple-50 text-[#8B5CF6] border-purple-100",
    location: "서울 종로구",
    rating: 4.7
  },
  "그라운드시소": {
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
    tag: "전시",
    tagColor: "bg-purple-50 text-[#8B5CF6] border-purple-100",
    location: "서울 마포구",
    rating: 4.6
  },
  "DDP 디자인전": {
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    tag: "전시",
    tagColor: "bg-purple-50 text-[#8B5CF6] border-purple-100",
    location: "서울 중구",
    rating: 4.5
  },
  "에버랜드": {
    image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&auto=format&fit=crop&q=80",
    tag: "체험",
    tagColor: "bg-emerald-50 text-[#10B981] border-emerald-100",
    location: "경기 용인시",
    rating: 4.7
  },
  "한국민속촌": {
    image: "https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=600&auto=format&fit=crop&q=80",
    tag: "전시",
    tagColor: "bg-purple-50 text-[#8B5CF6] border-purple-100",
    location: "경기 용인시",
    rating: 4.6
  },
  "가평 레일바이크": {
    image: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&auto=format&fit=crop&q=80",
    tag: "액티비티",
    tagColor: "bg-green-50 text-[#059669] border-green-100",
    location: "경기 가평군",
    rating: 4.5
  },
  "수원 스타필드": {
    image: "https://images.unsplash.com/photo-1481437156560-3205fa6a55f2?w=600&auto=format&fit=crop&q=80",
    tag: "체험",
    tagColor: "bg-emerald-50 text-[#10B981] border-emerald-100",
    location: "경기 수원시",
    rating: 4.6
  },
  "송도 트라이볼": {
    image: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=600&auto=format&fit=crop&q=80",
    tag: "전시",
    tagColor: "bg-purple-50 text-[#8B5CF6] border-purple-100",
    location: "인천 연수구",
    rating: 4.7
  },
  "인천 대공원": {
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format&fit=crop&q=80",
    tag: "체험",
    tagColor: "bg-emerald-50 text-[#10B981] border-emerald-100",
    location: "인천 남동구",
    rating: 4.6
  },
  "아트플랫폼": {
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80",
    tag: "전시",
    tagColor: "bg-purple-50 text-[#8B5CF6] border-purple-100",
    location: "인천 중구",
    rating: 4.5
  },
  "월미도 놀이기구": {
    image: "https://images.unsplash.com/photo-1472898965229-f9b06b9c9bbe?w=600&auto=format&fit=crop&q=80",
    tag: "액티비티",
    tagColor: "bg-pink-50 text-[#EC4899] border-pink-100",
    location: "인천 중구",
    rating: 4.7
  },
  "성수동 어니언 Cafe": {
    image: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=600&auto=format&fit=crop&q=80",
    tag: "카페",
    tagColor: "bg-amber-50 text-amber-600 border-amber-100",
    location: "서울 성동구",
    rating: 4.8
  },
  "성수 연무장 아트룸": {
    image: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=600&auto=format&fit=crop&q=80",
    tag: "팝업스토어",
    tagColor: "bg-blue-50 text-blue-600 border-blue-100",
    location: "서울 성동구",
    rating: 4.6
  },
  "홍대 버스킹 젊음의 광장": {
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    tag: "핫플",
    tagColor: "bg-indigo-50 text-indigo-600 border-indigo-100",
    location: "서울 마포구",
    rating: 4.7
  },
  "홍대 T1 베이스캠프 Cafe": {
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80",
    tag: "카페",
    tagColor: "bg-amber-50 text-amber-600 border-amber-100",
    location: "서울 마포구",
    rating: 4.8
  },
  "이태원 비정상 다이닝 키친": {
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&auto=format&fit=crop&q=80",
    tag: "맛집",
    tagColor: "bg-red-50 text-red-600 border-red-100",
    location: "서울 용산구",
    rating: 4.6
  },
  "이태원 경리단 안길 산책로": {
    image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=600&auto=format&fit=crop&q=80",
    tag: "핫플",
    tagColor: "bg-indigo-50 text-indigo-600 border-indigo-100",
    location: "서울 용산구",
    rating: 4.5
  },
  "잠실 석촌호수 둘레길": {
    image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&auto=format&fit=crop&q=80",
    tag: "핫플",
    tagColor: "bg-indigo-50 text-indigo-600 border-indigo-100",
    location: "서울 송파구",
    rating: 4.8
  },
  "잠실 롯데월드 어드벤처": {
    image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&auto=format&fit=crop&q=80",
    tag: "액티비티",
    tagColor: "bg-pink-50 text-pink-600 border-pink-100",
    location: "서울 송파구",
    rating: 4.9
  },
};

export function getPlaceMeta(name: string) {
  // Find clean match
  for (const key of Object.keys(PLACE_METADATA)) {
    if (name.includes(key) || key.includes(name)) {
      return PLACE_METADATA[key];
    }
  }
  // Safe Fallback
  return {
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop&q=80",
    tag: "핫플",
    tagColor: "bg-blue-50 text-blue-600 border-blue-150",
    location: "대한민국",
    rating: 4.5
  };
}

export function getRouteHashtags(route: { title?: string | null; description?: string | null; places?: any[] }) {
  const hashtags = new Set<string>();

  // 1. Check title/description text for key regions (now restricted to Seoul focus)
  const hotRegions = ["성수", "잠실", "홍대", "이태원", "강남", "서울"];
  const combinedText = ((route.title || "") + " " + (route.description || "")).toLowerCase();
  
  hotRegions.forEach(region => {
    if (combinedText.includes(region)) {
      if (region === "강남") {
        hashtags.add("서울");
      } else {
        hashtags.add(region);
      }
    }
  });

  // If text contains any Gyeonggi/Incheon terms, map them to Seoul dynamically
  const gyeonggiIncheonTerms = ["용인", "수원", "가평", "인천", "송도", "경기"];
  gyeonggiIncheonTerms.forEach(term => {
    if (combinedText.includes(term)) {
      hashtags.add("서울");
    }
  });

  // 2. Scan every place in details
  if (route.places && Array.isArray(route.places)) {
    route.places.forEach((p: any) => {
      const pCombined = ((p.name || "") + " " + (p.address || "")).toLowerCase();
      hotRegions.forEach(region => {
        if (pCombined.includes(region)) {
          if (region === "강남") {
            hashtags.add("서울");
          } else {
            hashtags.add(region);
          }
        }
      });
      gyeonggiIncheonTerms.forEach(term => {
        if (pCombined.includes(term)) {
          hashtags.add("서울");
        }
      });

      // Categories
      if (p.category) {
        if (p.category === 'restaurant') hashtags.add("맛집");
        if (p.category === 'cafe') hashtags.add("카페");
        if (p.category === 'hotplace') hashtags.add("핫플");
        if (p.category === 'boardgame') hashtags.add("보드게임");
        if (p.category === 'escape') hashtags.add("방탈출");
        if (p.category === 'popup') hashtags.add("팝업스토어");
      }

      // Metadata tag fallback
      const meta = getPlaceMeta(p.name);
      if (meta && meta.tag) {
        if (gyeonggiIncheonTerms.includes(meta.tag)) {
          hashtags.add("서울");
        } else {
          hashtags.add(meta.tag);
        }
      }
    });
  }

  // Ensure some default hashtags
  if (hashtags.size === 0) {
    hashtags.add("서울");
    hashtags.add("힐링");
    hashtags.add("데이트");
    hashtags.add("인기코스");
  }

  // Exclude Gyeonggi and Incheon words from being explicitly added
  gyeonggiIncheonTerms.forEach(term => {
    hashtags.delete(term);
  });

  // Ensure "서울" is present
  if (!hashtags.has("서울")) {
    hashtags.add("서울");
  }

  return Array.from(hashtags).map(tag => `#${tag}`);
}
