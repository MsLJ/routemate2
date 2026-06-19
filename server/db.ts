import { eq, and, or, desc, asc, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  places, 
  routes, 
  routePlaces, 
  favorites, 
  saves, 
  Place, 
  Route, 
  RoutePlace,
  comments,
  commentLikes,
  follows,
  notifications,
  routeActivities
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==========================================
// In-Memory Fallback DB Store
// ==========================================
interface MockUser {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

interface MockPlace {
  id: number;
  userId: number;
  name: string;
  category: 'restaurant' | 'cafe' | 'hotplace' | 'boardgame' | 'escape' | 'popup';
  address: string | null;
  description: string | null;
  latitude: string;
  longitude: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockRoute {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  likeCount: number;
  saveCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MockRoutePlace {
  id: number;
  routeId: number;
  placeId: number;
  order: number;
  createdAt: Date;
}

interface MockFavorite {
  id: number;
  userId: number;
  routeId: number;
  createdAt: Date;
}

interface MockSave {
  id: number;
  userId: number;
  routeId: number;
  createdAt: Date;
}

interface MockComment {
  id: number;
  userId: number;
  routeId: number;
  parentId: number | null;
  content: string;
  likeCount: number;
  createdAt: Date;
}

interface MockCommentLike {
  id: number;
  userId: number;
  commentId: number;
  createdAt: Date;
}

interface MockFollow {
  id: number;
  followerId: number;
  followingId: number;
  createdAt: Date;
}

interface MockNotification {
  id: number;
  userId: number;
  senderId: number;
  type: 'comment' | 'reply' | 'follow' | 'activity';
  routeId: number | null;
  message: string;
  isRead: number; // 0 for false, 1 for true
  createdAt: Date;
}

interface MockRouteActivity {
  id: number;
  userId: number;
  routeId: number;
  verified: number; // 0 for false, 1 for true
  createdAt: Date;
}

const mockUsers: MockUser[] = [];
const mockPlaces: MockPlace[] = [];
const mockRoutes: MockRoute[] = [];
const mockRoutePlaces: MockRoutePlace[] = [];
const mockFavorites: MockFavorite[] = [];
const mockSaves: MockSave[] = [];
const mockComments: MockComment[] = [];
const mockCommentLikes: MockCommentLike[] = [];
const mockFollows: MockFollow[] = [];
const mockNotifications: MockNotification[] = [];
const mockRouteActivities: MockRouteActivity[] = [];

let userAutoId = 1;
let placeAutoId = 1;
let routeAutoId = 1;
let routePlaceAutoId = 1;
let favoriteAutoId = 1;
let saveAutoId = 1;
let commentAutoId = 1;
let commentLikeAutoId = 1;
let followAutoId = 1;
let notificationAutoId = 1;
let routeActivityAutoId = 1;

// Helper to determine region from place name/address
export function getRegionForPlace(place: { address: string | null; name: string }) {
  const addr = place.address || "";
  const name = place.name;
  const combined = (addr + " " + name).toLowerCase();
  
  if (combined.includes("인천") || combined.includes("송도") || combined.includes("월미도") || combined.includes("트라이볼") || combined.includes("아트플랫폼")) {
    return "인천";
  }
  if (combined.includes("경기") || combined.includes("용인") || combined.includes("수원") || combined.includes("가평") || combined.includes("에버랜드") || combined.includes("민속촌") || combined.includes("레일바이크") || combined.includes("스타필드")) {
    return "경기";
  }
  return "서울";
}

// Seed initial fake places and routes for a nice default experience when DB is empty!
function seedMockData() {
  // Seed 1 mock user
  const defaultUser: MockUser = {
    id: 1,
    openId: "mock_user_openid",
    name: "홍길동",
    email: "hong@example.com",
    loginMethod: "google",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date()
  };
  mockUsers.push(defaultUser);

  // Define the 12 beautiful places from the user UI design mockup
  const defaultPlacesList: Omit<MockPlace, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
    // 1. 서울
    {
      name: "빛의 시어터",
      category: "hotplace",
      address: "서울특별시 광진구 워커힐로 177 워커힐 호텔 지하 1층",
      description: "웅장한 고전 명곡과 압도적인 고화질 미디어아트가 어우러져 시공간을 초월하는 현대 미술 미디어 전시관",
      latitude: "37.555234",
      longitude: "127.110543",
    },
    {
      name: "아르떼뮤지엄",
      category: "hotplace",
      address: "서울특별시 종로구 세종대로 175",
      description: "영원한 자연의 요소를 입체 미디어와 감각적 사운드, 전용 향기로 시각화한 최고 평점 스마트 상설 미술관",
      latitude: "37.572111",
      longitude: "126.975432",
    },
    {
      name: "그라운드시소",
      category: "hotplace",
      address: "서울특별시 마포구 월드컵북로 396 번지",
      description: "감각을 자극하는 독창적인 기획 하에 인생 사진และ 고품격 예술 전시의 감동을 전하는 예술 복합 디자인 센터",
      latitude: "37.579432",
      longitude: "126.890124",
    },
    {
      name: "DDP 디자인전",
      category: "hotplace",
      address: "서울특별시 중구 을지로 281 동대문디자인플라자(DDP) 배움터",
      description: "자하 하디드 설계 은빛 나선형 우주선 공간에서 매 시즌 다르게 펼쳐지는 글로벌 럭셔리 & 현대 미술 정례 전시",
      latitude: "37.566731",
      longitude: "127.009472",
    },
    // 2. 경기
    {
      name: "에버랜드",
      category: "hotplace",
      address: "경기도 용인시 처인구 포곡읍 에버랜드로 199",
      description: "한국 최대 규모의 테마파크로 기네스급 목재 롤러코스터와 환상적인 야간 궁전 불빛 축제가 숨쉬는 곳",
      latitude: "37.293912",
      longitude: "127.202511",
    },
    {
      name: "한국민속촌",
      category: "hotplace",
      address: "경기도 용인시 기흥구 민속촌로 90",
      description: "조선시대 백성들의 생활 연출과 가옥을 원형 고증하고, 사또와 꽃거지들이 익살극을 펼치는 최고의 전통 체험촌",
      latitude: "37.258123",
      longitude: "127.119421",
    },
    {
      name: "가평 레일바이크",
      category: "hotplace",
      address: "경기도 가평군 가평읍 장터길 14 가평역사",
      description: "사랑하는 사람들과 직접 페달을 밟으며 북한강 위 높다란 철교와 메타세쿼이아 아름드리 숲터널을 관람하는 시원한 스포츠",
      latitude: "37.831542",
      longitude: "127.510341",
    },
    {
      name: "수원 스타필드",
      category: "hotplace",
      address: "경기도 수원시 장안구 수성로 175 스타필드 수원점",
      description: "웅장한 고층 아치형 유리 천장을 수놓은 별마당 도서관과 미쉐린급 트렌디 푸드코트가 합쳐진 복합 명품 아울렛",
      latitude: "37.289123",
      longitude: "126.988542",
    },
    // 3. 인천
    {
      name: "송도 트라이볼",
      category: "hotplace",
      address: "인천광역시 연수구 인천타워대로 250 센트럴파크 공원 내부",
      description: "서해의 바다 거품과 선박 세 개를 오목한 물그릇 디자인으로 빚어낸 송도 국제도시를 상징하는 우주선 뷰 예술 디자인관",
      latitude: "37.398542",
      longitude: "126.632512",
    },
    {
      name: "인천 대공원",
      category: "hotplace",
      address: "인천광역시 남동구 무네미로 236",
      description: "아름다운 단풍철 숲길 터널과 조용하게 일렁이는 호수원, 동물원과 테라스 산책을 동시에 누리는 인천 최대 친환경 공원",
      latitude: "37.447812",
      longitude: "126.756412",
    },
    {
      name: "아트플랫폼",
      category: "hotplace",
      address: "인천광역시 중구 제물량로218번길 3 인천개항장 거리",
      description: "백년 역사의 붉은 옛 조계지 창고 벽돌 건물을 그대로 살려, 레트로 감성의 트렌디 갤러리와 공방들이 수놓인 예술창작 거리",
      latitude: "37.472512",
      longitude: "126.621412",
    },
    {
      name: "월미도 놀이기구",
      category: "hotplace",
      address: "인천광역시 중구 월미문화로 81 테마파크",
      description: "서해 낙조가 바다를 적시는 사이 짜릿한 높이의 자이로드롭과 전국구급 타가디스코 DJ의 입담을 체험하는 레전드 스팟",
      latitude: "37.475432",
      longitude: "126.598512",
    }
  ];

  // Map each object to MockPlace shape and push
  const seededPlaces = defaultPlacesList.map((dp) => {
    const p: MockPlace = {
      id: placeAutoId++,
      userId: 1, // seeded by system user so anyone can select them!
      name: dp.name,
      category: dp.category,
      address: dp.address,
      description: dp.description,
      latitude: dp.latitude,
      longitude: dp.longitude,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockPlaces.push(p);
    return p;
  });

  // Seed 3 stunning regional routes matching the image layout
  const defaultRoutesList = [
    {
      title: "서울 아트&전시 시네마틱 정주행 코스",
      description: "빛의 시어터의 찬란한 홀에서 시작해 아르떼뮤지엄의 감동 가득한 대자연 미디어를 정화하고, 그라운드시소 작가 기획전을 거쳐 DDP 디자인전으로 마치는 잊지 못할 미술 정주행 루트!",
      placeNames: ["빛의 시어터", "아르떼뮤지엄", "그라운드시소", "DDP 디자인전"],
      likeCount: 154,
      saveCount: 121
    },
    {
      title: "경기 리프레시 낭만 액티비티 투어",
      description: "용인 에버랜드에서 신나는 어트랙션을 정복하고, 경기도 민속촌에서 타임머신 역사를 느낀 후, 가평 북한강 철로 레일바이크와 수원 스타필드 별마당 도서관을 섭렵하는 특급 경기 코스",
      placeNames: ["에버랜드", "한국민속촌", "가평 레일바이크", "수원 스타필드"],
      likeCount: 188,
      saveCount: 142
    },
    {
      title: "인천 센트럴 낭만 힐링 포트 루트",
      description: "송도 트라이볼의 미래형 예술 전시로 심미안을 빛내고, 넓은 인천 대공원 호숫가를 산책한 다음, 붉은 벽돌 레트로 아트플랫폼과 월미도 시원한 선상 관람차로 영수증을 증명하는 완벽 코스!",
      placeNames: ["송도 트라이볼", "인천 대공원", "아트플랫폼", "월미도 놀이기구"],
      likeCount: 129,
      saveCount: 95
    }
  ];

  defaultRoutesList.forEach((dr) => {
    const route: MockRoute = {
      id: routeAutoId++,
      userId: 1,
      title: dr.title,
      description: dr.description,
      likeCount: dr.likeCount,
      saveCount: dr.saveCount,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockRoutes.push(route);

    // Link places via junction
    dr.placeNames.forEach((placeName, index) => {
      const match = seededPlaces.find(p => p.name.includes(placeName));
      if (match) {
        mockRoutePlaces.push({
          id: routePlaceAutoId++,
          routeId: route.id,
          placeId: match.id,
          order: index,
          createdAt: new Date()
        });
      }
    });
  });
}

// Seed mock data initially
seedMockData();

// ==========================================
// DB Functions
// ==========================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.log("[Database Fallback] upsertUser", user.openId);
    let existing = mockUsers.find(u => u.openId === user.openId);
    if (existing) {
      if (user.name !== undefined) existing.name = user.name ?? null;
      if (user.email !== undefined) existing.email = user.email ?? null;
      if (user.loginMethod !== undefined) existing.loginMethod = user.loginMethod ?? null;
      if (user.role !== undefined) existing.role = user.role ?? "user";
      existing.lastSignedIn = user.lastSignedIn ? new Date(user.lastSignedIn) : new Date();
      existing.updatedAt = new Date();
    } else {
      const newUser: MockUser = {
        id: userAutoId++,
        openId: user.openId,
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        role: (user.role as any) || (user.openId === ENV.ownerOpenId ? 'admin' : 'user'),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: user.lastSignedIn ? new Date(user.lastSignedIn) : new Date()
      };
      mockUsers.push(newUser);
    }
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.log("[Database Fallback] getUserByOpenId", openId);
    let user = mockUsers.find(u => u.openId === openId);
    if (!user) {
      // Create a default session user to bypass signin wall smoothly
      user = {
        id: userAutoId++,
        openId: openId,
        name: "손님",
        email: "guest@example.com",
        loginMethod: "local",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date()
      };
      mockUsers.push(user);
    }
    return user;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= Places Queries =============

export async function createPlace(userId: number, data: {
  name: string;
  category: 'restaurant' | 'cafe' | 'hotplace' | 'boardgame' | 'escape' | 'popup';
  address?: string;
  description?: string;
  latitude: number;
  longitude: number;
}) {
  const db = await getDb();
  if (!db) {
    console.log("[Database Fallback] createPlace", data.name);
    const newPlace: MockPlace = {
      id: placeAutoId++,
      userId,
      name: data.name,
      category: data.category,
      address: data.address ?? null,
      description: data.description ?? null,
      latitude: String(data.latitude),
      longitude: String(data.longitude),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockPlaces.push(newPlace);
    return [ { insertId: newPlace.id } ] as any;
  }

  const result = await db.insert(places).values({
    userId,
    name: data.name,
    category: data.category,
    address: data.address,
    description: data.description,
    latitude: String(data.latitude) as any,
    longitude: String(data.longitude) as any,
  });
  
  return result;
}

export async function getPlacesByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.log("[Database Fallback] getPlacesByUserId", userId);
    return mockPlaces.filter(p => p.userId === userId || p.userId === 1);
  }

  return await db.select().from(places).where(or(eq(places.userId, userId), eq(places.userId, 1)));
}

export async function getPlaceById(placeId: number) {
  const db = await getDb();
  if (!db) {
    console.log("[Database Fallback] getPlaceById", placeId);
    return mockPlaces.find(p => p.id === placeId) || null;
  }

  const result = await db.select().from(places).where(eq(places.id, placeId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getPlacesByIds(placeIds: number[]) {
  const db = await getDb();
  if (!db) {
    console.log("[Database Fallback] getPlacesByIds", placeIds);
    if (placeIds.length === 0) return [];
    return mockPlaces.filter(p => placeIds.includes(p.id));
  }

  if (placeIds.length === 0) return [];
  return await db.select().from(places).where(inArray(places.id, placeIds));
}

export async function deletePlace(placeId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.log("[Database Fallback] deletePlace", placeId, "userId", userId);
    const index = mockPlaces.findIndex(p => p.id === placeId && p.userId === userId);
    if (index !== -1) {
      mockPlaces.splice(index, 1);
    }
    return { affectedRows: 1 };
  }

  return await db.delete(places).where(and(eq(places.id, placeId), eq(places.userId, userId)));
}

// ============= Routes Queries =============

export async function createRoute(userId: number, data: {
  title: string;
  description?: string;
  placeIds: number[];
}) {
  const db = await getDb();
  if (!db) {
    console.log("[Database Fallback] createRoute", data.title);
    const newRoute: MockRoute = {
      id: routeAutoId++,
      userId,
      title: data.title,
      description: data.description ?? null,
      likeCount: 0,
      saveCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockRoutes.push(newRoute);

    if (data.placeIds && data.placeIds.length > 0) {
      data.placeIds.forEach((placeId, index) => {
        mockRoutePlaces.push({
          id: routePlaceAutoId++,
          routeId: newRoute.id,
          placeId,
          order: index,
          createdAt: new Date()
        });
      });
    }
    return newRoute.id;
  }

  // Create route
  const routeResult = await db.insert(routes).values({
    userId,
    title: data.title,
    description: data.description,
  });

  const routeId = routeResult[0].insertId as number;

  // Create route-place associations
  if (data.placeIds.length > 0) {
    const routePlaceValues = data.placeIds.map((placeId, index) => ({
      routeId: routeId as number,
      placeId,
      order: index,
    }));
    await db.insert(routePlaces).values(routePlaceValues);
  }

  return routeId;
}

export async function getRouteById(routeId: number) {
  const db = await getDb();
  if (!db) {
    console.log("[Database Fallback] getRouteById", routeId);
    const route = mockRoutes.find(r => r.id === routeId);
    if (!route) return null;

    const routePlaceRecords = mockRoutePlaces.filter(rp => rp.routeId === routeId);
    routePlaceRecords.sort((a, b) => a.order - b.order);
    const placeIds = routePlaceRecords.map(rp => rp.placeId);
    const placesData = placeIds.length > 0 ? await getPlacesByIds(placeIds) : [];
    
    // Ensure accurate placement ordering
    const sortedPlaces = routePlaceRecords.map(rp => placesData.find(p => p.id === rp.placeId)).filter((p): p is MockPlace => !!p);
    const author = mockUsers.find(u => u.id === route.userId) || { id: route.userId, name: `사용자_${route.userId}`, email: "", role: "user" as const };

    return {
      ...route,
      places: sortedPlaces,
      author,
    };
  }

  const route = await db.select().from(routes).where(eq(routes.id, routeId)).limit(1);
  if (route.length === 0) return null;

  const routePlaceRecords = await db.select().from(routePlaces).where(eq(routePlaces.routeId, routeId));
  // Sort in JS or use query ordering if database, order should be respected
  routePlaceRecords.sort((a, b) => a.order - b.order);
  const placeIds = routePlaceRecords.map(rp => rp.placeId);
  const placesData = placeIds.length > 0 ? await getPlacesByIds(placeIds) : [];
  
  const sortedPlaces = routePlaceRecords.map(rp => placesData.find(p => p.id === rp.placeId)).filter((p): p is Place => !!p);
  
  const authorRecord = await db.select().from(users).where(eq(users.id, route[0].userId)).limit(1);
  const author = authorRecord[0] || { id: route[0].userId, name: `사용자_${route[0].userId}`, email: "", role: "user" as const };

  return {
    ...route[0],
    places: sortedPlaces,
    author,
  };
}

export async function getAllRoutes(sortBy: 'popular' | 'recent' = 'recent', limit = 20, offset = 0, region?: string, search?: string) {
  const db = await getDb();
  if (!db) {
    console.log("[Database Fallback] getAllRoutes", sortBy, "region", region, "search", search);
    const sorted = [...mockRoutes];
    if (sortBy === 'popular') {
      sorted.sort((a, b) => b.likeCount - a.likeCount);
    } else {
      sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const allRoutesWithPlaces = await Promise.all(
      sorted.map(async (route) => {
        const routePlaceRecords = mockRoutePlaces.filter(rp => rp.routeId === route.id);
        routePlaceRecords.sort((a, b) => a.order - b.order);
        const placeIds = routePlaceRecords.map(rp => rp.placeId);
        const placesData = placeIds.length > 0 ? await getPlacesByIds(placeIds) : [];
        const sortedPlaces = routePlaceRecords.map(rp => placesData.find(p => p.id === rp.placeId)).filter((p): p is MockPlace => !!p);
        
        let authorName = "홍길동";
        const author = mockUsers.find(u => u.id === route.userId);
        if (author) {
          authorName = author.name;
        }

        return {
          ...route,
          places: sortedPlaces,
          authorName,
        };
      })
    );

    let filtered = allRoutesWithPlaces;
    if (region && region !== "전체") {
      filtered = filtered.filter(route => {
        const matchesRegionText = 
          route.title.toLowerCase().includes(region.toLowerCase()) || 
          (route.description && route.description.toLowerCase().includes(region.toLowerCase()));
          
        const hasRegionPlace = route.places && route.places.some(p => getRegionForPlace(p) === region);
        return matchesRegionText || hasRegionPlace;
      });
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(route => {
        const matchesText = 
          route.title.toLowerCase().includes(q) || 
          (route.description && route.description.toLowerCase().includes(q));
          
        const hasMatchingPlace = route.places && route.places.some(p => {
          const nameMatch = p.name.toLowerCase().includes(q);
          const addrMatch = p.address && p.address.toLowerCase().includes(q);
          return nameMatch || addrMatch;
        });
        return matchesText || hasMatchingPlace;
      });
    }

    return filtered.slice(offset, offset + limit);
  }

  const orderBy = sortBy === 'popular' ? desc(routes.likeCount) : desc(routes.createdAt);
  
  const routeList = await db.select().from(routes).orderBy(orderBy);
  const routesWithPlaces = await Promise.all(
    routeList.map(async (route) => {
      const routePlaceRecords = await db.select().from(routePlaces).where(eq(routePlaces.routeId, route.id));
      routePlaceRecords.sort((a, b) => a.order - b.order);
      const placeIds = routePlaceRecords.map(rp => rp.placeId);
      const placesData = placeIds.length > 0 ? await getPlacesByIds(placeIds) : [];
      const sortedPlaces = routePlaceRecords.map(rp => placesData.find(p => p.id === rp.placeId)).filter((p): p is Place => !!p);
      
      let authorName = "홍길동";
      const u = await db.select().from(users).where(eq(users.id, route.userId)).limit(1);
      if (u && u.length > 0) {
        authorName = u[0].name;
      }

      return {
        ...route,
        places: sortedPlaces,
        authorName,
      };
    })
  );

  let filtered = routesWithPlaces;
  if (region && region !== "전체") {
    filtered = filtered.filter(route => {
      const matchesRegionText = 
        route.title.toLowerCase().includes(region.toLowerCase()) || 
        (route.description && route.description.toLowerCase().includes(region.toLowerCase()));
        
      const hasRegionPlace = route.places && route.places.some(p => getRegionForPlace(p) === region);
      return matchesRegionText || hasRegionPlace;
    });
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(route => {
      const matchesText = 
        route.title.toLowerCase().includes(q) || 
        (route.description && route.description.toLowerCase().includes(q));
        
      const hasMatchingPlace = route.places && route.places.some(p => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const addrMatch = p.address && p.address.toLowerCase().includes(q);
        return nameMatch || addrMatch;
      });
      return matchesText || hasMatchingPlace;
    });
  }

  return filtered.slice(offset, offset + limit);
}

export async function getRoutesByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.log("[Database Fallback] getRoutesByUserId", userId);
    const userRoutes = mockRoutes.filter(r => r.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return await Promise.all(
      userRoutes.map(async (route) => {
        const routePlaceRecords = mockRoutePlaces.filter(rp => rp.routeId === route.id);
        routePlaceRecords.sort((a, b) => a.order - b.order);
        const placeIds = routePlaceRecords.map(rp => rp.placeId);
        const placesData = placeIds.length > 0 ? await getPlacesByIds(placeIds) : [];
        const sortedPlaces = routePlaceRecords.map(rp => placesData.find(p => p.id === rp.placeId)).filter((p): p is MockPlace => !!p);
        return {
          ...route,
          places: sortedPlaces,
        };
      })
    );
  }

  const userRoutes = await db.select().from(routes).where(eq(routes.userId, userId)).orderBy(desc(routes.createdAt));

  const routesWithPlaces = await Promise.all(
    userRoutes.map(async (route) => {
      const routePlaceRecords = await db.select().from(routePlaces).where(eq(routePlaces.routeId, route.id));
      routePlaceRecords.sort((a, b) => a.order - b.order);
      const placeIds = routePlaceRecords.map(rp => rp.placeId);
      const placesData = placeIds.length > 0 ? await getPlacesByIds(placeIds) : [];
      const sortedPlaces = routePlaceRecords.map(rp => placesData.find(p => p.id === rp.placeId)).filter((p): p is Place => !!p);
      return {
        ...route,
        places: sortedPlaces,
      };
    })
  );

  return routesWithPlaces;
}

export async function deleteRoute(routeId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.log("[Database Fallback] deleteRoute", routeId, "userId", userId);
    const index = mockRoutes.findIndex(r => r.id === routeId && r.userId === userId);
    if (index !== -1) {
      mockRoutes.splice(index, 1);
    }
    // Deep clear route places entries too
    let rpIdx;
    while ((rpIdx = mockRoutePlaces.findIndex(rp => rp.routeId === routeId)) !== -1) {
      mockRoutePlaces.splice(rpIdx, 1);
    }
    let favIdx;
    while ((favIdx = mockFavorites.findIndex(fav => fav.routeId === routeId)) !== -1) {
      mockFavorites.splice(favIdx, 1);
    }
    let savIdx;
    while ((savIdx = mockSaves.findIndex(s => s.routeId === routeId)) !== -1) {
      mockSaves.splice(savIdx, 1);
    }
    return { affectedRows: 1 };
  }

  // Delete route-place associations
  await db.delete(routePlaces).where(eq(routePlaces.routeId, routeId));
  
  // Delete favorites and saves
  await db.delete(favorites).where(eq(favorites.routeId, routeId));
  await db.delete(saves).where(eq(saves.routeId, routeId));

  // Delete route
  return await db.delete(routes).where(and(eq(routes.id, routeId), eq(routes.userId, userId)));
}

// ============= Favorites Queries =============

export async function toggleFavorite(userId: number, routeId: number) {
  const db = await getDb();
  if (!db) {
    console.log("[Database Fallback] toggleFavorite", "user", userId, "route", routeId);
    const existingIndex = mockFavorites.findIndex(fav => fav.userId === userId && fav.routeId === routeId);
    const route = mockRoutes.find(r => r.id === routeId);

    if (existingIndex !== -1) {
      mockFavorites.splice(existingIndex, 1);
      if (route) {
        route.likeCount = Math.max(0, route.likeCount - 1);
      }
      return false;
    } else {
      mockFavorites.push({
        id: favoriteAutoId++,
        userId,
        routeId,
        createdAt: new Date()
      });
      if (route) {
        route.likeCount += 1;
      }
      return true;
    }
  }

  const existing = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.routeId, routeId))).limit(1);

  if (existing.length > 0) {
    // Remove favorite
    await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.routeId, routeId)));
    
    // Decrement like count
    await db.update(routes).set({ likeCount: Math.max(0, existing[0] ? 0 : 0) }).where(eq(routes.id, routeId));
    
    return false;
  } else {
    // Add favorite
    await db.insert(favorites).values({ userId, routeId });
    
    // Increment like count
    const route = await db.select().from(routes).where(eq(routes.id, routeId)).limit(1);
    if (route.length > 0) {
      await db.update(routes).set({ likeCount: route[0].likeCount + 1 }).where(eq(routes.id, routeId));
    }
    
    return true;
  }
}

