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
