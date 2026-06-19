import { useState, useEffect } from 'react';
// Cache bust: v4
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { GoogleMap } from '@/components/GoogleMap';
import { trpc } from '@/lib/trpc';
import { CATEGORIES } from '@shared/types';
import { MapPin, Search, Navigation, Loader2, Compass } from 'lucide-react';
import { toast } from 'sonner';

export default function AddPlace() {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    category: 'restaurant' as any,
    address: '',
    description: '',
    latitude: 37.5665,
    longitude: 126.978,
  });

  // Google Places interactive states
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  const createPlace = trpc.places.create.useMutation({
    onSuccess: () => {
      toast.success('장소가 추가되었습니다!');
      navigate('/places');
    },
    onError: (error) => {
      toast.error('장소 추가 실패: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('장소명을 입력해주세요');
      return;
    }
    createPlace.mutate(formData);
  };

  const handleMapClick = (lat: number, lng: number, address?: string) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address || prev.address || '',
    }));

    if (address) {
      toast.success(`📍 주소 선택됨: ${address}`);
    } else {
      toast.success('지도 선택 위치로 설정 완료');
    }
  };

  // 1. Live Place Search Suggestions using AutocompleteService
  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }

    if (typeof window !== 'undefined' && window.google?.maps) {
      try {
        const { AutocompleteSuggestion } = await window.google.maps.importLibrary("places") as any;
        const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: val,
          includedRegionCodes: ['kr'],
          language: 'ko'
        });
        if (response?.suggestions) {
          const mapped = response.suggestions.map((s: any) => ({
            place_id: s.placePrediction.placeId,
            description: s.placePrediction.text.toString(),
            structured_formatting: {
              main_text: s.placePrediction.mainText.toString(),
              secondary_text: s.placePrediction.secondaryText?.toString() || '',
            }
          }));
          setSuggestions(mapped);
          return;
        }
      } catch (err) {
        console.warn("Modern Autocomplete failed, trying legacy:", err);
      }

      if (window.google?.maps?.places?.AutocompleteService) {
        const autocompleteService = new window.google.maps.places.AutocompleteService();
        autocompleteService.getPlacePredictions(
          {
            input: val,
            language: 'ko',
            // Prioritize suggestions in South Korea for local convenience
            componentRestrictions: { country: 'kr' }
          },
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setSuggestions(predictions);
            } else {
              setSuggestions([]);
            }
          }
        );
      }
    }
  };

  // 2. Fetch specific Place Details when suggestion is selected
  const handleSelectSuggestion = async (prediction: any) => {
    setSearchQuery(prediction.description);
    setSuggestions([]);
    setIsSearching(true);

    if (typeof window !== 'undefined' && window.google?.maps) {
      try {
        const { Place } = await window.google.maps.importLibrary("places") as any;
        const place = new Place({ id: prediction.place_id });
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location']
        });

        const name = place.displayName || prediction.structured_formatting.main_text;
        const address = place.formattedAddress || prediction.description;
        const lat = place.location ? place.location.lat() : 37.5665;
        const lng = place.location ? place.location.lng() : 126.978;

        setFormData(prev => ({
          ...prev,
          name: name,
          address: address,
          latitude: lat,
          longitude: lng,
        }));
        
        setIsSearching(false);
        toast.success(`📍 ${name} 위치 정보 자동완성 완료!`);
        return;
      } catch (err) {
        console.warn("Modern Place details failed, trying legacy:", err);
      }

      if (window.google?.maps?.places?.PlacesService) {
        const dummyDiv = document.createElement('div');
        const placesService = new window.google.maps.places.PlacesService(dummyDiv);

        placesService.getDetails(
          {
            placeId: prediction.place_id,
            fields: ['name', 'formatted_address', 'geometry'],
          },
          (place, status) => {
            setIsSearching(false);
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
              const name = place.name || prediction.structured_formatting.main_text;
              const address = place.formatted_address || prediction.description;
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();

              setFormData(prev => ({
                ...prev,
                name: name,
                address: address,
                latitude: lat,
                longitude: lng,
              }));
              
              toast.success(`📍 ${name} 위치 정보 자동완성 완료!`);
            } else {
              toast.error('장소의 세부 좌표를 불려오지 못했습니다.');
            }
          }
        );
      } else {
        setIsSearching(false);
      }
    } else {
      setIsSearching(false);
    }
  };

  // 3. Device Geolocation integration for Phone/App releases
  const handleGetCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('현재 기기에서 GPS 센서 또는 위치 정보 서비스를 지원하지 않습니다.');
      return;
    }

    setIsGpsLoading(true);
    const toastId = toast.loading('🛰️ 기기 GPS 센서로부터 현재 내 실시간 위치 파악 중...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));

        if (typeof window !== 'undefined' && window.google?.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            setIsGpsLoading(false);
            toast.dismiss(toastId);
            if (status === 'OK' && results?.[0]) {
              const detectedAddress = results[0].formatted_address;
              setFormData(prev => ({
                ...prev,
                address: detectedAddress,
              }));
              toast.success('📱 현재 내 위치 설정 & 주변 주소 자동 매칭 완료!');
            } else {
              toast.success('📱 GPS 실시간 위치 지정 완료');
            }
          });
        } else {
          setIsGpsLoading(false);
          toast.dismiss(toastId);
          toast.success('GPS 실시간 위치 지정 완료');
        }
      },
      (error) => {
        setIsGpsLoading(false);
        toast.dismiss(toastId);
        console.error(error);
        toast.error('위치 호출 실패: 기기의 GPS 권한을 투명하게 허용하셨는지 확인해주세요.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 sm:bg-[#F3F4F6] text-[#111827] flex flex-col items-center py-0 sm:py-6 px-0 sm:px-4 md:px-8">
      {/* Outer frame matching the beautiful mockup wrapper */}
      <div className="w-full max-w-[640px] bg-[#FAF8FF] rounded-none sm:rounded-3xl border-0 sm:border border-[#EBE8F3] shadow-none sm:shadow-xl overflow-hidden flex flex-col p-4 sm:p-6 min-h-screen sm:min-h-[920px]">
        
        {/* Top Header Controls */}
        <div className="flex items-center justify-between mb-6 border-b border-neutral-100 pb-4">
          <button
            type="button"
            onClick={() => navigate('/places')}
            className="text-sm font-semibold text-[#5C36EC] hover:underline flex items-center gap-1"
          >
            &larr; 뒤로가기
          </button>
          <span className="text-base font-extrabold text-[#111827]">
            새 장소 추가
          </span>
          <span className="text-xs font-bold text-[#5C36EC] flex items-center gap-1 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-full shrink-0 select-none">
            📍 GPS 연계
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">

          {/* Quick Real-Time Search Bar */}
          <Card className="p-5 border-sky-100 shadow-md bg-white mb-6">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Search className="w-5 h-5 text-sky-600" />
                Google 실시간 장소 검색
              </Label>
              <Button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isGpsLoading}
                variant="outline"
                className="h-10 border-sky-200 text-sky-600 hover:bg-sky-50 flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold shrink-0"
              >
                {isGpsLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                GPS로 현재 위치 지정
              </Button>
            </div>

            <div className="relative">
              <Input
                placeholder="검색어를 입력해 주세요 (예: 성수역 스타벅스, 남산타워)"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-12 text-slate-800 border-sky-100 focus:border-sky-500 focus:ring-sky-200 placeholder:text-slate-400 font-medium"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />

              {isSearching && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              )}

              {/* Suggestions auto-dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-sky-100 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {suggestions.map((p) => (
                    <button
                      key={p.place_id}
                      type="button"
                      onClick={() => handleSelectSuggestion(p)}
                      className="w-full text-left px-4 py-3 hover:bg-sky-50/50 transition-colors flex items-start gap-2.5"
                    >
                      <MapPin className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="block font-bold text-slate-800 text-sm">
                          {p.structured_formatting.main_text}
                        </span>
                        <span className="block text-xs text-slate-500 font-light">
                          {p.structured_formatting.secondary_text}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 font-light mt-2.5 leading-relaxed">
              💡 장소명을 검색하고 추천 결과에서 선택하면 장소명, 상세 주소 및 고정 위치 핀이 자동으로 완벽하게 채워집니다.
            </p>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-5 border-sky-100 shadow-md bg-white space-y-5">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2.5">
                상세 정보 입력
              </h2>

              {/* Category */}
              {CATEGORIES.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2.5 block">
                    분류 / 테마 *
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.key })}
                        className={`h-11 rounded-lg border text-sm font-medium transition-all ${
                          formData.category === cat.key
                            ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm ring-1 ring-sky-300'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Name */}
              <div>
                <Label htmlFor="name" className="text-sm font-semibold text-slate-700 mb-1.5 block">
                  장소명 *
                </Label>
                <Input
                  id="name"
                  placeholder="예: 홍대 근처 비밀카페"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-11 border-slate-200 text-slate-800 focus:ring-sky-200"
                />
              </div>

              {/* Address */}
              <div>
                <Label htmlFor="address" className="text-sm font-semibold text-slate-700 mb-1.5 block">
                  상세 주소
                </Label>
                <Input
                  id="address"
                  placeholder="위 주소 검색에서 선택 시 자동 주소가 제공되거나 지도 클릭 시 반영됩니다"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="h-11 border-slate-200 text-slate-800"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700 mb-1.5 block">
                  장소 설명 및 메모 (선택)
                </Label>
                <Textarea
                  id="description"
                  placeholder="대기 시간이 있는지, 어떤 메뉴가 맛있는지 소중한 한 줄 평이나 유용한 정보를 적어보세요!"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="border-slate-200 text-slate-800 min-h-24 resize-none leading-relaxed"
                />
              </div>
            </Card>

            {/* Map selection display */}
            <Card className="p-5 border-sky-100 shadow-md bg-white">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-sky-600" />
                  지도로 상세 위치 핀 확인 및 미세 조정
                </Label>
              </div>

              <GoogleMap
                places={[
                  {
                    id: 9999,
                    name: formData.name || '선택 위치',
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    category: formData.category,
                  },
                ]}
                center={{ lat: formData.latitude, lng: formData.longitude }}
                height="400px"
                onMapClick={handleMapClick}
                drawPath={false}
              />
              <p className="text-xs text-slate-400 font-light mt-3 leading-relaxed">
                👉 지도상의 임의의 장소를 마우스로 클릭하거나 터치하면 핀이 해당 위치로 이동하며 해당 역지오코딩 주소가 자동 배정됩니다.
              </p>
            </Card>

            {/* Actions for Mobile Screen Compatibility */}
            <div className="flex items-center gap-4.5 pt-4.5 max-sm:flex-col-reverse max-sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/places')}
                className="w-full sm:flex-1 h-12 font-medium text-slate-600 hover:bg-slate-50"
              >
                취소하기
              </Button>
              <Button
                type="submit"
                disabled={createPlace.isPending}
                className="w-full sm:flex-1 h-12 font-semibold bg-sky-600 text-white hover:bg-sky-700 flex items-center justify-center gap-2"
              >
                {createPlace.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {createPlace.isPending ? '장소 등록하는 중...' : '확인 및 장소 추가'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