export async function getFavoritesByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.log("[Database Fallback] getFavoritesByUserId", userId);
    const userFavorites = mockFavorites.filter(fav => fav.userId === userId);
    const routeIds = userFavorites.map(f => f.routeId);

    if (routeIds.length === 0) return [];

    const routeList = mockRoutes.filter(r => routeIds.includes(r.id));

    return await Promise.all(
      routeList.map(async (route) => {
        const routePlaceRecords = mockRoutePlaces.filter(rp => rp.routeId === route.id);
        routePlaceRecords.sort((a, b) => a.order - b.order);
        const placeIds = routePlaceRecords.map(rp => rp.placeId);
        const placesData = placeIds.length > 0 ? await getPlacesByIds(placeIds) : [];
        const sortedPlaces = routePlaceRecords.map(rp => placesData.find(p => p.id === rp.placeId)).filter((p): p is MockPlace => !!p);
        return {
          ...route,
          places: sortedPlaces,
        };
      })
    );
  }

  const userFavorites = await db.select().from(favorites).where(eq(favorites.userId, userId));
  const routeIds = userFavorites.map(f => f.routeId);

  if (routeIds.length === 0) return [];

  const routeList = await db.select().from(routes).where(inArray(routes.id, routeIds));

  const routesWithPlaces = await Promise.all(
    routeList.map(async (route) => {
      const routePlaceRecords = await db.select().from(routePlaces).where(eq(routePlaces.routeId, route.id));
      routePlaceRecords.sort((a, b) => a.order - b.order);
      const placeIds = routePlaceRecords.map(rp => rp.placeId);
      const placesData = placeIds.length > 0 ? await getPlacesByIds(placeIds) : [];
      const sortedPlaces = routePlaceRecords.map(rp => placesData.find(p => p.id === rp.placeId)).filter((p): p is Place => !!p);
      return {
        ...route,
        places: sortedPlaces,
      };
    })
  );

  return routesWithPlaces;
}

