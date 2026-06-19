import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { GoogleMap } from '@/components/GoogleMap';
import { trpc } from '@/lib/trpc';
import { CATEGORIES } from '@shared/types';
import { Loader2, Plus, MapPin, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function getRegionForPlace(place: { address?: string | null; name: string }) {
  const addr = place.address || "";
  const name = place.name;
  const combined = (addr + " " + name);
  
  if (combined.includes("강남역") || combined.includes("역삼") || combined.includes("서초")) return "강남역";
  if (combined.includes("가로수길") || combined.includes("신사")) return "가로수길";
  if (combined.includes("강남")) return "강남";
  if (combined.includes("강북") || combined.includes("종로") || combined.includes("을지로")) {
    if (combined.includes("명동") || combined.includes("을지로")) return "명동";
    return "강북";
  }
  if (combined.includes("동대문")) return "동대문";
  if (combined.includes("명동")) return "명동";
  if (combined.includes("홍대") || combined.includes("연남") || combined.includes("마포") || combined.includes("신촌")) return "홍대";
  if (combined.includes("이태원") || combined.includes("한남") || combined.includes("용산")) return "이태원";
  return "성수"; // Fallback
}

const REGIONS_LIST = ["전체", "강남", "강북", "동대문", "명동", "홍대", "가로수길", "강남역", "이태원", "성수"];

export default function Places() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('전체');

  const { data: places = [], isLoading, refetch } = trpc.places.getByUserId.useQuery();
  const deletePlace = trpc.places.delete.useMutation({
    onSuccess: () => {
      toast.success('장소가 삭제되었습니다');
      refetch();
    },
    onError: () => {
      toast.error('삭제 실패');
    },
  });

  const filteredPlaces = places.filter(place => {
    const matchesCategory = !selectedCategory || place.category === selectedCategory;
    const matchesSearch = place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         place.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === '전체' || getRegionForPlace(place) === selectedRegion;
    return matchesCategory && matchesSearch && matchesRegion;
  });

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.key === category)?.label || category;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 sm:bg-[#F3F4F6] text-[#111827] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[640px] bg-[#FAF8FF] rounded-none sm:rounded-3xl border-0 sm:border border-[#EBE8F3] shadow-none sm:shadow-xl overflow-hidden flex flex-col items-center justify-center p-6 min-h-screen sm:min-h-[920px]">
          <Loader2 className="animate-spin w-8 h-8 text-[#5C36EC]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 sm:bg-[#F3F4F6] text-[#111827] flex flex-col items-center py-0 sm:py-6 px-0 sm:px-4 md:px-8">
      {/* Outer frame matching the beautiful mockup wrapper */}
      <div className="w-full max-w-[640px] bg-[#FAF8FF] rounded-none sm:rounded-3xl border-0 sm:border border-[#EBE8F3] shadow-none sm:shadow-xl overflow-hidden flex flex-col p-4 sm:p-6 min-h-screen sm:min-h-[920px]">
        
        {/* Top Header Controls */}
        <div className="flex items-center justify-between mb-6 border-b border-neutral-100 pb-4">
          <Link href="/" className="text-sm font-semibold text-[#5C36EC] hover:underline flex items-center gap-1">
            &larr; 메인으로
          </Link>
          <span className="text-base font-extrabold text-[#111827]">
            내 장소 목록
          </span>
          <Link href="/add-place" className="inline-flex items-center justify-center rounded-xl text-xs font-bold bg-[#5C36EC] text-white hover:bg-opacity-90 h-9 px-3.5 py-1.5 gap-1.5 shadow-sm transition-colors">
            <Plus className="w-4 h-4" />
            장소 추가
          </Link>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6 space-y-4">
          <Input
            placeholder="장소명 또는 주소로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-[#DCD7EC] focus:border-[#5C36EC] bg-white rounded-xl py-5 shadow-sm placeholder:text-gray-400 font-medium text-xs"
          />
          
          <div className="flex gap-1.5 flex-wrap">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full h-8 text-xs font-bold transition-all px-3 ${
                selectedCategory === null 
                  ? 'bg-[#5C36EC] text-white hover:bg-opacity-90 border-[#5C36EC]' 
                  : 'bg-white text-gray-500 border-[#E5E7EB] hover:bg-gray-50'
              }`}
            >
              전체
            </Button>
            {CATEGORIES.map(cat => (
              <Button
                key={cat.key}
                variant={selectedCategory === cat.key ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat.key)}
                className={`rounded-full h-8 text-xs font-bold transition-all px-3 ${
                  selectedCategory === cat.key 
                    ? 'bg-[#5C36EC] text-white hover:bg-opacity-90 border-[#5C36EC]' 
                    : 'bg-white text-gray-500 border-[#E5E7EB] hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* 지역 필터 */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-3 border-t border-[#EBE8F3]">
            {REGIONS_LIST.map((reg) => {
              const isSel = selectedRegion === reg;
              return (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setSelectedRegion(reg)}
                  className={`px-3.5 py-1.5 text-xs rounded-full border transition-all shrink-0 font-bold ${
                    isSel
                      ? 'bg-[#5C36EC] text-white border-[#5C36EC]' 
                      : 'bg-white text-gray-500 border-[#E5E7EB] hover:bg-gray-50'
                  }`}
                >
                  {reg === "전체" ? "📍 전체 지역" : reg}
                </button>
              );
            })}
          </div>
        </div>

        {/* 지도 */}
        {filteredPlaces.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold text-gray-400 mb-2 pl-1 select-none">🗺️ 확인된 장소들 ({filteredPlaces.length}곳)</h2>
            <GoogleMap
              places={filteredPlaces.map(p => ({
                ...p,
                color: CATEGORIES.find(c => c.key === p.category)?.color || '#5C36EC',
              }))}
              height="280px"
              drawPath={false}
            />
          </div>
        )}

        {/* 장소 목록 */}
        {filteredPlaces.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-[#DCD7EC] bg-white rounded-2xl flex-1 flex flex-col justify-center items-center">
            <MapPin className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-xs text-gray-400 mb-4 font-bold">아직 추가된 등록 장소가 없습니다</p>
            <Link href="/add-place" className="inline-flex items-center justify-center rounded-2xl text-xs font-bold bg-[#5C36EC] text-white hover:bg-indigo-700 h-10 px-4">
              첫 번째 장소 추가하기
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 overflow-y-auto max-h-[480px] pr-1">
            {filteredPlaces.map(place => (
              <Card key={place.id} className="p-4 border border-[#EBE8F3] bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow relative">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-gray-800 text-sm truncate">{place.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 select-none">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-500 border border-neutral-200">
                        {getCategoryLabel(place.category)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deletePlace.mutate(place.id)}
                    disabled={deletePlace.isPending}
                    className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {place.address && (
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#5C36EC] shrink-0" /> {place.address}
                  </p>
                )}
                {place.description && (
                  <p className="text-xs text-slate-500 leading-relaxed font-light mt-1.5 line-clamp-2 pl-4.5 border-l border-neutral-100">
                    {place.description}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
