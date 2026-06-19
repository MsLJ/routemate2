import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { 
  Bookmark, 
  MapPin, 
  Loader2, 
  SlidersHorizontal, 
  ArrowDown, 
  Sparkles, 
  ArrowLeft,
  Heart
} from 'lucide-react';
import { getPlaceMeta } from '@/lib/placeMetadata';
import { NotificationBell } from "@/components/NotificationBell";
import { Card } from '@/components/ui/card';

const REGIONS = ["전체", "서울", "경기", "인천"];

function getPlaceRegion(place: any) {
  const combined = ((place.address || "") + " " + (place.name || "")).toLowerCase();
  if (combined.includes("인천") || combined.includes("송도") || combined.includes("월미도") || combined.includes("아트플랫폼")) {
    return "인천";
  }
  if (combined.includes("경기") || combined.includes("용인") || combined.includes("가평") || combined.includes("수원")) {
    return "경기";
  }
  return "서울";
}

export default function Routes() {
  const [, setLocation] = useLocation();

  // Route queries pre-filled from URL params or localStorage fallback to preserve state
  const [selectedRegion, setSelectedRegion] = useState<string>(() => {
    const urlParam = new URLSearchParams(window.location.search).get('region');
    if (urlParam) return urlParam;
    return localStorage.getItem('search_tab_region') || "전체";
  });
  
  const [searchQuery, setSearchQuery] = useState(() => {
    const urlParam = new URLSearchParams(window.location.search).get('search');
    if (urlParam) return urlParam;
    return localStorage.getItem('search_tab_query') || "";
  });

  const [limit, setLimit] = useState(6);

  // Synchronize initial component mount state with URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    const regionParam = params.get('region');
    if (searchParam !== null) {
      setSearchQuery(searchParam);
      localStorage.setItem('search_tab_query', searchParam);
    }
    if (regionParam !== null) {
      setSelectedRegion(regionParam);
      localStorage.setItem('search_tab_region', regionParam);
    }
  }, []);

  // Fetch all user-created routes using the updated TRPC endpoint with custom filters!
  const { data: routes = [], isLoading } = trpc.routes.getAll.useQuery({
    region: selectedRegion === "전체" ? undefined : selectedRegion,
    search: searchQuery ? searchQuery : undefined,
    sortBy: "recent",
  });

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    localStorage.setItem('search_tab_query', val);
    const url = new URL(window.location.href);
    if (val) {
      url.searchParams.set('search', val);
    } else {
      url.searchParams.delete('search');
    }
    window.history.pushState({}, '', url.toString());
  };

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region);
    localStorage.setItem('search_tab_region', region);
    const url = new URL(window.location.href);
    if (region !== "전체") {
      url.searchParams.set('region', region);
    } else {
      url.searchParams.delete('region');
    }
    window.history.pushState({}, '', url.toString());
  };

  const loadMore = () => {
    setLimit(prev => prev + 6);
  };

  return (
    <div className="min-h-screen bg-neutral-50 sm:bg-[#F3F4F6] text-[#111827] flex flex-col items-center py-0 sm:py-6 px-0 sm:px-4 md:px-8">
      {/* Outer frame matching the beautiful mockup wrapper */}
      <div className="w-full max-w-[640px] bg-[#FAF8FF] rounded-none sm:rounded-3xl border-0 sm:border border-[#EBE8F3] shadow-none sm:shadow-xl overflow-hidden flex flex-col p-4 sm:p-6 min-h-screen sm:min-h-[920px]">
        
        {/* Top Header Controls */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-1 text-sm font-semibold text-[#5C36EC] hover:underline">
            <ArrowLeft className="w-4 h-4" /> 메인으로
          </Link>
          <span className="text-base font-extrabold text-[#111827]">
            전체 루트 탐색
          </span>
          <NotificationBell />
        </div>

        {/* Region Quick Filters */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-none">
          {REGIONS.map((r) => {
            const isActive = selectedRegion === r;
            return (
              <button
                key={r}
                onClick={() => handleRegionSelect(r)}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all ${
                  isActive 
                    ? 'bg-[#5C36EC] text-white border-[#5C36EC]' 
                    : 'bg-white text-gray-500 border-[#E5E7EB] hover:bg-gray-50'
                }`}
              >
                {r === "전체" ? "📍 전체 지역" : r}
              </button>
            );
          })}
        </div>

        {/* Search Input and Filter Icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-white text-sm py-3.5 pl-4 pr-6 rounded-2xl border border-[#DCD7EC] focus:border-[#5C36EC] outline-none shadow-sm text-gray-800 placeholder-[#9CA3AF]"
              placeholder="코스 이름, 역명 또는 역 동선으로 검색"
            />
          </div>
          <button className="p-3.5 rounded-2xl bg-white border border-[#DCD7EC] text-[#5C36EC] hover:bg-indigo-50 transition-colors flex items-center justify-center shadow-sm">
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Routes Grid / Vertical List */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="animate-spin w-8 h-8 text-[#5C36EC] mb-2" />
            <span>루트 정보 불러오는 중...</span>
          </div>
        ) : routes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 bg-white border border-dashed border-[#DCD7EC] rounded-2xl p-6 text-center text-gray-400">
            <Sparkles className="w-10 h-10 text-gray-300 mb-2" />
            <span className="text-sm font-semibold">검색 조건에 맞는 루트가 아직 없습니다.</span>
            <p className="text-xs text-gray-400 mt-1">직접 어플 내에서 첫 번째 낭만 루트를 기획해 보세요!</p>
            <button 
              onClick={() => { 
                setSearchQuery(""); 
                localStorage.setItem('search_tab_query', "");
                setSelectedRegion("전체"); 
                localStorage.setItem('search_tab_region', "전체");
                const url = new URL(window.location.href);
                url.searchParams.delete('search');
                url.searchParams.delete('region');
                window.history.pushState({}, '', url.toString());
              }}
              className="text-xs font-bold text-[#5C36EC] mt-4 underline"
            >
              필터 리셋하기
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 flex-1 items-stretch">
            {routes.slice(0, limit).map((route: any) => {
              const firstPlace = route.places?.[0];
              const meta = firstPlace ? getPlaceMeta(firstPlace.name) : { 
                image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773", 
                tag: "데이트", 
                tagColor: "bg-indigo-100 text-indigo-700" 
              };
              const routeRegion = firstPlace ? getPlaceRegion(firstPlace) : "서울";

              return (
                <Link key={route.id} href={`/route/${route.id}`} className="block group">
                  <Card className="overflow-hidden border border-neutral-200/60 hover:border-[#8B5CF6] hover:shadow-md transition-all duration-300 bg-white rounded-2xl p-4 flex gap-4">
                    {/* Cover thumbnail styling */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                      <img
                        referrerPolicy="no-referrer"
                        src={meta.image}
                        alt={route.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                        {routeRegion}
                      </span>
                    </div>

                    {/* Content details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        {/* Author info and date info */}
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold mb-1 shrink-0 select-none min-w-0">
                          <span className="text-[#8B5CF6] whitespace-nowrap shrink-0">@{route.authorName || "User"}</span>
                          <span>•</span>
                          <span>{new Date(route.createdAt).toLocaleDateString('ko-KR')}</span>
                        </div>

                        {/* Route title */}
                        <h3 className="text-sm font-black text-gray-900 group-hover:text-[#5C36EC] transition-colors truncate">
                          {route.title}
                        </h3>

                        {/* Route description snippet */}
                        {route.description && (
                          <p className="text-[11px] text-gray-500 line-clamp-1 leading-normal my-1">
                            {route.description}
                          </p>
                        )}
                      </div>

                      {/* Micro list mapping of the route course places */}
                      {route.places && route.places.length > 0 && (
                        <div className="bg-neutral-50/70 border border-neutral-100 rounded-lg px-2 py-1.5 my-1">
                          <div className="flex flex-wrap items-center gap-1 text-[10px] font-bold text-neutral-600">
                            {route.places.map((p: any, idx: number) => (
                              <div key={p.id} className="flex items-center gap-1">
                                <span className="truncate max-w-[80px] text-neutral-800">{p.name}</span>
                                {idx < route.places.length - 1 && (
                                  <span className="text-[#8B5CF6]/40 shrink-0">→</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bottom row: Likes and Place count metrics */}
                      <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold mt-1.5 border-t border-neutral-50 pt-2 shrink-0">
                        <span className="flex items-center gap-1 text-[#5C36EC]">
                          <MapPin className="w-3 h-3" />
                          <span>{route.places?.length || 0}개 코스 장소</span>
                        </span>

                        <div className="flex items-center gap-2 text-gray-400 shrink-0">
                          <span className="flex items-center gap-0.5">
                            <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" />
                            <span>{route.likeCount || 0}</span>
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Bookmark className="w-3 h-3 text-indigo-500 fill-indigo-500/10" />
                            <span>{route.saveCount || 0}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination list button */}
        {!isLoading && routes.length > limit && (
          <div className="flex flex-col items-center justify-center pt-8 pb-4 mt-6 border-t border-[#ECE8F3]">
            <p className="text-gray-500 text-xs font-semibold mb-2">
              더 많은 결과를 보고 싶다면?
            </p>
            <button
              onClick={loadMore}
              className="w-10 h-10 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shadow-md hover:bg-[#7C3AED] hover:scale-105 active:scale-95 transition-all"
            >
              <ArrowDown className="w-5 h-5 animate-bounce" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