// ============= Saves Queries =============

export async function toggleSave(userId: number, routeId: number) {
  const db = await getDb();
  if (!db) {
    console.log("[Database Fallback] toggleSave", "user", userId, "route", routeId);
    const existingIndex = mockSaves.findIndex(s => s.userId === userId && s.routeId === routeId);
    const route = mockRoutes.find(r => r.id === routeId);

    if (existingIndex !== -1) {
      mockSaves.splice(existingIndex, 1);
      if (route) {
        route.saveCount = Math.max(0, route.saveCount - 1);
      }
      return false;
    } else {
      mockSaves.push({
        id: saveAutoId++,
        userId,
        routeId,
        createdAt: new Date()
      });
      if (route) {
        route.saveCount += 1;
      }
      return true;
    }
  }

  const existing = await db.select().from(saves).where(and(eq(saves.userId, userId), eq(saves.routeId, routeId))).limit(1);

  if (existing.length > 0) {
    // Remove save
    await db.delete(saves).where(and(eq(saves.userId, userId), eq(saves.routeId, routeId)));
    
    // Decrement save count
    const route = await db.select().from(routes).where(eq(routes.id, routeId)).limit(1);
    if (route.length > 0) {
      await db.update(routes).set({ saveCount: Math.max(0, route[0].saveCount - 1) }).where(eq(routes.id, routeId));
    }
    
    return false;
  } else {
    // Add save
    await db.insert(saves).values({ userId, routeId });
    
    // Increment save count
    const route = await db.select().from(routes).where(eq(routes.id, routeId)).limit(1);
    if (route.length > 0) {
      await db.update(routes).set({ saveCount: route[0].saveCount + 1 }).where(eq(routes.id, routeId));
    }
    
    return true;
  }
}

