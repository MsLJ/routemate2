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
    <div className="min-h-screen bg-[#F3F4F6] text-[#111827] flex flex-col items-center py-0 sm:py-6 px-0 sm:px-4 md:px-8 font-sans">
      
      {/* Centered Device Container simulating an elegant iPhone/Mobile screen */}
      <div className="w-full max-w-[640px] bg-white rounded-none sm:rounded-[36px] border-0 sm:border border-[#EBE8F3] shadow-none sm:shadow-2xl overflow-hidden flex flex-col p-4 sm:p-6 min-h-screen sm:min-h-[920px] pb-32">
        
        {/* Top Header - Pure Brand Craft */}
        <div className="flex items-center justify-between mb-5 select-none pb-2">
          <Link href="/" className="flex items-center shrink-0">
            <span className="text-2xl font-black tracking-tighter text-[#5C36EC] hover:opacity-90 duration-150">
              RUTEMATE
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <NotificationBell />
            {isAuthenticated ? (
              <Link href="/my" className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#5C36EC] shadow-sm hover:scale-105 active:scale-95 duration-150 transition-all cursor-pointer">
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
                className="flex items-center gap-1.5 text-xs font-black text-[#5C36EC] bg-[#F0EDFF] hover:bg-[#E5E1FF] px-4.5 py-2.5 rounded-full transition-all"
                id="login-btn"
              >
                <LogIn className="w-3.5 h-3.5" />
                로그인
              </a>
            )}
          </div>
        </div>

        {/* Brand Headline Phrase */}
        <div className="mb-5 select-none">
          <h2 className="text-[20px] sm:text-[22px] font-black tracking-tight leading-snug text-[#111827]">
            어디로 떠나볼까요?<br/>
            <span className="text-[#5C36EC] font-extrabold">낭만 가득한 맞춤 루트 추천</span> ✨
          </h2>
        </div>

        {/* Dynamic Search Bar & Quick Filter button */}
        <form onSubmit={handleSearchSubmit} className="relative w-full mb-6">
          <div className="flex items-center bg-white rounded-2xl border border-[#DCD7EC] focus-within:border-[#5C36EC] focus-within:ring-2 focus-within:ring-[#5C36EC]/10 shadow-sm hover:shadow-md transition-all pr-2.5 pl-4 py-1">
            <Search className="w-5 h-5 text-[#9CA3AF] shrink-0" />
            <input
              type="text"
              className="flex-1 bg-transparent text-sm py-3 px-3 outline-none text-gray-800 placeholder-[#9CA3AF] font-bold"
              placeholder="코스 이름 혹은 역 주변 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="h-6 w-[1px] bg-neutral-200 mx-2 shrink-0" />
            <button
              type="button"
              onClick={() => setLocation("/routes")}
              className="flex items-center gap-1 text-xs font-black text-[#5C36EC] bg-[#F0EDFF] hover:bg-[#E5E1FF] transition-all px-3.5 py-2 rounded-xl shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              필터
            </button>
          </div>
        </form>

        {/* Monetized Sponsor & Affiliate Banner */}
        {adsenseHtml ? (
          <div className="w-full bg-white border border-[#DECEFF] rounded-2xl p-2 mb-6 relative overflow-hidden shadow-sm">
            <div className="absolute top-2 right-2 z-20">
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAdSettingsOpen(true); }}
                className="p-1 rounded bg-black/40 text-white hover:bg-black/60 transition-all"
              >
                <Settings className="w-3 h-3" />
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
            className="w-full bg-gradient-to-r from-indigo-50 to-[#FAF8FF] border border-[#DECEFF] rounded-2xl p-4 mb-6 flex items-center justify-between relative overflow-hidden cursor-pointer group shadow-sm hover:shadow-md duration-200"
          >
            <div className="flex flex-col pr-6">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="bg-[#5C36EC] text-white text-[9px] font-black px-1.5 py-0.5 rounded">AFFILIATE</span>
                <span className="text-[11px] font-extrabold text-[#5C36EC] flex items-center gap-1">맞춤 파트너스 특가 연동 <ExternalLink className="w-2.5 h-2.5" /></span>
              </div>
              <p className="text-gray-900 text-xs font-black leading-snug">
                에버랜드 & 아르떼뮤지엄 할인 티켓<br/>
                <span className="text-[#5C36EC] font-bold">최대 40% 한정 제휴 정산 할인 진행 중</span>
              </p>
            </div>
            <Gift className="w-8 h-8 text-[#5C36EC] shrink-0" />
          </div>
        )}

        {/* Compact Main Seoul Toggle Card */}
        <div
            onClick={() => {
              setShowSeoulSubCategories(prev => !prev);
              toast.info(showSeoulSubCategories ? "📌 서울 세부 카테고리를 숨겼습니다." : "📌 서울 세부 카테고리를 열었습니다.");
            }}
            className="flex items-center justify-between p-3 bg-[#F4F1FF] hover:bg-[#EBE7FF] border border-[#E1D9FF] rounded-2xl cursor-pointer select-none transition-all duration-205 shadow-2xs mb-3 group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#5C36EC] flex items-center justify-center shadow-xs">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-gray-900 leading-none">서울 전체보기</span>
                <span className="text-[10px] text-gray-400 mt-1.5 font-semibold leading-none">성수・홍대・이태원・잠실 일대 핫플레이스</span>
              </div>
            </div>
            <div className="text-[10px] font-bold text-gray-400 group-hover:text-[#5C36EC] flex items-center gap-0.5">
              {showSeoulSubCategories ? "접기 ▲" : "자세히 보기 ▼"}
            </div>
          </div>
 
          {/* Beautiful 2x2 Checkerboard Grid representing sub-regions (성수, 홍대, 이태원, 잠실) */}
          {showSeoulSubCategories && (
            <div className="grid grid-cols-2 gap-3 select-none transition-all duration-300">
              {/* Seongsu */}
              <div
                onClick={() => handleCategoryClick("성수")}
                className="flex items-center gap-3 p-3 bg-white border border-[#EBE8F3] hover:border-[#5C36EC] rounded-2xl cursor-pointer shadow-2xs hover:shadow-sm hover:translate-y-[-1px] transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-[#8B5CF6] border border-violet-100 flex items-center justify-center group-hover:bg-violet-100 transition-colors shrink-0">
                  <Palette className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black text-gray-900 group-hover:text-[#5C36EC] leading-none">성수</span>
                  <span className="text-[9px] text-gray-400 mt-1.5 font-medium leading-tight">힙스터 팝업・카페</span>
                </div>
              </div>
 
              {/* Hongdae */}
              <div
                onClick={() => handleCategoryClick("홍대")}
                className="flex items-center gap-3 p-3 bg-white border border-[#EBE8F3] hover:border-[#5C36EC] rounded-2xl cursor-pointer shadow-2xs hover:shadow-sm hover:translate-y-[-1px] transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#10B981] border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors shrink-0">
                  <Music className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black text-gray-900 group-hover:text-[#10B981] leading-none">홍대</span>
                  <span className="text-[9px] text-gray-400 mt-1.5 font-medium leading-tight">인디 버스킹・핫쇼핑</span>
                </div>
              </div>
 
              {/* Itaewon */}
              <div
                onClick={() => handleCategoryClick("이태원")}
                className="flex items-center gap-3 p-3 bg-white border border-[#EBE8F3] hover:border-[#5C36EC] rounded-2xl cursor-pointer shadow-2xs hover:shadow-sm hover:translate-y-[-1px] transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#F43F5E] border border-pink-100 flex items-center justify-center group-hover:bg-pink-100 transition-colors shrink-0">
                  <Globe className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black text-gray-900 group-hover:text-[#E11D48] leading-none">이태원</span>
                  <span className="text-[9px] text-gray-400 mt-1.5 font-medium leading-tight">이색 글로벌 맛집</span>
                </div>
              </div>
 
              {/* Jamsil */}
              <div
                onClick={() => handleCategoryClick("잠실")}
                className="flex items-center gap-3 p-3 bg-white border border-[#EBE8F3] hover:border-[#5C36EC] rounded-2xl cursor-pointer shadow-2xs hover:shadow-sm hover:translate-y-[-1px] transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0284C7] border border-sky-100 flex items-center justify-center group-hover:bg-sky-100 transition-colors shrink-0">
                  <Compass className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black text-gray-900 group-hover:text-[#0284C7] leading-none">잠실</span>
                  <span className="text-[9px] text-gray-400 mt-1.5 font-medium leading-tight">석촌호수・놀이공원</span>
                </div>
              </div>
            </div>
          )}
 
        <div className="w-full mb-6">
          <div className="flex items-end justify-between mb-3 select-none">
            <div className="flex flex-col">
              <h3 className="text-base font-black text-gray-900 leading-tight">이주의 루트</h3>
              <p className="text-[10px] text-gray-400 font-bold">인기 메이트 연간 누적 최다 추천 명소</p>
            </div>
            <Link href="/routes" className="text-xs font-black text-[#5C36EC] hover:underline flex items-center shrink-0">
              더보기 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
 
          {/* Weekly route carousel list container */}
          <div className="flex gap-3.5 overflow-x-auto pb-1.5 scrollbar-none snap-x snap-mandatory">
            {curatedWeekRoutes.map((cur) => (
              <div 
                key={cur.id}
                onClick={() => {
                  toast.success(`'${cur.title}' 코스를 로드했습니다!`);
                  setLocation(`/routes?search=${encodeURIComponent(cur.tag)}`);
                }}
                className="snap-start shrink-0 w-[170px] sm:w-[185px] bg-white border border-[#EBE8F3] rounded-2xl overflow-hidden shadow-2xs hover:shadow-sm hover:border-[#5C36EC] transition-all cursor-pointer flex flex-col p-2.5"
              >
                <div className="relative h-20 rounded-xl overflow-hidden mb-2 bg-neutral-100 shrink-0">
                  <img
                    referrerPolicy="no-referrer"
                    src={cur.image}
                    alt={cur.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 left-1.5 text-[8px] font-black px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                    {cur.badge}
                  </span>
                </div>
 
                <div className="flex items-center gap-1 mb-1.5 shrink-0">
                  <img
                    referrerPolicy="no-referrer"
                    src={cur.authorImage}
                    alt={cur.authorName}
                    className="w-4.5 h-4.5 rounded-full object-cover border border-neutral-200 shrink-0"
                  />
                  <span className="text-[9px] text-[#5C36EC] font-bold truncate max-w-[60px]">@{cur.authorName}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ml-auto ${cur.tagColor} scale-90 origin-right`}>
                    {cur.tag}
                  </span>
                </div>
 
                <h4 className="text-[11px] font-black text-gray-900 mb-0.5 leading-tight line-clamp-1">
                  {cur.title}
                </h4>
                <p className="text-[9px] text-gray-400 mb-1.5 line-clamp-2 leading-snug h-[26px]">
                  {cur.description}
                </p>
 
                {/* Hashtags display */}
                <div className="flex flex-wrap gap-0.5 mb-2 select-none overflow-hidden h-[16px]">
                  {getRouteHashtags({ title: cur.title, description: cur.description }).slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/routes?search=${encodeURIComponent(tag)}`);
                        toast.info(`📍 '${tag}' 기분 검색을 수행합니다.`);
                      }}
                      className="text-[8px] font-black text-[#5C36EC] bg-[#F0EDFF] hover:bg-[#E5E1FF] px-1 rounded transition-colors cursor-pointer shrink-0"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
 
                {/* Statistics Footer */}
                <div className="border-t border-neutral-100 pt-2 mt-auto flex items-center justify-between text-[8px] font-bold text-gray-400 shrink-0 select-none">
                  <span className="flex items-center gap-0.5 text-gray-700 font-extrabold">
                    <Footprints className="w-3 h-3 text-[#5C36EC]" /> 
                    {cur.time.replace("도보 ", "")}
                  </span>
                  <span>|</span>
                  <span>{cur.stops.replace(" 경유지", " 루트")}</span>
                  <span>|</span>
                  <span className="flex items-center gap-0.5 text-rose-500">
                    <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" /> 
                    {cur.hearts}
                  </span>
                </div>
              </div>
            ))}
 
            {/* Elegant compact See More Card */}
            <div 
              onClick={() => {
                setLocation("/routes");
                toast.success("전체 루트 탐색 페이지로 이동합니다! 🚀");
              }}
              className="snap-start shrink-0 w-[110px] bg-[#FAF8FF] border border-dashed border-[#5C36EC]/30 rounded-2xl hover:bg-[#F2EDFF]/60 cursor-pointer flex flex-col items-center justify-center p-3 transition-all select-none"
            >
              <div className="w-8 h-8 rounded-full bg-[#5C36EC] text-white flex items-center justify-center mb-1.5 shadow-2xs">
                <ChevronRight className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black text-gray-900">더보기</span>
              <span className="text-[8px] text-[#5C36EC] font-bold mt-0.5">전체 루트 보기</span>
            </div>
          </div>
        </div>

        {/* Create route button styled like a brilliant promo banner */}
        <Link href="/create-route" className="w-full mb-6">
          <div className="w-full bg-[#FAF8FF] border-2 border-dashed border-[#5C36EC]/40 rounded-3xl p-4 flex items-center justify-between hover:bg-[#F2EDFF]/60 cursor-pointer group transition-all duration-200">
            <div className="flex flex-col pr-4">
              <span className="text-[#5C36EC] text-[10px] font-black tracking-widest uppercase mb-0.5 flex items-center gap-1">
                ✨ 나만의 여행 메이트 루트
              </span>
              <p className="text-slate-800 text-[12px] font-black leading-snug">
                나만의 독창적인 여행 패키지 코스를 생성해 다른 러버들과 영감을 나눌 수도 있습니다.
              </p>
            </div>
            <div className="bg-[#5C36EC] text-white p-2 ml-2 rounded-2xl group-hover:scale-105 duration-200 transition-transform shrink-0">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        {/* Recommended Routes Section - Handcrafted with absolute high fidelity */}
        <div className="w-full mb-6">
          <div className="flex items-end justify-between mb-3.5 select-none">
            <div className="flex flex-col">
              <h3 className="text-base font-black text-gray-900 leading-tight">추천 루트</h3>
              <p className="text-[10px] text-gray-400 font-bold">메이트들이 즐겨 찾는 실시간 코스</p>
            </div>
            <Link href="/routes" className="text-xs font-black text-[#5C36EC] hover:underline flex items-center shrink-0">
              더보기 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Premium Vertical Cards representing exact picture templates */}
          <div className="flex flex-col gap-3.5 mb-6">
            {recommendedCuratedRoutes.map((rec) => (
              <div 
                key={rec.id}
                onClick={() => {
                  toast.success(`'${rec.title}' 루트 정보 페이지로 이동합니다.`);
                  setLocation(`/routes?search=${encodeURIComponent(rec.title)}`);
                }}
                className="w-full bg-white border border-[#EBE8F3] hover:border-[#5C36EC] hover:shadow-md transition-all rounded-[24px] p-3 flex gap-3 cursor-pointer"
              >
                {/* Left Thumbnail with region banner */}
                <div className="relative w-24 h-24 sm:w-[104px] sm:h-[104px] rounded-2xl overflow-hidden bg-neutral-100 shrink-0">
                  <img
                    referrerPolicy="no-referrer"
                    src={rec.image}
                    alt={rec.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 left-1.5 text-[8.5px] font-black px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                    {rec.region}
                  </span>
                </div>

                {/* Right text layout details */}
                <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                  <div>
                    {/* Author, date and tag line */}
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold mb-1 shrink-0 select-none">
                      <img
                        referrerPolicy="no-referrer"
                        src={rec.authorImage}
                        alt={rec.authorName}
                        className="w-4 h-4 rounded-full object-cover shrink-0"
                      />
                      <span className="text-[#5C36EC]">@{rec.authorName}</span>
                      <span>•</span>
                      <span>{rec.dateLabel}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ml-auto ${rec.tagColor}`}>
                        {rec.tag}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-xs font-black text-gray-900 truncate leading-snug">
                      {rec.title}
                    </h4>

                    {/* Short text body description snippet */}
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 leading-normal">
                      {rec.description}
                    </p>
                  </div>

                  {/* Hashtags display */}
                  <div className="flex flex-wrap gap-1 my-1.5 select-none">
                    {getRouteHashtags({ title: rec.title, description: rec.description }).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/routes?search=${encodeURIComponent(tag)}`);
                          toast.info(`📍 '${tag}' 카테고리 기분 검색을 수행합니다.`);
                        }}
                        className="text-[8px] font-black text-[#5C36EC] bg-[#F0EDFF] hover:bg-[#E5E1FF] px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Micro list mapping of the route course places */}
                  <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-2 py-0.5 my-1 select-none">
                    <div className="flex items-center gap-1 text-[8.5px] font-black text-neutral-500 overflow-hidden truncate">
                      <MapPin className="w-2.5 h-2.5 text-[#5C36EC]/60 shrink-0" />
                      <span>명소 코스 가이드</span>
                    </div>
                  </div>

                  {/* Footer micro stats */}
                  <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 mt-1 pt-1.5 border-t border-neutral-50 shrink-0 select-none">
                    <span className="flex items-center gap-0.5 text-gray-700">
                      <Footprints className="w-3.5 h-3.5 text-[#5C36EC]" />
                      <span>{rec.time}</span>
                    </span>
                    <span>•</span>
                    <span>{rec.stops}</span>
                    <span>•</span>
                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="flex items-center gap-0.5 text-rose-500/90">
                        <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                        <span>{rec.hearts}</span>
                      </span>
                      <span className="flex items-center gap-0.5 text-sky-500">
                        <Bookmark className="w-3 h-3 text-sky-500 fill-sky-500" />
                        <span>{rec.bookmarks}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real User Routes Showcase - If present in database */}
        {routes.length > 0 && (
          <div className="w-full mb-4">
            <div className="flex items-center justify-between mb-3 select-none">
              <div className="flex flex-col">
                <h3 className="text-sm font-black text-[#1F2937]">실시간 커뮤니티 등록 목록</h3>
                <p className="text-[9px] text-[#9CA3AF] font-bold">인기 메이트 회원들이 발자취를 남긴 루트</p>
              </div>
              <Link href="/routes" className="text-xs font-black text-gray-400 hover:text-[#5C36EC]">
                전체보기 &gt;
              </Link>
            </div>

            <div 
              ref={recommendedScrollRef}
              className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
            >
              {routes.slice(0, 5).map((route: any) => {
                const firstPlace = route.places?.[0];
                const meta = firstPlace ? getPlaceMeta(firstPlace.name) : { 
                  image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773", 
                  tag: "힐링", 
                  tagColor: "bg-indigo-50 text-indigo-700" 
                };

                return (
                  <Link key={route.id} href={`/route/${route.id}`} className="snap-start shrink-0 w-[140px] block group">
                    <div className="relative w-[140px] h-[95px] rounded-2xl overflow-hidden bg-gray-200 mb-1.5 shadow-2xs">
                      <img
                        referrerPolicy="no-referrer"
                        src={meta.image}
                        alt={route.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1.5 right-1.5 text-[8.5px] font-black px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                        {route.places?.length || 0}곳 경유
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-[#5C36EC] font-black truncate">@{route.authorName || "User"}</span>
                      <h4 className="text-xs font-black text-gray-800 truncate group-hover:text-[#5C36EC] leading-snug">
                        {route.title}
                      </h4>
                      {/* Dynamic Hashtag mapping */}
                      <div className="flex flex-wrap gap-0.5 mt-0.5 select-none overflow-hidden h-[18px]">
                        {getRouteHashtags(route).slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            onClick={(e) => {
                              // We use Link here so click might trigger parent navigate. Let's redirect explicitly & preventDefault
                              e.preventDefault();
                              e.stopPropagation();
                              setLocation(`/routes?search=${encodeURIComponent(tag)}`);
                              toast.info(`📍 '${tag}' 카테고리 기분 검색을 수행합니다.`);
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
