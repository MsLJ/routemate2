import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { CATEGORIES, PlaceCategory } from '@shared/types';
import { MapPin, Plus, Trash2, Search, Footprints, Car, AlertCircle, Sparkles, Navigation, ArrowLeft, ArrowDown, Bell, ChevronRight, Menu, Compass, Check } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleMap } from '@/components/GoogleMap';

interface TempPlace {
  id: number;
  name: string;
  category: PlaceCategory;
  address?: string | null;
  description?: string | null;
  latitude: number | string;
  longitude: number | string;
}

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

export default function CreateRoute() {
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [title, setTitle] = useState('힐링하기 좋은 서울 전시 루트');
  const [description, setDescription] = useState('서울의 대표적인 현대 미술과 야경을 즐길 수 있는 전시 루트 코스입니다.');
  const [routePlaces, setRoutePlaces] = useState<TempPlace[]>([
    {
      id: 101,
      name: '덕수궁 돌담길 산책로',
      category: 'hotplace',
      address: '서울특별시 중구 덕수궁길 99',
      description: '고즈넉한 고궁의 정취와 가을 낙엽이 어우러진 길',
      latitude: 37.5658,
      longitude: 126.9752
    },
    {
      id: 102,
      name: '성수동 아틀리에 팝업 스트리트',
      category: 'hotplace',
      address: '서울특별시 성동구 연무장길 35',
      description: '트렌디하고 감각적인 브랜드의 복합 문화공간',
      latitude: 37.5443,
      longitude: 127.0569
    },
    {
      id: 103,
      name: '블루보틀 삼청 한옥',
      category: 'cafe',
      address: '서울특별시 종로구 삼청로2길 40-3',
      description: '여유로운 기와 지붕 아래 향긋한 싱글 오리진 에스프레소',
      latitude: 37.5815,
      longitude: 126.9818
    },
    {
      id: 104,
      name: '한남동 갤러리 로드',
      category: 'hotplace',
      address: '서울특별시 용산구 이태원로 248',
      description: '매주 새로운 개성과 조형의 현대미술이 살아 숨 쉬는 길',
      latitude: 37.5365,
      longitude: 127.0016
    },
    {
      id: 105,
      name: '여의도 한강공원 노을정원',
      category: 'hotplace',
      address: '서울특별시 영등포구 여의동로 330',
      description: '붉게 물드는 석양을 맞이하며 힐링하는 수변 쉼터',
      latitude: 37.5284,
      longitude: 126.9332
    },
    {
      id: 106,
      name: '남산 케이블카 & 밤 전망대',
      category: 'hotplace',
      address: '서울특별시 용산구 남산공원길 105',
      description: '서울의 화려한 밤하늘을 수놓는 별빛 파노라마 뷰',
      latitude: 37.5512,
      longitude: 126.9882
    }
  ]);
  
  // Dynamic visited steps tracker for real progress tracking
  const [visitedPlaceIds, setVisitedPlaceIds] = useState<number[]>([101, 102]);
  const completedCount = routePlaces.filter(p => visitedPlaceIds.includes(p.id)).length;
  
  // Google Places search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingGMap, setIsSearchingGMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.978 });
  const [mapZoom, setMapZoom] = useState(13);

  // Quick Addition Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingPlace, setPendingPlace] = useState<{
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory>('hotplace');
  const [placeDescription, setPlaceDescription] = useState('');

  const createPlaceMutation = trpc.places.create.useMutation();
  const createRouteMutation = trpc.routes.create.useMutation({
    onSuccess: (data) => {
      toast.success('🎉 루트가 정상적으로 저장되었습니다!');
      // Back to route listing or follow view
      setViewMode('list');
    },
    onError: (error) => {
      toast.error('루트 저장 실패: ' + error.message);
    },
  });

  // Google Maps Search Service Integration with Beautiful Local Fallbacks
  const handleGoogleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Rich local search index to guarantee matching of iconic landmarks even when Google Places is restricted
    const KOREA_LANDMARKS = [
      { name: '에버랜드', address: '경기도 용인시 처인구 포곡읍 에버랜드로 199', latitude: 37.2939, longitude: 127.2025 },
      { name: '롯데월드 어드벤처', address: '서울특별시 송파구 올림픽로 240', latitude: 37.5111, longitude: 127.0982 },
      { name: '아르떼뮤지엄 제주', address: '제주특별자치도 제주시 애월읍 어림비로 478', latitude: 33.3965, longitude: 126.3575 },
      { name: '아르떼뮤지엄 여수', address: '전라남도 여수시 박람회길 1', latitude: 34.7505, longitude: 127.7455 },
      { name: '아르떼뮤지엄 강릉', address: '강원도 강릉시 난설헌로 131', latitude: 37.7984, longitude: 128.9181 },
      { name: 'N서울타워', address: '서울특별시 용산구 남산공원길 105', latitude: 37.5512, longitude: 126.9882 },
      { name: '경복궁', address: '서울특별시 종로구 사직로 161', latitude: 37.5796, longitude: 126.9770 },
      { name: '덕수궁', address: '서울특별시 중구 세종대로 99', latitude: 37.5658, longitude: 126.9751 },
      { name: '창덕궁', address: '서울특별시 종로구 율곡로 99', latitude: 37.5794, longitude: 126.9910 },
      { name: '명동거리', address: '서울특별시 중구 명동길 일대', latitude: 37.5635, longitude: 126.9846 },
      { name: '명동 성당', address: '서울특별시 중구 명동길 74', latitude: 37.5632, longitude: 126.9873 },
      { name: '그라운드시소 서촌', address: '서울특별시 종로구 자하문로6길 18-8', latitude: 37.5772, longitude: 126.9723 },
      { name: '그라운드시소 성수', address: '서울특별시 성동구 아차산로17길 49', latitude: 37.5445, longitude: 127.0631 },
      { name: '여의도 한강공원', address: '서울특별시 영등포구 여의동로 330', latitude: 37.5284, longitude: 126.9332 },
      { name: '뚝섬한강공원', address: '서울특별시 광진구 강변북로 139', latitude: 37.5289, longitude: 127.0692 },
      { name: '부산 해운대해수욕장', address: '부산광역시 해운대구 우동', latitude: 35.1587, longitude: 129.1601 },
      { name: '광안리 해수욕장', address: '부산광역시 수영구 광안해변로 219', latitude: 35.1531, longitude: 129.1189 },
      { name: '성수동 카페거리', address: '서울특별시 성동구 성수동2가', latitude: 37.5446, longitude: 127.0560 },
      { name: '홍대 걷고싶은거리', address: '서울특별시 마포구 어울마당로 111', latitude: 37.5567, longitude: 126.9237 },
      { name: '인사동 문화의거리', address: '서울특별시 종로구 인사동길 일대', latitude: 37.5719, longitude: 126.9868 },
      { name: '북촌한옥마을', address: '서울특별시 종로구 계동길 37', latitude: 37.5830, longitude: 126.9829 },
      { name: '가로수길', address: '서울특별시 강남구 신사동', latitude: 37.5218, longitude: 127.0229 },
      { name: '강남역', address: '서울특별시 강남구 강남대로 지하 396', latitude: 37.4979, longitude: 127.0276 },
      { name: '잠실 롯데타워', address: '서울특별시 송파구 올림픽로 300', latitude: 37.5126, longitude: 127.1025 },
    ];

    const localMatches = KOREA_LANDMARKS.filter(
      item => item.name.toLowerCase().includes(query.toLowerCase()) || item.address.toLowerCase().includes(query.toLowerCase())
    ).map((r, i) => ({
      id: `local-${i}-${Date.now()}`,
      name: r.name,
      address: r.address,
      latitude: r.latitude,
      longitude: r.longitude,
    }));

    // Infinite flexibility: Allow building ANY searchable title at the current map center
    const customOption = {
      id: `custom-spot-${Date.now()}`,
      name: `✨ 새 장소: ${query}`,
      address: '지도의 현재 중심 위치에 해당 장소를 등록합니다',
      latitude: mapCenter.lat,
      longitude: mapCenter.lng,
    };

    const combinedResults = [...localMatches, customOption];

    // Check if Google Maps Places API is available
    if (window.google?.maps) {
      setIsSearchingGMap(true);
      
      const runSearch = async () => {
        try {
          const { Place } = await window.google.maps.importLibrary("places") as any;
          const { places } = await Place.searchByText({
            textQuery: query,
            fields: ['id', 'displayName', 'formattedAddress', 'location'],
            language: 'ko'
          });

          if (places && places.length > 0) {
            const formatted = places.map((r: any) => ({
              id: r.id || `gmap-${Math.random()}`,
              name: r.displayName || '',
              address: r.formattedAddress || '',
              latitude: r.location ? r.location.lat() : 37.5665,
              longitude: r.location ? r.location.lng() : 126.978,
            }));

            const googleFiltered = formatted.filter(g => !localMatches.some(l => l.name === g.name));
            const finalResults = [...localMatches, ...googleFiltered, customOption];
            setSearchResults(finalResults);
            
            setIsSearchingGMap(false);
            if (finalResults.length > 0) {
              setMapCenter({ lat: finalResults[0].latitude, lng: finalResults[0].longitude });
              setMapZoom(15);
              toast.success(`'${query}' 검색 결과 ${finalResults.length}건을 가져왔습니다.`);
            }
            return;
          }
        } catch (err) {
          console.warn("Modern Place.searchByText failed, trying legacy fallback:", err);
        }

        // Legacy fallback
        if (window.google?.maps?.places?.PlacesService) {
          try {
            const dummyContainer = document.createElement('div');
            const service = new window.google.maps.places.PlacesService(dummyContainer);
            
            service.textSearch({ query: query }, (results, status) => {
              setIsSearchingGMap(false);
              if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                const formatted = results.map(r => ({
                  id: r.place_id || `gmap-${Math.random()}`,
                  name: r.name || '',
                  address: r.formatted_address || '',
                  latitude: r.geometry?.location?.lat() || 37.5665,
                  longitude: r.geometry?.location?.lng() || 126.978,
                }));

                const googleFiltered = formatted.filter(g => !localMatches.some(l => l.name === g.name));
                const finalResults = [...localMatches, ...googleFiltered, customOption];
                setSearchResults(finalResults);
                
                if (finalResults.length > 0) {
                  setMapCenter({ lat: finalResults[0].latitude, lng: finalResults[0].longitude });
                  setMapZoom(15);
                  toast.success(`'${query}' 검색 결과 ${finalResults.length}건을 가져왔습니다.`);
                }
              } else {
                setSearchResults(combinedResults);
                setMapCenter({ lat: combinedResults[0].latitude, lng: combinedResults[0].longitude });
                setMapZoom(14);
                toast.success(`'${query}' 검색 완료 (안전 로컬 연동: ${localMatches.length}건 매칭).`);
              }
            });
          } catch (legacyErr) {
            console.error("Legacy Places search failed:", legacyErr);
            setIsSearchingGMap(false);
            setSearchResults(combinedResults);
            setMapCenter({ lat: combinedResults[0].latitude, lng: combinedResults[0].longitude });
            setMapZoom(14);
            toast.success(`'${query}' 검색 완료 (로컬 백업 모드).`);
          }
        } else {
          setIsSearchingGMap(false);
          setSearchResults(combinedResults);
          setMapCenter({ lat: combinedResults[0].latitude, lng: combinedResults[0].longitude });
          setMapZoom(14);
          toast.success(`'${query}' 검색 완료 (로컬 백업 모드).`);
        }
      };

      runSearch();
    } else {
      // Local Database Lookup
      setSearchResults(combinedResults);
      setMapCenter({ lat: combinedResults[0].latitude, lng: combinedResults[0].longitude });
      setMapZoom(14);
      toast.success(`'${query}' 검색 완료 (로컬 인덱스 매칭: ${localMatches.length}건).`);
    }
  };

  // Click on Gmaps to create custom spot
  const handleMapClick = (lat: number, lng: number, address?: string) => {
    setPendingPlace({
      name: address ? address.split(',')[0] : '지도 표시 지점',
      address: address || '지도 클릭 위치',
      latitude: lat,
      longitude: lng
    });
    setSelectedCategory('hotplace');
    setPlaceDescription('');
    setShowAddModal(true);
  };

  const handleSelectSearchResult = (p: any) => {
    setPendingPlace({
      name: p.name,
      address: p.address,
      latitude: p.latitude,
      longitude: p.longitude
    });
    setSelectedCategory('hotplace');
    setPlaceDescription('');
    setShowAddModal(true);
  };

  const handleAddPlaceConfirm = () => {
    if (!pendingPlace) return;

    createPlaceMutation.mutate({
      name: pendingPlace.name,
      category: selectedCategory,
      address: pendingPlace.address,
      description: placeDescription,
      latitude: pendingPlace.latitude,
      longitude: pendingPlace.longitude
    }, {
      onSuccess: (data) => {
        const addedSpot: TempPlace = {
          id: Number(data.placeId),
          name: pendingPlace.name,
          category: selectedCategory,
          address: pendingPlace.address,
          description: placeDescription,
          latitude: pendingPlace.latitude,
          longitude: pendingPlace.longitude
        };
        
        setRoutePlaces(prev => [...prev, addedSpot]);
        // Update map center with new coordinates
        setMapCenter({ lat: pendingPlace.latitude, lng: pendingPlace.longitude });
        setMapZoom(16);
        setShowAddModal(false);
        setPendingPlace(null);
        toast.success(`'${pendingPlace.name}' 장소를 루트 코스에 추가하였습니다!`);
      },
      onError: (err) => {
        toast.error("장소 정보 저장에 실패했습니다: " + err.message);
      }
    });
  };

  const handleRemovePlaceFromRoute = (index: number) => {
    setRoutePlaces(prev => prev.filter((_, i) => i !== index));
    toast.success("루트 장소를 삭제하였습니다.");
  };

  const handleCreateRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("루트 제목을 입력해주세요!");
      return;
    }
    if (routePlaces.length < 2) {
      toast.error("루트 구성을 위해 최소 2곳 이상의 장소가 등록되어야 합니다.");
      return;
    }

    createRouteMutation.mutate({
      title,
      description,
      placeIds: routePlaces.map(p => p.id)
    });
  };

  // Distance computation
  const calculatedSegs = routePlaces.map((place, idx) => {
    if (idx === 0) return null;
    const prev = routePlaces[idx - 1];
    const dist = getDistanceKm(
      Number(prev.latitude),
      Number(prev.longitude),
      Number(place.latitude),
      Number(place.longitude)
    );
    const walkingMins = Math.max(1, Math.round(dist * 15));
    const drivingMins = Math.max(1, Math.round(dist * 1.5));
    return { dist, walkingMins, drivingMins };
  });

  const totalDistance = calculatedSegs.reduce((sum, seg) => sum + (seg?.dist || 0), 0);
  const totalWalkTime = calculatedSegs.reduce((sum, seg) => sum + (seg?.walkingMins || 0), 0);

  return (
    <div className="min-h-screen bg-neutral-50 sm:bg-[#F3F4F6] text-[#111827] flex flex-col items-center py-0 sm:py-6 px-0 sm:px-4 md:px-8 font-sans">
      {/* Phone Viewport Frame container */}
      <div className="w-full max-w-[640px] bg-white rounded-none sm:rounded-[36px] border-0 sm:border border-[#EBE8F3] shadow-none sm:shadow-2xl overflow-hidden flex flex-col p-4 sm:p-6 min-h-screen sm:min-h-[920px]">
        
        {viewMode === 'list' ? (
          /* =======================================================
             VIEW 1: List Overview / Create Route Mockup 3
             ======================================================= */
          <div className="flex-1 flex flex-col">
            
            {/* Header: ArrowLeft + "루트 만들기" + Notification Bell */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-100">
              <button
                type="button"
                onClick={() => navigate('/my')}
                className="p-1 hover:bg-neutral-100 rounded-full transition-colors flex items-center justify-center bg-transparent border-0 cursor-pointer text-neutral-800"
              >
                <ArrowLeft className="w-6 h-6 stroke-[2.25]" />
              </button>
              
              <h1 className="text-xl font-black text-neutral-900 tracking-tight">
                루트 만들기
              </h1>

              <button className="p-1 hover:bg-neutral-100 rounded-full transition-colors bg-transparent border-0 cursor-pointer text-neutral-800">
                <Bell className="w-6 h-6 stroke-[2]" />
              </button>
            </div>

            {/* Content list body */}
            <div className="flex-1 overflow-y-auto pr-1">
              
              {/* Section Header: 내 루트 */}
              <h3 className="text-sm font-extrabold text-[#5C36EC] tracking-tight mb-3.5 select-none uppercase">
                내 루트
              </h3>

              {/* 내 루트 Card Component */}
              <Card className="p-4 rounded-[28px] bg-[#FAF8FF] border border-[#ECE9FF] shadow-xs flex items-center gap-4 mb-6 hover:shadow-md transition-all duration-300">
                {/* Stunning City Landmark Image instead of a keyboard */}
                <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-xs">
                  <img 
                    src="https://images.unsplash.com/photo-1549417229-aa67d3263c09?auto=format&fit=crop&w=300&h=300&q=80" 
                    alt="서울 대표 명소" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Card copy information */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] font-black text-neutral-900 truncate leading-snug">
                    {title}
                  </h4>
                  <div className="text-sm font-black text-[#5C36EC] mt-1 leading-none">
                    진행률 <span className="font-extrabold">{completedCount}</span> / {routePlaces.length}
                  </div>
                  <p className="text-[11px] text-neutral-500 font-medium mt-1">
                    마지막 방문지: {routePlaces.length > 0 ? routePlaces[routePlaces.length - 1].name : '선택 없음'}
                  </p>
                </div>

                {/* 이어가기 Purple Button */}
                <Button
                  onClick={() => setViewMode('map')}
                  className="h-9 px-3.5 bg-[#5C36EC] hover:bg-[#4C28DC] text-white text-xs font-extrabold rounded-xl shrink-0 tracking-tight cursor-pointer"
                >
                  이어가기
                </Button>
              </Card>

              {/* Dynamic Sequences List Items with Interactive Checkboxes */}
              <div className="space-y-3 mb-6">
                {routePlaces.map((place, index) => (
                  <div 
                    key={place.id || index}
                    className="w-full p-4 rounded-[24px] border border-[#ECE9FF] hover:border-[#D0C5FF] flex items-center justify-between gap-3 text-left transition-all bg-white shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Interactive toggle circle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // Avoid triggering route details click
                          setVisitedPlaceIds(prev => 
                            prev.includes(place.id) 
                              ? prev.filter(id => id !== place.id)
                              : [...prev, place.id]
                          );
                          const isNowVisited = !visitedPlaceIds.includes(place.id);
                          toast.success(isNowVisited ? `"${place.name}" 방문 완료 처리되었습니다.` : `"${place.name}" 방문 취소되었습니다.`);
                        }}
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm shrink-0 border-0 cursor-pointer transition-all ${
                          visitedPlaceIds.includes(place.id)
                            ? 'bg-[#5C36EC] text-white shadow-xs'
                            : 'bg-[#FAF8FF] text-[#5C36EC] hover:bg-[#EEECFF]'
                        }`}
                        title={visitedPlaceIds.includes(place.id) ? "방문 완료 취소하기" : "방문 완료로 표시하기"}
                      >
                        {visitedPlaceIds.includes(place.id) ? (
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          index + 1
                        )}
                      </button>

                      <div 
                        onClick={() => {
                          setMapCenter({ lat: Number(place.latitude), lng: Number(place.longitude) });
                          setMapZoom(15);
                          setViewMode('map');
                        }}
                        className="min-w-0 flex-1"
                      >
                        <span className={`block text-sm font-bold leading-tight transition-all ${
                          visitedPlaceIds.includes(place.id) ? 'line-through text-neutral-400 font-medium' : 'text-neutral-800'
                        }`}>{place.name}</span>
                        <span className="block text-xs text-[#9CA3AF] font-medium mt-1 leading-none truncate max-w-[340px]">
                          {place.description || place.address || '서울의 숨겨진 힐링 명소'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight 
                      onClick={() => {
                        setMapCenter({ lat: Number(place.latitude), lng: Number(place.longitude) });
                        setMapZoom(15);
                        setViewMode('map');
                      }}
                      className="w-5 h-5 text-neutral-400 shrink-0 cursor-pointer" 
                    />
                  </div>
                ))}

                {routePlaces.length === 0 && (
                  <div className="text-center py-8 text-neutral-400 text-xs">
                    아직 추가된 코스 장소가 없습니다.
                  </div>
                )}
              </div>

            </div>

            {/* Giant bottom Compass tracker button */}
            <div className="pt-2">
              <Button
                onClick={() => navigate('/route/follow')}
                className="w-full h-15 bg-[#5C36EC] hover:bg-[#4C28DC] text-white rounded-[24px] font-black text-base flex items-center justify-center gap-2.5 border-0 shadow-lg cursor-pointer transform hover:scale-101 transition-all duration-200"
              >
                <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4 text-white" />
                </div>
                루트 따라가기
              </Button>
            </div>

          </div>
        ) : (
          /* =======================================================
             VIEW 2: Live Map custom UI / Mockup 2
             ======================================================= */
          <div className="flex-1 flex flex-col relative h-full">
            
            {/* Custom Interactive Google Map Search Header */}
            <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="p-1 hover:bg-neutral-100 rounded-full transition-colors flex items-center justify-center bg-transparent border-0 cursor-pointer text-neutral-800"
              >
                <ArrowLeft className="w-6 h-6 stroke-[2.25]" />
              </button>
              
              <div className="text-center flex-1">
                <h1 className="text-base font-extrabold text-[#111827] tracking-tight leading-tight">
                  지도에서 장소 찾기
                </h1>
                <span className="text-[11px] font-semibold text-neutral-400 block mt-0.5">
                  핫플레이스, 맛집, 예쁜 카페를 탐색해 보세요
                </span>
              </div>

              <span className="text-xs font-bold text-[#5C36EC] flex items-center gap-1 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-full shrink-0 select-none">
                <Sparkles className="w-2.5 h-2.5 text-[#5C36EC] animate-pulse" /> AI 모드
              </span>
            </div>

            {/* Search Input field identical to the image 2 mockup! */}
            <div className="mb-4 shrink-0 relative">
              <form onSubmit={handleGoogleSearch} className="w-full">
                <div className="relative w-full">
                  <Input
                    placeholder="장소를 검색하세요 (예: 아르떼뮤지엄)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-13 border border-[#E2E0EB] pr-12 pl-4 text-sm rounded-2xl shadow-xs bg-white focus-visible:ring-1 focus-visible:ring-[#5C36EC] focus-visible:border-[#5C36EC] text-slate-800 font-medium placeholder:text-neutral-400 placeholder:font-medium"
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2.5 top-2.5 h-8 w-8 text-neutral-800 hover:bg-neutral-100 rounded-full"
                    disabled={isSearchingGMap}
                  >
                    <Search className="w-5.5 h-5.5 stroke-[2]" />
                  </Button>
                </div>
              </form>

              {/* Dynamic Google Places Search Results overlay dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-14 bg-white/95 backdrop-blur-[4px] rounded-2xl border border-[#ECE0FF] shadow-xl max-h-[200px] overflow-y-auto z-40 p-2 mt-1 space-y-1">
                  <div className="flex justify-between items-center px-2 pb-1 border-b border-neutral-100 mb-1 shrink-0">
                    <span className="text-[10px] font-black text-neutral-500 uppercase">검색 결과 ({searchResults.length}건)</span>
                    <button 
                      onClick={() => setSearchResults([])} 
                      className="text-[10px] text-[#5C36EC] font-bold bg-indigo-50 px-1.5 py-0.5 rounded-md hover:bg-indigo-100 border-0 cursor-pointer"
                    >
                      닫기
                    </button>
                  </div>
                  {searchResults.map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => handleSelectSearchResult(p)}
                      className="p-2.5 rounded-xl hover:bg-[#FAF8FF] border border-neutral-50 hover:border-[#ECE0FF] text-left transition-all cursor-pointer flex justify-between items-center gap-2"
                    >
                      <div className="min-w-0">
                        <strong className="block text-xs font-bold text-neutral-800 truncate">{p.name}</strong>
                        <span className="block text-[10px] text-neutral-400 truncate mt-0.5">{p.address}</span>
                      </div>
                      <Button
                        size="sm"
                        className="h-7 px-2.5 bg-[#5C36EC] text-white text-[10px] font-extrabold rounded-lg shrink-0 border-0 cursor-pointer"
                      >
                        선택
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Placement button to designate/select a place directly on map center */}
            <div className="mb-4 shrink-0">
              <Button
                type="button"
                onClick={() => {
                  handleMapClick(mapCenter.lat, mapCenter.lng, "지도 선택 지점");
                }}
                className="w-full h-11 bg-white hover:bg-neutral-50 text-[#5C36EC] border-2 border-dashed border-[#5C36EC]/40 hover:border-[#5C36EC] rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-[#5C36EC] fill-[#5C36EC]/10 stroke-[2.25]" />
                📍 지도의 현재 중심점을 방문지로 지정하기
              </Button>
            </div>

            {/* Map Canvas and control drawers with fixed height to prevent collapsing */}
            <div className="w-full h-[300px] sm:h-[340px] rounded-[28px] overflow-hidden border border-[#ECE9FF] relative shadow-inner shrink-0 bg-[#FAF9FC]">
              <GoogleMap
                places={routePlaces}
                onMapClick={handleMapClick}
                center={mapCenter}
                zoom={mapZoom}
                height="100%"
                drawPath={true}
              />
            </div>

            {/* 설정된 코스 (아래로 분리된 수려한 리스트 영역) */}
            <div className="mt-4 bg-white rounded-2xl border border-[#ECE9FF] p-4 shadow-sm flex flex-col shrink-0">
              <div className="flex justify-between items-center mb-3 shrink-0">
                <span className="text-sm font-black text-neutral-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#5C36EC]" />
                  설정된 코스 ({routePlaces.length}곳)
                </span>
                
                {routePlaces.length >= 2 && (
                  <span className="text-[11px] font-extrabold text-[#5C36EC] font-mono bg-[#FAF8FF] px-2.5 py-1 rounded-lg border border-[#ECE9FF]">
                    도보: {totalWalkTime}분 ({totalDistance.toFixed(2)}km)
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {routePlaces.length === 0 ? (
                  <div className="text-center py-6 text-neutral-400 text-xs font-bold bg-[#FAF9FC] rounded-xl border border-dashed border-neutral-100">
                    지도를 클릭하여 핀을 찍거나 검색해 장소를 추가하세요!
                  </div>
                ) : (
                  routePlaces.map((pl, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 hover:bg-[#FAF8FF] border border-neutral-100 hover:border-[#ECE0FF] text-xs transition-colors">
                      <span className="font-extrabold text-neutral-800 truncate max-w-[200px] sm:max-w-xs">
                        {i+1}. {pl.name}
                      </span>
                      <div className="flex items-center gap-2 font-medium shrink-0">
                        <span className="text-[10px] text-neutral-500 font-bold bg-neutral-100 px-2 py-0.5 rounded-md">
                          {CATEGORIES.find(c => c.key === pl.category)?.label || pl.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePlaceFromRoute(i)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-transparent border-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Float form inputs to edit metadata & submit */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewMode('list')}
                className="flex-1 h-12 border-2 border-neutral-200 text-neutral-600 rounded-2xl font-extrabold text-xs"
              >
                목록으로 돌아가기
              </Button>
              <Button
                type="button"
                onClick={handleCreateRouteSubmit}
                disabled={routePlaces.length < 2 || createRouteMutation.isPending}
                className="flex-1 h-12 bg-[#5C36EC] hover:bg-[#4C28DC] text-white rounded-2xl font-black text-xs border-0 shadow-lg"
              >
                {createRouteMutation.isPending ? '저장 중...' : '루트 완료 및 저장'}
              </Button>
            </div>

          </div>
        )}

      </div>

      {/* Slide-Up Custom Dialog Modal for details capture */}
      {showAddModal && pendingPlace && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-[#ECE9FF] overflow-hidden transform animate-in slide-in-from-bottom-8">
            <div className="bg-[#FAF8FF] border-b border-[#ECE9FF] px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-black text-neutral-800 tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#5C36EC]" /> 코스 방문지 정보 설정
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-neutral-900"
              >
                ✕
              </Button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <Label className="text-xs font-bold text-neutral-500 block mb-1">장소명 *</Label>
                <Input
                  value={pendingPlace.name}
                  onChange={(e) => setPendingPlace({ ...pendingPlace, name: e.target.value })}
                  className="h-10 border-[#E2E0EB] text-sm font-bold focus:border-[#5C36EC]"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-neutral-500 block mb-1">분류 *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`py-2 px-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                        selectedCategory === cat.key
                          ? 'border-[#5C36EC] bg-[#FAF8FF] text-[#5C36EC]'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-neutral-500 block mb-1">방문 Tip 설명</Label>
                <Textarea
                  placeholder="예: 힐링할 수 있는 멋진 뷰가 있는 코스"
                  value={placeDescription}
                  onChange={(e) => setPlaceDescription(e.target.value)}
                  className="min-h-[60px] border-[#E2E0EB] text-xs focus:border-[#5C36EC]"
                />
              </div>
            </div>

            <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1 h-10 text-neutral-500 font-bold"
              >
                취소
              </Button>
              <Button
                onClick={handleAddPlaceConfirm}
                disabled={createPlaceMutation.isPending}
                className="flex-1 h-10 bg-[#5C36EC] text-white hover:bg-[#4C28DC] font-bold"
              >
                {createPlaceMutation.isPending ? '저장중' : '추가하기'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