export async function getSavesByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.log("[Database Fallback] getSavesByUserId", userId);
    const userSaves = mockSaves.filter(s => s.userId === userId);
    const routeIds = userSaves.map(s => s.routeId);

    if (routeIds.length === 0) return [];

    const routeList = mockRoutes.filter(r => routeIds.includes(r.id));

    return await Promise.all(
      routeList.map(async (route) => {
        const routePlaceRecords = mockRoutePlaces.filter(rp => rp.routeId === route.id);
        routePlaceRecords.sort((a, b) => a.order - b.order);
        const placeIds = routePlaceRecords.map(rp => rp.placeId);
        const placesData = placeIds.length > 0 ? await getPlacesByIds(placeIds) : [];
        const sortedPlaces = routePlaceRecords.map(rp => placesData.find(p => p.id === rp.placeId)).filter((p): p is MockPlace => !!p);
        return {
          ...route,
          places: sortedPlaces,
        };
      })
    );
  }

  const userSaves = await db.select().from(saves).where(eq(saves.userId, userId));
  const routeIds = userSaves.map(s => s.routeId);

  if (routeIds.length === 0) return [];

  const routeList = await db.select().from(routes).where(inArray(routes.id, routeIds));

  const routesWithPlaces = await Promise.all(
    routeList.map(async (route) => {
      const routePlaceRecords = await db.select().from(routePlaces).where(eq(routePlaces.routeId, route.id));
      routePlaceRecords.sort((a, b) => a.order - b.order);
      const placeIds = routePlaceRecords.map(rp => rp.placeId);
      const placesData = placeIds.length > 0 ? await getPlacesByIds(placeIds) : [];
      const sortedPlaces = routePlaceRecords.map(rp => placesData.find(p => p.id === rp.placeId)).filter((p): p is Place => !!p);
      return {
        ...route,
        places: sortedPlaces,
      };
    })
  );

  return routesWithPlaces;
}

