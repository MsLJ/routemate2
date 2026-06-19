import { useEffect, useRef, useState } from 'react';

interface Place {
  id: number;
  name: string;
  latitude: number | string;
  longitude: number | string;
  category: string;
  color?: string;
}

interface GoogleMapProps {
  places: Place[];
  onPlaceClick?: (place: Place) => void;
  onMapClick?: (lat: number, lng: number, address?: string) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  drawPath?: boolean;
}

// Global state to load GMap script once
let isLoading = false;
let isLoaded = false;
let authFailed = false;
const callbacks: (() => void)[] = [];
const authFailureCallbacks: (() => void)[] = [];

if (typeof window !== 'undefined') {
  (window as any).gm_authFailure = () => {
    authFailed = true;
    authFailureCallbacks.forEach(cb => cb());
  };
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    if (window.google?.maps) {
      resolve();
      return;
    }
    if (isLoaded) {
      resolve();
      return;
    }

    callbacks.push(resolve);

    if (isLoading) return;
    isLoading = true;

    const API_KEY = apiKey || import.meta.env.VITE_FRONTEND_FORGE_API_KEY || "";
    const FORGE_BASE_URL =
      import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
      'https://forge.butterfly-effect.dev';
    const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

    const script = document.createElement('script');
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=places,geocoding,geometry,marker`;
    script.async = true;
    script.crossOrigin = 'anonymous';

    const triggerCallbacks = () => {
      isLoaded = true;
      isLoading = false;
      while (callbacks.length > 0) {
        const cb = callbacks.shift();
        if (cb) cb();
      }
    };

    script.onload = triggerCallbacks;

    script.onerror = () => {
      console.warn('Failed to load Google Maps script via Forge proxy. Trying official URL as fallback...');
      
      const fallbackScript = document.createElement('script');
      fallbackScript.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&v=weekly&libraries=places,geocoding,geometry,marker`;
      fallbackScript.async = true;
      
      fallbackScript.onload = triggerCallbacks;
      fallbackScript.onerror = () => {
        console.error('Failed to load Google Maps script from direct URL too.');
        isLoading = false;
        triggerCallbacks();
      };
      document.head.appendChild(fallbackScript);
    };

    document.head.appendChild(script);
  });
}

