import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Loader2, 
  Search, 
  ChevronRight, 
  Bookmark, 
  Star, 
  MapPin, 
  Sparkles, 
  LogIn, 
  Compass, 
  Calendar, 
  Award,
  Settings,
  Coins,
  ExternalLink,
  AlertCircle,
  Info,
  Check
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getPlaceMeta } from "@/lib/placeMetadata";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { NotificationBell } from "@/components/NotificationBell";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem("search_tab_query") || "";
  });
  const [savedPlaceIds, setSavedPlaceIds] = useState<number[]>([]);

  // Ad monetization settings states
  const [coupangLink, setCoupangLink] = useState("https://search.shopping.naver.com/search/all?query=에버랜드+자유이용권");
  const [adsenseHtml, setAdsenseHtml] = useState("");
  const [isAdSettingsOpen, setIsAdSettingsOpen] = useState(false);
  const [tempCoupangLink, setTempCoupangLink] = useState("");
  const [tempAdsenseHtml, setTempAdsenseHtml] = useState("");

  // Refs for custom scroll containers to enable smooth horizontal scrolling
  const seoulScrollRef = useRef<HTMLDivElement>(null);
  const gyeonggiScrollRef = useRef<HTMLDivElement>(null);
  const incheonScrollRef = useRef<HTMLDivElement>(null);

  // Load saved places on mount
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
      console.error("Failed to load saved places:", e);
    }
  }, []);

  // Fetch all places
  const { data: allPlaces = [], isLoading: placesLoading } = trpc.places.getAll.useQuery();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/routes?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      setLocation("/routes");
    }
  };

  const toggleBookmark = (placeId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let updated: number[];
    if (savedPlaceIds.includes(placeId)) {
      updated = savedPlaceIds.filter(id => id !== placeId);
    } else {
      updated = [...savedPlaceIds, placeId];
    }
    setSavedPlaceIds(updated);
    localStorage.setItem("saved_place_ids", JSON.stringify(updated));
  };

  const scrollRight = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <Loader2 className="animate-spin w-8 h-8 text-[#6366F1]" />
      </div>
    );
  }

  // Group places by regions
  const seoulPlaces = allPlaces.filter(p => {
    const combined = (p.address || "" + " " + p.name).toLowerCase();
    return combined.includes("서울") || combined.includes("광진구") || combined.includes("종로") || combined.includes("마포") || combined.includes("중구");
  });

  const gyeonggiPlaces = allPlaces.filter(p => {
    const combined = (p.address || "" + " " + p.name).toLowerCase();
    return combined.includes("경기") || combined.includes("용인") || combined.includes("가평") || combined.includes("수원");
  });

  const incheonPlaces = allPlaces.filter(p => {
    const combined = (p.address || "" + " " + p.name).toLowerCase();
    return combined.includes("인천") || combined.includes("송도") || combined.includes("월미도") || combined.includes("아트플랫폼");
  });

  // Safe fallback to default mock array if db query empty
  const hasSeededData = allPlaces.length > 0;

  return (
    <div className="min-h-screen bg-neutral-50 sm:bg-[#F3F4F6] text-[#111827] flex flex-col items-center py-0 sm:py-6 px-0 sm:px-4 md:px-8">
      {/* Outer frame styling like the mockup */}
      <div className="w-full max-w-[640px] bg-[#FAF8FF] rounded-none sm:rounded-3xl border-0 sm:border border-[#EBE8F3] shadow-none sm:shadow-xl overflow-hidden flex flex-col p-4 sm:p-6 min-h-screen sm:min-h-[920px]">
        
        {/* Top Mini Header / User Bar */}
        <div className="flex items-center justify-between mb-8 select-none">
          <Link href="/" className="flex items-center shrink-0 hover:opacity-80 transition-opacity">
            <span className="text-xl font-extrabold bg-gradient-to-r from-[#4A3AFF] to-[#7C3AED] bg-clip-text text-transparent whitespace-nowrap">
              우리 놀까?
            </span>
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-3 text-sm font-medium">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-[#4A3AFF] shrink-0 border border-indigo-200 shadow-2xs select-none">
                  {user?.name?.charAt(0) || "U"}
                </div>
              </>
            ) : (
              <a 
                href={getLoginUrl()} 
                className="flex items-center gap-1 text-[#4A3AFF] bg-indigo-50 border border-indigo-100 px-3 py-1.5 bg-opacity-70 rounded-full hover:bg-indigo-100 transition-colors whitespace-nowrap"
                id="login-btn"
              >
                <LogIn className="w-3.5 h-3.5" />
                로그인
              </a>
            )}
          </div>
        </div>

        {/* Main Title Section */}
        <div className="flex flex-col items-center justify-center text-center mt-2 mb-6">
          <h1 className="text-2xl xs:text-3xl sm:text-[34px] md:text-[38px] font-black text-[#5C36EC] tracking-tight flex flex-wrap items-center justify-center gap-1 sm:gap-2">
            <span className="text-[#FFB547] text-xl sm:text-2xl animate-pulse">✨</span>
            <span className="whitespace-nowrap">우리 뭐 하고 놀까?</span>
            <span className="text-[#FFB547] text-xl sm:text-2xl animate-pulse">✨</span>
          </h1>
        </div>

        {/* Search Bar Container */}
        <form onSubmit={handleSearchSubmit} className="relative w-full mb-6">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            className="w-full bg-white text-base py-4 pl-12 pr-6 rounded-full border border-[#DCD7EC] focus:border-[#5C36EC] focus:ring-1 focus:ring-[#5C36EC] outline-none shadow-sm transition-all text-gray-800 placeholder-[#9CA3AF]"
            placeholder="어디로 놀러갈까요?"
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              localStorage.setItem("search_tab_query", val);
            }}
          />
        </form>

        {/* Dynamic Monetized Partners AD Banner */}
        {adsenseHtml ? (
          <div className="w-full bg-white border border-[#DECEFF] rounded-2xl p-2 mb-8 relative group overflow-hidden shadow-sm">
            <div className="absolute top-2 right-2 z-20">
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAdSettingsOpen(true); }}
                className="p-1 rounded bg-black/40 text-white hover:bg-black/60 transition-colors"
                title="광고 수익화 설정"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
            <div 
              className="w-full overflow-hidden flex justify-center text-xs text-gray-400"
              dangerouslySetInnerHTML={{ __html: adsenseHtml }}
            />
          </div>
        ) : (
          <a
            href={coupangLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-[#ECE7FF] to-[#F1F3FF] border border-[#DECEFF] rounded-2xl p-5 mb-8 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-all cursor-pointer"
          >
            {/* Accent light sphere */}
            <div className="absolute top-0 right-1/4 w-32 h-32 bg-[#8B5CF6] rounded-full filter blur-3xl opacity-10"></div>
            
            {/* Settings trigger over AD */}
            <div className="absolute top-2.5 right-2.5">
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAdSettingsOpen(true); }}
                className="p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-[#5C36EC] transition-colors border shadow-sm"
                title="웹사이트 수익 모델 설정 (애드센스/쿠팡파트너스)"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col pr-8">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#8B5CF6] text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm">AFFILIATE</span>
                <span className="text-xs font-bold text-[#6D28D9] flex items-center gap-1">여행 전문관 특가 <ExternalLink className="w-3 h-3" /></span>
              </div>
              <p className="text-[#1F2937] text-sm md:text-base font-extrabold tracking-tight leading-snug">
                에버랜드 & 아르떼뮤지엄 패스<br/>
                <span className="text-[#5C36EC]">최대 40% 한정 단독 할인 특가 보기</span>
              </p>
              <span className="text-[10px] text-gray-500 mt-1.5">* 제휴 링크 경유 구매 시 '우리놀까' 플랫폼에 상생 수수료가 전액 기부됩니다.</span>
            </div>

            {/* 3D-styled Special Pack Icon */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <div className="absolute w-12 h-12 bg-gradient-to-br from-[#A78BFA] to-[#6D28D9] rounded-xl transform rotate-12 shadow-md animate-bounce flex items-center justify-center">
                <Coins className="w-6 h-6 text-yellow-300" />
              </div>
              <span className="absolute top-0 right-0 text-yellow-300 text-xs animate-ping">✦</span>
              <span className="absolute bottom-1 left-0 text-[#8B5CF6] text-sm font-bold">★</span>
            </div>
          </a>
        )}

        {/* Regions Horizontal Carousel lists */}

        {/* 1. Seoul Region */}
        <div className="w-full mb-8 relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-[#111827] flex items-center gap-1.5">
              <span className="text-[#8B5CF6]">📍</span> 서울
            </h2>
            <Link href="/routes?region=서울" className="text-xs font-semibold text-[#8B5CF6] hover:underline flex items-center gap-0.5">
              전체보기 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div
            ref={seoulScrollRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
          >
            {placesLoading ? (
              <div className="flex items-center justify-center w-full py-16 text-gray-500 text-sm">
                <Loader2 className="animate-spin w-5 h-5 text-[#8B5CF6] mr-2" />
                추천 장소 로딩중...
              </div>
            ) : seoulPlaces.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm w-full bg-white rounded-xl border border-dashed border-gray-200">
                추천할 장소가 없습니다.
              </div>
            ) : (
              seoulPlaces.map((place) => {
                const meta = getPlaceMeta(place.name);
                const isSaved = savedPlaceIds.includes(place.id);
                return (
                  <Link key={place.id} href={`/routes?search=${encodeURIComponent(place.name)}`} className="snap-start shrink-0 w-[140px] block group">
                    <div className="relative w-[140px] h-[100px] rounded-xl overflow-hidden bg-gray-200 mb-2">
                      <img
                        referrerPolicy="no-referrer"
                        src={meta.image}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Interactive Bookmark Button */}
                      <button
                        onClick={(e) => toggleBookmark(place.id, e)}
                        className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md border hover:scale-110 active:scale-95 transition-transform"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-[#8B5CF6] text-[#8B5CF6]" : "text-gray-400"}`} />
                      </button>
                    </div>
                    {/* Meta Tags & Name */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${meta.tagColor}`}>
                          {meta.tag}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-gray-800 truncate leading-snug group-hover:text-[#8B5CF6] transition-colors">
                        {place.name}
                      </h3>
                      {/* Location and rating */}
                      <div className="flex items-center justify-between text-[10px] text-gray-500 mt-0.5">
                        <span className="truncate max-w-[80px]">{meta.location}</span>
                        <span className="flex items-center gap-0.5 text-amber-500 font-bold shrink-0">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          {meta.rating}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
          {/* Scroll Right Trigger */}
          {seoulPlaces.length > 3 && (
            <button
              onClick={() => scrollRight(seoulScrollRef)}
              className="absolute right-[-12px] top-[75px] transform -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-10"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>

        {/* 2. Gyeonggi Region */}
        <div className="w-full mb-8 relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-[#111827] flex items-center gap-1.5">
              <span className="text-[#8B5CF6]">📍</span> 경기
            </h2>
            <Link href="/routes?region=경기" className="text-xs font-semibold text-[#8B5CF6] hover:underline flex items-center gap-0.5">
              전체보기 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div
            ref={gyeonggiScrollRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
          >
            {placesLoading ? (
              <div className="flex items-center justify-center w-full py-16 text-gray-500 text-sm">
                <Loader2 className="animate-spin w-5 h-5 text-[#8B5CF6] mr-2" />
                추천 장소 로딩중...
              </div>
            ) : gyeonggiPlaces.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm w-full bg-white rounded-xl border border-dashed border-gray-200">
                추천할 장소가 없습니다.
              </div>
            ) : (
              gyeonggiPlaces.map((place) => {
                const meta = getPlaceMeta(place.name);
                const isSaved = savedPlaceIds.includes(place.id);
                return (
                  <Link key={place.id} href={`/routes?search=${encodeURIComponent(place.name)}`} className="snap-start shrink-0 w-[140px] block group">
                    <div className="relative w-[140px] h-[100px] rounded-xl overflow-hidden bg-gray-200 mb-2">
                      <img
                        referrerPolicy="no-referrer"
                        src={meta.image}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Interactive Bookmark Button */}
                      <button
                        onClick={(e) => toggleBookmark(place.id, e)}
                        className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md border hover:scale-110 active:scale-95 transition-transform"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-[#8B5CF6] text-[#8B5CF6]" : "text-gray-400"}`} />
                      </button>
                    </div>
                    {/* Meta Tags & Name */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${meta.tagColor}`}>
                          {meta.tag}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-gray-800 truncate leading-snug group-hover:text-[#8B5CF6] transition-colors">
                        {place.name}
                      </h3>
                      {/* Location and rating */}
                      <div className="flex items-center justify-between text-[10px] text-gray-500 mt-0.5">
                        <span className="truncate max-w-[80px]">{meta.location}</span>
                        <span className="flex items-center gap-0.5 text-amber-500 font-bold shrink-0">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          {meta.rating}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
          {/* Scroll Right Trigger */}
          {gyeonggiPlaces.length > 3 && (
            <button
              onClick={() => scrollRight(gyeonggiScrollRef)}
              className="absolute right-[-12px] top-[75px] transform -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-10"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>

        {/* 3. Incheon Region */}
        <div className="w-full mb-8 relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-[#111827] flex items-center gap-1.5">
              <span className="text-[#8B5CF6]">📍</span> 인천
            </h2>
            <Link href="/routes?region=인천" className="text-xs font-semibold text-[#8B5CF6] hover:underline flex items-center gap-0.5">
              전체보기 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div
            ref={incheonScrollRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
          >
            {placesLoading ? (
              <div className="flex items-center justify-center w-full py-16 text-gray-500 text-sm">
                <Loader2 className="animate-spin w-5 h-5 text-[#8B5CF6] mr-2" />
                추천 장소 로딩중...
              </div>
            ) : incheonPlaces.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm w-full bg-white rounded-xl border border-dashed border-gray-200">
                추천할 장소가 없습니다.
              </div>
            ) : (
              incheonPlaces.map((place) => {
                const meta = getPlaceMeta(place.name);
                const isSaved = savedPlaceIds.includes(place.id);
                return (
                  <Link key={place.id} href={`/routes?search=${encodeURIComponent(place.name)}`} className="snap-start shrink-0 w-[140px] block group">
                    <div className="relative w-[140px] h-[100px] rounded-xl overflow-hidden bg-gray-200 mb-2">
                      <img
                        referrerPolicy="no-referrer"
                        src={meta.image}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Interactive Bookmark Button */}
                      <button
                        onClick={(e) => toggleBookmark(place.id, e)}
                        className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md border hover:scale-110 active:scale-95 transition-transform"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-[#8B5CF6] text-[#8B5CF6]" : "text-gray-400"}`} />
                      </button>
                    </div>
                    {/* Meta Tags & Name */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${meta.tagColor}`}>
                          {meta.tag}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-gray-800 truncate leading-snug group-hover:text-[#8B5CF6] transition-colors">
                        {place.name}
                      </h3>
                      {/* Location and rating */}
                      <div className="flex items-center justify-between text-[10px] text-gray-500 mt-0.5">
                        <span className="truncate max-w-[80px]">{meta.location}</span>
                        <span className="flex items-center gap-0.5 text-amber-500 font-bold shrink-0">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          {meta.rating}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
          {/* Scroll Right Trigger */}
          {incheonPlaces.length > 3 && (
            <button
              onClick={() => scrollRight(incheonScrollRef)}
              className="absolute right-[-12px] top-[75px] transform -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-10"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>

        {/* Bottom Monetized Banner */}
        {adsenseHtml ? (
          <div className="w-full bg-white border border-[#D1D5DB] rounded-2xl p-2 mt-auto relative overflow-hidden flex justify-center shadow-sm">
            <div 
              className="w-full text-center text-[10px] text-gray-400"
              dangerouslySetInnerHTML={{ __html: adsenseHtml }}
            />
          </div>
        ) : (
          <a
            href={coupangLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-[#F3F4F6] to-[#E5E7EB] border border-[#D1D5DB] rounded-2xl p-4 mt-auto text-center relative overflow-hidden cursor-pointer hover:bg-neutral-100 transition-colors block group shadow-sm"
          >
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-gray-600">
              <Coins className="w-4 h-4 text-amber-500 group-hover:animate-bounce" />
              <span>핫플레이스 인근 인싸 아이템 & 맛집 제휴 혜택 보러가기</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </a>
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
            
            {/* Direct Affiliate Link Group */}
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

            {/* Google AdSense / HTML code Group */}
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

            {/* Real Business Tip Guide */}
            <div className="text-[11px] text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-150 flex items-start gap-2 leading-relaxed">
              <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-[#111827]">수익화 꿀팁:</span>
                <p className="mt-0.5">
                  에버랜드, 아르떼뮤지엄 등 핫플레이스 위주로 구성되어 있으므로, <b>크룩(Klook) 파트너스</b>나 <b>와그(WAUG) 파트너스</b>에 무료 가입하여 해당 상품 할인 링크를 입력하면 단 1건의 결제만으로도 <b>4~6%의 실시간 수수료 수익</b>을 정산받을 수 있어 애드센스보다 수익률이 높습니다!
                </p>
              </div>
            </div>

            {/* Action buttons */}
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