export async function isFavorited(userId: number, routeId: number) {
  const db = await getDb();
  if (!db) {
    return mockFavorites.some(fav => fav.userId === userId && fav.routeId === routeId);
  }

  const result = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.routeId, routeId))).limit(1);
  return result.length > 0;
}

export async function isSaved(userId: number, routeId: number) {
  const db = await getDb();
  if (!db) {
    return mockSaves.some(s => s.userId === userId && s.routeId === routeId);
  }

  const result = await db.select().from(saves).where(and(eq(saves.userId, userId), eq(saves.routeId, routeId))).limit(1);
  return result.length > 0;
}

// ============= Helper to get User Profile Summary =============
export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) {
    return mockUsers.find(u => u.id === userId) || { id: userId, name: `사용자_${userId}`, email: "", role: "user" as const };
  }
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] || null;
}

// ============= Notification Queries =============
export async function createNotification(userId: number, senderId: number, type: 'comment' | 'reply' | 'follow' | 'activity', message: string, routeId?: number) {
  const db = await getDb();
  if (!db) {
    const freshNotif = {
      id: notificationAutoId++,
      userId,
      senderId,
      type,
      routeId: routeId || null,
      message,
      isRead: 0,
      createdAt: new Date()
    };
    mockNotifications.push(freshNotif);
    return freshNotif;
  }
  const values = {
    userId,
    senderId,
    type,
    message,
    routeId: routeId || null,
    isRead: 0
  };
  await db.insert(notifications).values(values);
}