export function GoogleMap({
  places,
  onPlaceClick,
  onMapClick,
  center = { lat: 37.5665, lng: 126.978 },
  zoom = 13,
  height = '400px',
  drawPath = true,
}: GoogleMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasAuthError, setHasAuthError] = useState(authFailed);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const activeInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Keep callback refs stable to avoid resetting event listeners
  const onMapClickRef = useRef(onMapClick);
  const onPlaceClickRef = useRef(onPlaceClick);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    onPlaceClickRef.current = onPlaceClick;
  }, [onPlaceClick]);

  const API_KEY = 
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    import.meta.env.VITE_FRONTEND_FORGE_API_KEY ||
    "";

  // Watch global auth error callbacks
  useEffect(() => {
    const handleAuthFailure = () => {
      setHasAuthError(true);
    };
    authFailureCallbacks.push(handleAuthFailure);
    return () => {
      const idx = authFailureCallbacks.indexOf(handleAuthFailure);
      if (idx !== -1) authFailureCallbacks.splice(idx, 1);
    };
  }, []);

  // 1. Load script and initialize the Map once
  useEffect(() => {
    let active = true;

    loadGoogleMapsScript(API_KEY).then(() => {
      if (!active || !mapContainer.current) return;
      if (!window.google?.maps) {
        console.error('Google Maps library could not be initialized.');
        return;
      }

      setMapLoaded(true);

      const centerLatLng = {
        lat: parseFloat(String(center.lat)),
        lng: parseFloat(String(center.lng)),
      };

      // Customized map layout styles matching the provided minimalist light mockup exactly
      const mapStyles: google.maps.MapTypeStyle[] = [
        {
          elementType: "geometry",
          stylers: [{ color: "#FAF9FC" }]
        },
        {
          elementType: "labels.icon",
          stylers: [{ visibility: "simplified" }]
        },
        {
          elementType: "labels.text.fill",
          stylers: [{ color: "#5C5A6A" }]
        },
        {
          elementType: "labels.text.stroke",
          stylers: [{ color: "#FAF9FC" }]
        },
        {
          featureType: "poi",
          elementType: "geometry",
          stylers: [{ color: "#F3F1F7" }]
        },
        {
          featureType: "poi.park",
          elementType: "geometry.fill",
          stylers: [{ color: "#E1F1DF" }] // Pastel green park fill
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#FFFFFF" }] // Clean white roads
        },
        {
          featureType: "road",
          elementType: "geometry.stroke",
          stylers: [{ color: "#E8E6ED" }]
        },
        {
          featureType: "water",
          elementType: "geometry.fill",
          stylers: [{ color: "#8AB2FC" }] // Solid blue river/water fill matching the mockup
        }
      ];

      // Create the map only if it doesn't exist
      if (!mapInstance.current) {
        const map = new window.google.maps.Map(mapContainer.current, {
          center: centerLatLng,
          zoom: zoom,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: false,
          streetViewControl: false,
          styles: mapStyles,
        });

        mapInstance.current = map;

        // Custom pulsing GPS Blue Dot marker at slightly shifted coordinates to mimic mockup screenshots beautifully
        new window.google.maps.Marker({
          position: { lat: centerLatLng.lat - 0.0012, lng: centerLatLng.lng + 0.0018 },
          map: map,
          title: '현재 위치',
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" fill="#3B82F6" fill-opacity="0.2"/>
                <circle cx="16" cy="16" r="7" fill="#3B82F6" stroke="white" stroke-width="2.5"/>
              </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16),
          }
        });

        // Setup click listener
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          const latLng = e.latLng;
          if (!latLng) return;
          const clickedLat = latLng.lat();
          const clickedLng = latLng.lng();

          if (onMapClickRef.current) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat: clickedLat, lng: clickedLng } }, (results, status) => {
              if (onMapClickRef.current) {
                if (status === 'OK' && results?.[0]) {
                  onMapClickRef.current(clickedLat, clickedLng, results[0].formatted_address);
                } else {
                  onMapClickRef.current(clickedLat, clickedLng, undefined);
                }
              }
            });
          }
        });
      }
    });

    return () => {
      active = false;
    };
  }, []); // Only runs on mount

  // 2. Handle smooth centering when coordinates or zoom change (WITHOUT re-creating the map)
  const prevCenterRef = useRef({ lat: center.lat, lng: center.lng });
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const currentLat = parseFloat(String(center.lat));
    const currentLng = parseFloat(String(center.lng));

    // Only pan if coordinate values actually changed
    if (prevCenterRef.current.lat !== currentLat || prevCenterRef.current.lng !== currentLng) {
      map.panTo({ lat: currentLat, lng: currentLng });
      prevCenterRef.current = { lat: currentLat, lng: currentLng };
    }
  }, [center.lat, center.lng]);

  useEffect(() => {
    const map = mapInstance.current;
    if (map && zoom !== undefined) {
      map.setZoom(zoom);
    }
  }, [zoom]);

  // 3. Handle markers & path drawing when 'places' change
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Clear old polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (activeInfoWindowRef.current) {
      activeInfoWindowRef.current.close();
      activeInfoWindowRef.current = null;
    }

    const bounds = new window.google.maps.LatLngBounds();
    const pathCoordinates: google.maps.LatLngLiteral[] = [];

    places.forEach((place, index) => {
      const markerPosition = {
        lat: parseFloat(String(place.latitude)),
        lng: parseFloat(String(place.longitude)),
      };

      if (isNaN(markerPosition.lat) || isNaN(markerPosition.lng)) return;

      pathCoordinates.push(markerPosition);
      bounds.extend(markerPosition);

      const markerLabel = places.length > 1 ? String(index + 1) : undefined;

      // Beautiful customized Purple Location Pin matching mockup 2
      const purplePinSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46" fill="none">
          <path d="M19 0C8.5 0 0 8.5 0 19C0 32 19 46 19 46C19 46 38 32 38 19C38 8.5 29.5 0 19 0Z" fill="#5C36EC" stroke="white" stroke-width="1.5"/>
          <circle cx="19" cy="17" r="7" fill="white"/>
        </svg>
      `)}`;

      const marker = new window.google.maps.Marker({
        position: markerPosition,
        map: map,
        title: place.name,
        icon: {
          url: purplePinSvg,
          scaledSize: new window.google.maps.Size(32, 38),
          anchor: new window.google.maps.Point(16, 38),
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="font-family: Pretendard, sans-serif; padding: 4px; min-width: 150px;">
            <h4 style="margin: 0 0 4px 0; font-weight: 600; color: #0284c7; font-size: 14px;">${place.name}</h4>
            <p style="margin: 0; font-size: 12px; color: #64748b;">분류: ${place.category}</p>
          </div>
        `,
      });

      marker.addListener('click', () => {
        if (activeInfoWindowRef.current) {
          activeInfoWindowRef.current.close();
        }
        infoWindow.open(map, marker);
        activeInfoWindowRef.current = infoWindow;

        if (onPlaceClickRef.current) {
          onPlaceClickRef.current(place);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit map bounds automatically if multiple real places
    if (places.length > 1) {
      map.fitBounds(bounds);
      const listener = google.maps.event.addListener(map, 'bounds_changed', () => {
        if (map.getZoom()! > 16) {
          map.setZoom(16);
        }
        google.maps.event.removeListener(listener);
      });
    }

    // Connect places with a high-contrast elegant path
    if (drawPath && places.length > 1) {
      const polyline = new window.google.maps.Polyline({
        path: pathCoordinates,
        geodesic: true,
        strokeColor: '#5C36EC',
        strokeOpacity: 0.85,
        strokeWeight: 4,
        map: map,
      });
      polylineRef.current = polyline;
    }
  }, [places, mapLoaded, drawPath]);

  // SVG Fallback Map Viewport Transformation
  const getSvgCoords = (lat: number | string, lng: number | string) => {
    const numericLat = parseFloat(String(lat));
    const numericLng = parseFloat(String(lng));

    if (isNaN(numericLat) || isNaN(numericLng)) {
      return { x: 50, y: 50 };
    }

    // Coordinates bounding box for Central Seoul
    const minLat = 37.535;
    const maxLat = 37.585;
    const minLng = 126.955;
    const maxLng = 127.015;

    const x = ((numericLng - minLng) / (maxLng - minLng)) * 100;
    const y = (1 - (numericLat - minLat) / (maxLat - minLat)) * 100;

    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  const handleFallbackMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onMapClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const pctX = clickX / rect.width;
    const pctY = clickY / rect.height;

    // Convert back to Central Seoul bounds
    const minLat = 37.535;
    const maxLat = 37.585;
    const minLng = 126.955;
    const maxLng = 127.015;

    const lng = minLng + pctX * (maxLng - minLng);
    const lat = maxLat - pctY * (maxLat - minLat);

    // Call map click event with beautifully named synthetic address
    const syntheticNames = [
      '덕수궁 돌담길 부근',
      '경복궁 서측 삼거리',
      '성수 힙스터 스트리트',
      '을지로 골목 어귀 카페',
      '한남로 가득한 길목',
      '남산 소나무 숲길 주차장',
    ];
    const randomName = syntheticNames[Math.floor(Math.random() * syntheticNames.length)];
    onMapClick(lat, lng, `${randomName} (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
  };

  return (
    <div
      style={{ width: '100%', height }}
      className="rounded-3xl border border-[#ECE9FF] shadow-sm overflow-hidden bg-[#FAF9FC] relative select-none"
      id="google-map-container"
    >
      {/* 1. Official Google Map Element (rendered off screen if not ready) */}
      <div
        ref={mapContainer}
        style={{ width: '100%', height: '100%' }}
        className={mapLoaded && !hasAuthError ? "block" : "hidden"}
      />

      {/* 2. Premium SVG Stylized Interactive Fallback Map (Visible when GMap is loading/missing/fails) */}
      {(!mapLoaded || hasAuthError) && (
        <div 
          onClick={handleFallbackMapClick}
          className="absolute inset-0 w-full h-full bg-[#F5F4FB] cursor-crosshair overflow-hidden"
          title="지도를 클릭하여 방문지 핀을 새로 등록할 수 있습니다"
        >
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,#ECE9FF_1px,transparent_1px),linear-gradient(to_bottom,#ECE9FF_1px,transparent_1px)] bg-[size:32px_32px]" />

          {/* Fully stylized Seoul vector geography */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Green park zones (Namsan, Palaces) */}
            <circle cx="50" cy="65" r="14" fill="#E2F4DF" opacity="0.8" /> {/* Namsan mountain */}
            <rect x="25" y="15" width="18" height="12" rx="4" fill="#E2F4DF" opacity="0.7" /> {/* Gyeongbokgung */}
            <ellipse cx="78" cy="28" rx="8" ry="12" fill="#E2F4DF" opacity="0.6" /> {/* Dream Forest */}

            {/* Custom winding blue ribbon - Winding Han River */}
            <path 
              d="M 0 85 C 20 85, 30 74, 50 78 C 70 82, 80 88, 100 85 L 100 95 L 0 95 Z" 
              fill="#E1EDFE" 
              stroke="#B3D3FD" 
              strokeWidth="1.5" 
            />

            {/* Simulated Road network overlay for rich visual context */}
            <path d="M 0 35 L 100 35" stroke="white" strokeWidth="1.5" opacity="0.9" />
            <path d="M 40 0 L 40 100" stroke="white" strokeWidth="1.5" opacity="0.9" />
            <path d="M 25 10 L 85 90" stroke="white" strokeWidth="1" opacity="0.8" />
            <path d="M 12 90 L 90 12" stroke="white" strokeWidth="1" opacity="0.8" />

            {/* Dynamic path polyline connecting current route places */}
            {drawPath && places.length > 1 && (
              <polyline
                points={places.map(p => {
                  const coords = getSvgCoords(p.latitude, p.longitude);
                  return `${coords.x},${coords.y}`;
                }).join(' ')}
                fill="none"
                stroke="#5C36EC"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="6,4"
                className="animate-pulse"
              />
            )}
          </svg>

          {/* Render dynamic marker pins interactively mapped onto the coordinate plane! */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Pulsing My Location GPS dot (slightly offset to look real) */}
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: '46%', top: '48%' }}
            >
              <span className="flex h-5 w-5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-500 border-2 border-white shadow-md"></span>
              </span>
            </div>

            {/* Render each dynamic place location pin */}
            {places.map((place, index) => {
              const coords = getSvgCoords(place.latitude, place.longitude);
              return (
                <div
                  key={place.id || index}
                  className="absolute transform -translate-x-1/2 -translate-y-[85%] pointer-events-auto cursor-pointer animate-in fade-in-0 duration-300"
                  style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onPlaceClick) onPlaceClick(place);
                  }}
                >
                  <div className="flex flex-col items-center">
                    {/* Floating label box */}
                    <div className="bg-slate-900 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md shadow-md max-w-[120px] truncate mb-0.5">
                      {index + 1}. {place.name}
                    </div>

                    {/* Purple pin icon */}
                    <svg width="28" height="34" viewBox="0 0 38 46" fill="none">
                      <path d="M19 0C8.5 0 0 8.5 0 19C0 32 19 46 19 46C19 46 38 32 38 19C38 8.5 29.5 0 19 0Z" fill="#5C36EC" stroke="white" strokeWidth="2"/>
                      <circle cx="19" cy="17" r="7" fill="white"/>
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Guidance Tag */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full border border-[#ECE9FF] text-[10px] font-black text-[#5C36EC] shadow-sm flex items-center gap-1.5 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-[#5C36EC] animate-pulse" />
            인터랙티브 시뮬레이터 맵 모드 활성
          </div>

          <div className="absolute right-3 bottom-3 bg-slate-900/85 text-white/90 px-3 py-1.5 rounded-xl text-[9px] font-medium max-w-[170px] leading-relaxed shadow-sm pointer-events-none">
            💡 지도를 클릭하면 해당 위치에 새로운 핀 노드가 생성됩니다!
          </div>
        </div>
      )}
    </div>
  );
}