export async function getNotifications(userId: number) {
  const db = await getDb();
  if (!db) {
    const list = mockNotifications.filter(n => n.userId === userId);
    list.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
    return await Promise.all(list.map(async n => {
      const sender = await getUserById(n.senderId);
      return {
        ...n,
        sender: sender ? { id: sender.id, name: sender.name, email: sender.email } : { id: n.senderId, name: "알림 유저", email: "" }
      };
    }));
  }

  const list = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  return await Promise.all(list.map(async n => {
    const sender = await db.select().from(users).where(eq(users.id, n.senderId)).limit(1);
    return {
      ...n,
      sender: sender[0] ? { id: sender[0].id, name: sender[0].name, email: sender[0].email } : { id: n.senderId, name: "알림 유저", email: "" }
    };
  }));
}

export async function markNotificationAsRead(userId: number, notificationId: number) {
  const db = await getDb();
  if (!db) {
    const notif = mockNotifications.find(n => n.id === notificationId && n.userId === userId);
    if (notif) notif.isRead = 1;
    return true;
  }
  await db.update(notifications).set({ isRead: 1 }).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  return true;
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) {
    mockNotifications.forEach(n => {
      if (n.userId === userId) n.isRead = 1;
    });
    return true;
  }
  await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.userId, userId));
  return true;
}

// ============= Comment Queries =============
export async function createComment(userId: number, input: { routeId: number; parentId?: number | null; content: string }) {
  const db = await getDb();
  
  // Find Route to get route owner for notification
  let routeOwnerId: number | null = null;
  if (!db) {
    const r = mockRoutes.find(x => x.id === input.routeId);
    if (r) routeOwnerId = r.userId;
  } else {
    const r = await db.select().from(routes).where(eq(routes.id, input.routeId)).limit(1);
    if (r[0]) routeOwnerId = r[0].userId;
  }

  let parentOwnerId: number | null = null;
  if (input.parentId) {
    if (!db) {
      const parent = mockComments.find(c => c.id === input.parentId);
      if (parent) parentOwnerId = parent.userId;
    } else {
      const parent = await db.select().from(comments).where(eq(comments.id, input.parentId)).limit(1);
      if (parent[0]) parentOwnerId = parent[0].userId;
    }
  }

  if (!db) {
    const freshComment: MockComment = {
      id: commentAutoId++,
      userId,
      routeId: input.routeId,
      parentId: input.parentId || null,
      content: input.content,
      likeCount: 0,
      createdAt: new Date()
    };
    mockComments.push(freshComment);

    const sender = await getUserById(userId);
    const senderName = sender?.name || "누군가";

    // Create notifications for comment in memory
    if (input.parentId && parentOwnerId && parentOwnerId !== userId) {
      await createNotification(
        parentOwnerId,
        userId,
        'reply',
        `💬 ${senderName}님이 회원님의 댓글에 답글을 달았습니다: "${input.content.substring(0, 20)}..."`,
        input.routeId
      );
    } else if (routeOwnerId && routeOwnerId !== userId) {
      await createNotification(
        routeOwnerId,
        userId,
        'comment',
        `💬 ${senderName}님이 회원님의 여행 루트에 댓글을 작성했습니다: "${input.content.substring(0, 20)}..."`,
        input.routeId
      );
    }

    return {
      ...freshComment,
      user: sender
    };
  }

  const inserted = await db.insert(comments).values({
    userId,
    routeId: input.routeId,
    parentId: input.parentId || null,
    content: input.content,
    likeCount: 0
  });

  const insertedId = inserted[0].insertId;
  const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const senderName = userRecord[0]?.name || "구독자";

  if (input.parentId && parentOwnerId && parentOwnerId !== userId) {
    await createNotification(
      parentOwnerId,
      userId,
      'reply',
      `💬 ${senderName}님이 회원님의 댓글에 답글을 달았습니다: "${input.content.substring(0, 20)}..."`,
      input.routeId
    );
  } else if (routeOwnerId && routeOwnerId !== userId) {
    await createNotification(
      routeOwnerId,
      userId,
      'comment',
      `💬 ${senderName}님이 회원님의 여행 루트에 댓글을 작성했습니다: "${input.content.substring(0, 20)}..."`,
      input.routeId
    );
  }

  return {
    id: insertedId,
    userId,
    routeId: input.routeId,
    parentId: input.parentId || null,
    content: input.content,
    likeCount: 0,
    createdAt: new Date(),
    user: userRecord[0] || { id: userId, name: "사용자", email: "", role: "user" }
  };
}

export async function getCommentsByRouteId(routeId: number, currentUserId?: number) {
  const db = await getDb();
  if (!db) {
    const list = mockComments.filter(c => c.routeId === routeId);
    list.sort((a,b) => a.createdAt.getTime() - b.createdAt.getTime());
    return await Promise.all(list.map(async c => {
      const userObj = await getUserById(c.userId);
      const isLikedByMe = currentUserId ? mockCommentLikes.some(like => like.commentId === c.id && like.userId === currentUserId) : false;
      return {
        ...c,
        user: userObj,
        likedByMe: isLikedByMe
      };
    }));
  }

  const list = await db.select().from(comments).where(eq(comments.routeId, routeId)).orderBy(asc(comments.createdAt));
  return await Promise.all(list.map(async c => {
    const userResult = await db.select().from(users).where(eq(users.id, c.userId)).limit(1);
    const userObj = userResult[0] || { id: c.userId, name: `사용자_${c.userId}`, email: "", role: "user" };
    
    let isLikedByMe = false;
    if (currentUserId) {
      const likes = await db.select().from(commentLikes).where(and(eq(commentLikes.commentId, c.id), eq(commentLikes.userId, currentUserId))).limit(1);
      isLikedByMe = likes.length > 0;
    }

    return {
      ...c,
      user: userObj,
      likedByMe: isLikedByMe
    };
  }));
}

export async function toggleCommentLike(userId: number, commentId: number) {
  const db = await getDb();
  if (!db) {
    const existingIndex = mockCommentLikes.findIndex(like => like.commentId === commentId && like.userId === userId);
    const comment = mockComments.find(c => c.id === commentId);

    if (existingIndex !== -1) {
      mockCommentLikes.splice(existingIndex, 1);
      if (comment) {
        comment.likeCount = Math.max(0, comment.likeCount - 1);
      }
      return false; // unliked
    } else {
      mockCommentLikes.push({
        id: commentLikeAutoId++,
        userId,
        commentId,
        createdAt: new Date()
      });
      if (comment) {
        comment.likeCount += 1;
      }
      return true; // liked
    }
  }

  const existing = await db.select().from(commentLikes).where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId))).limit(1);

  if (existing.length > 0) {
    await db.delete(commentLikes).where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)));
    const commentsList = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
    if (commentsList[0]) {
      await db.update(comments).set({ likeCount: Math.max(0, commentsList[0].likeCount - 1) }).where(eq(comments.id, commentId));
    }
    return false;
  } else {
    await db.insert(commentLikes).values({ userId, commentId });
    const commentsList = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
    if (commentsList[0]) {
      await db.update(comments).set({ likeCount: commentsList[0].likeCount + 1 }).where(eq(comments.id, commentId));
    }
    return true;
  }
}

// ============= Follow Queries =============
export async function toggleFollow(followerId: number, followingId: number) {
  if (followerId === followingId) {
    throw new Error("자기 자신을 팔로우할 수 없습니다.");
  }
  const db = await getDb();
  if (!db) {
    const existingIndex = mockFollows.findIndex(f => f.followerId === followerId && f.followingId === followingId);
    const sender = await getUserById(followerId);
    const senderName = sender?.name || "새로운 팬";

    if (existingIndex !== -1) {
      mockFollows.splice(existingIndex, 1);
      return false; // unfollowed
    } else {
      mockFollows.push({
        id: followAutoId++,
        followerId,
        followingId,
        createdAt: new Date()
      });
      await createNotification(
        followingId,
        followerId,
        'follow',
        `👤 ${senderName}님이 주주님을 팔로우하기 시작했습니다!`
      );
      return true; // followed
    }
  }

  const existing = await db.select().from(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))).limit(1);
  const senderRecord = await db.select().from(users).where(eq(users.id, followerId)).limit(1);
  const senderName = senderRecord[0]?.name || "여행자";

  if (existing.length > 0) {
    await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return false;
  } else {
    await db.insert(follows).values({ followerId, followingId });
    await createNotification(
      followingId,
      followerId,
      'follow',
      `👤 ${senderName}님이 주주님을 팔로우하기 시작했습니다!`
    );
    return true;
  }
}

export async function getFollowStatus(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) {
    return mockFollows.some(f => f.followerId === followerId && f.followingId === followingId);
  }
  const result = await db.select().from(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))).limit(1);
  return result.length > 0;
}

export async function getFollowStats(userId: number) {
  const db = await getDb();
  if (!db) {
    const followers = mockFollows.filter(f => f.followingId === userId).length;
    const following = mockFollows.filter(f => f.followerId === userId).length;
    return { followers, following };
  }
  const fers = await db.select().from(follows).where(eq(follows.followingId, userId));
  const fings = await db.select().from(follows).where(eq(follows.followerId, userId));
  return {
    followers: fers.length,
    following: fings.length
  };
}

export async function getFollowingFeed(userId: number) {
  const db = await getDb();
  if (!db) {
    // get following User IDs
    const followingIds = mockFollows.filter(f => f.followerId === userId).map(f => f.followingId);
    if (followingIds.length === 0) return [];
    
    const feedRoutes = mockRoutes.filter(r => followingIds.includes(r.userId));
    feedRoutes.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());

    return await Promise.all(
      feedRoutes.map(async (route) => {
        const routePlaceRecords = mockRoutePlaces.filter(rp => rp.routeId === route.id);
        routePlaceRecords.sort((a, b) => a.order - b.order);
        const placeIds = routePlaceRecords.map(rp => rp.placeId);
        const placesData = placeIds.length > 0 ? await getPlacesByIds(placeIds) : [];
        const sortedPlaces = routePlaceRecords.map(rp => placesData.find(p => p.id === rp.placeId)).filter((p): p is MockPlace => !!p);
        const author = await getUserById(route.userId);
        return {
          ...route,
          places: sortedPlaces,
          author
        };
      })
    );
  }

  const followingRecords = await db.select().from(follows).where(eq(follows.followerId, userId));
  const followingIds = followingRecords.map(f => f.followingId);
  if (followingIds.length === 0) return [];

  const feedRoutes = await db.select().from(routes).where(inArray(routes.userId, followingIds)).orderBy(desc(routes.createdAt));

  return await Promise.all(
    feedRoutes.map(async (route) => {
      const routePlaceRecords = await db.select().from(routePlaces).where(eq(routePlaces.routeId, route.id));
      routePlaceRecords.sort((a, b) => a.order - b.order);
      const placeIds = routePlaceRecords.map(rp => rp.placeId);
      const placesData = placeIds.length > 0 ? await getPlacesByIds(placeIds) : [];
      const sortedPlaces = routePlaceRecords.map(rp => placesData.find(p => p.id === rp.placeId)).filter((p): p is Place => !!p);
      const authorResults = await db.select().from(users).where(eq(users.id, route.userId)).limit(1);
      return {
        ...route,
        places: sortedPlaces,
        author: authorResults[0] || null
      };
    })
  );
}

// ============= Route / Place Activity Queries ("이 루트 따라가봤어요" 방문 인증) =============
export async function trackRouteActivity(userId: number, routeId: number, verified: number = 0) {
  const db = await getDb();
  
  // Find route owner to notify
  let routeOwnerId: number | null = null;
  if (!db) {
    const r = mockRoutes.find(x => x.id === routeId);
    if (r) routeOwnerId = r.userId;
  } else {
    const r = await db.select().from(routes).where(eq(routes.id, routeId)).limit(1);
    if (r[0]) routeOwnerId = r[0].userId;
  }

  const sender = await getUserById(userId);
  const senderName = sender?.name || "메이트";

  if (!db) {
    const existingIndex = mockRouteActivities.findIndex(act => act.userId === userId && act.routeId === routeId);
    let item;
    if (existingIndex !== -1) {
      item = mockRouteActivities[existingIndex];
      item.verified = verified;
    } else {
      item = {
        id: routeActivityAutoId++,
        userId,
        routeId,
        verified,
        createdAt: new Date()
      };
      mockRouteActivities.push(item);

      // Create notification
      if (routeOwnerId && routeOwnerId !== userId) {
        await createNotification(
          routeOwnerId,
          userId,
          'activity',
          `🏃 ${senderName}님이 주주님의 여행 루트를 직접 따라나섰습니다! 마이 트래블 인증 완료!`,
          routeId
        );
      }
    }
    return item;
  }

  const existing = await db.select().from(routeActivities).where(and(eq(routeActivities.userId, userId), eq(routeActivities.routeId, routeId))).limit(1);

  if (existing.length > 0) {
    await db.update(routeActivities).set({ verified }).where(and(eq(routeActivities.userId, userId), eq(routeActivities.routeId, routeId)));
    return { ...existing[0], verified };
  } else {
    const inserted = await db.insert(routeActivities).values({ userId, routeId, verified });
    
    if (routeOwnerId && routeOwnerId !== userId) {
      await createNotification(
        routeOwnerId,
        userId,
        'activity',
        `🏃 ${senderName}님이 주주님의 여행 루트를 직접 따라나섰습니다! 마이 트래블 인증 완료!`,
        routeId
      );
    }

    return {
      id: inserted[0].insertId,
      userId,
      routeId,
      verified,
      createdAt: new Date()
    };
  }
}

export async function getRouteVerifyStats(routeId: number) {
  const db = await getDb();
  if (!db) {
    const activities = mockRouteActivities.filter(act => act.routeId === routeId);
    const hikersCount = activities.length;
    const verifiedCount = activities.filter(act => act.verified === 1).length;
    return { hikersCount, verifiedCount };
  }

  const list = await db.select().from(routeActivities).where(eq(routeActivities.routeId, routeId));
  return {
    hikersCount: list.length,
    verifiedCount: list.filter(act => act.verified === 1).length
  };
}

export async function getUserVerifiedStatus(userId: number, routeId: number) {
  const db = await getDb();
  if (!db) {
    const activity = mockRouteActivities.find(act => act.userId === userId && act.routeId === routeId);
    return {
      hiker: !!activity,
      verified: activity ? activity.verified === 1 : false
    };
  }
  const result = await db.select().from(routeActivities).where(and(eq(routeActivities.userId, userId), eq(routeActivities.routeId, routeId))).limit(1);
  return {
    hiker: result.length > 0,
    verified: result.length > 0 ? result[0].verified === 1 : false
  };
}
