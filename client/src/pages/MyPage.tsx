import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/_core/hooks/useAuth';
import { LogOut, MapPin, Plus, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';

export default function MyPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    return null;
  }

  // Draw identical 8 photo cards matching "내가 올린 게시물" in the mockup
  const photoCards = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    title: '내가 올린 게시물'
  }));

  return (
    <div className="min-h-screen bg-neutral-50 sm:bg-[#F3F4F6] text-[#111827] flex flex-col items-center py-0 sm:py-6 px-0 sm:px-4 md:px-8 font-sans">
      {/* Phone/Responsive Viewport Wrapper */}
      <div className="w-full max-w-[640px] bg-white rounded-none sm:rounded-[36px] border-0 sm:border border-[#EBE8F3] shadow-none sm:shadow-2xl overflow-hidden flex flex-col p-4 sm:p-6 min-h-screen sm:min-h-[920px] pb-32">
        
        {/* Top Header: ← + "마이페이지" + notification bell */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
          <button
            type="button"
            onClick={() => setLocation('/')}
            className="p-1 hover:bg-neutral-100 rounded-full transition-colors flex items-center justify-center bg-transparent border-0 cursor-pointer text-neutral-800"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.25]" />
          </button>
          
          <h1 className="text-xl font-black text-neutral-900 tracking-tight">
            마이페이지
          </h1>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => logout()}
              className="p-1 hover:bg-red-50 text-red-500 rounded-full transition-colors bg-transparent border-0 cursor-pointer"
              title="로그아웃"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Area */}
        <div className="flex items-center gap-5 mb-6 px-1 shrink-0">
          {/* Custom drawing Female Vector Illustration SVG matching the mockup exactly */}
          <div className="w-[84px] h-[84px] rounded-full overflow-hidden bg-[#ECE9FF] shrink-0 border-2 border-white shadow-md flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Hair back */}
              <path d="M50,15 C28,15 22,35 22,55 C22,65 24,75 26,80 C26,80 20,60 25,40 C30,30 40,25 50,25 C60,25 70,30 75,40 C80,60 74,80 74,80 C76,75 78,65 78,55 C78,35 72,15 50,15 Z" fill="#23232C" />
              {/* Face */}
              <ellipse cx="50" cy="48" rx="20" ry="22" fill="#FFE2D2" />
              {/* Hair front draping */}
              <path d="M30,42 C30,32 40,24 50,24 C60,24 70,32 70,42 C70,42 72,55 72,65 C72,70 69,72 69,75 C66,60 66,48 64,44 C61,38 56,35 50,35 C44,35 39,38 36,44 C34,48 34,60 31,75 C31,72 28,70 28,65 C28,55 30,42 30,42 Z" fill="#23232C" />
              {/* Eyes */}
              <ellipse cx="44" cy="46" rx="1.5" ry="2.2" fill="#2E2D35" />
              <ellipse cx="56" cy="46" rx="1.5" ry="2.2" fill="#2E2D35" />
              {/* Eyebrows */}
              <path d="M40,41 C42,40 45,41 46,42" stroke="#2E2D35" strokeWidth="1" strokeLinecap="round" fill="none" />
              <path d="M60,41 C58,40 55,41 54,42" stroke="#2E2D35" strokeWidth="1" strokeLinecap="round" fill="none" />
              {/* Nose & Mouth */}
              <path d="M50,47 L50,51" stroke="#F1B6A2" strokeWidth="1" strokeLinecap="round" />
              <path d="M47,56 Q50,59 53,56" stroke="#E26573" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              {/* Neck */}
              <rect x="46" y="65" width="8" height="12" fill="#FFE2D2" />
              {/* Clothes */}
              <path d="M30,80 C35,74 42,72 50,72 C58,72 65,74 70,80 L70,100 L30,100 Z" fill="#5C36EC" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight leading-tight">
              {user.name || '루트메이트'}
            </h2>
            <p className="text-xs text-neutral-500 font-medium mt-1">
              일상 속 특별한 루트를 기록해요
            </p>
            
            {/* Inline Follower / Following Stats */}
            <div className="flex gap-4 mt-3 text-xs text-neutral-600 font-medium select-none">
              <span>팔로워 <strong className="text-neutral-900 font-extrabold ml-1">128</strong></span>
              <span>팔로잉 <strong className="text-neutral-900 font-extrabold ml-1">96</strong></span>
            </div>
          </div>
        </div>

        {/* Section Header: 내가 올린 사진 */}
        <h3 className="text-sm font-extrabold text-[#5C36EC] tracking-tight mb-3.5 px-1 select-none uppercase shrink-0">
          내가 올린 사진
        </h3>

        {/* 2-Column Photo/Posts Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            {photoCards.map((card) => (
              <Card 
                key={card.id} 
                className="bg-[#FAF8FF] border border-[#ECE9FF] rounded-[24px] p-6 flex flex-col items-center justify-center text-center shadow-xs cursor-pointer hover:border-[#DED5FF] hover:-translate-y-0.5 transition-all duration-200 aspect-[1.15]"
              >
                <div className="w-14 h-14 rounded-full bg-[#ECE9FF]/40 flex items-center justify-center text-[#5C36EC] mb-2.5">
                  <ImageIcon className="w-7 h-7 stroke-[1.5]" />
                </div>
                <span className="text-[13px] font-bold text-neutral-600 tracking-tight">
                  {card.title}
                </span>
              </Card>
            ))}
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-2 gap-3 mt-6 mb-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/route/follow')}
              className="h-14 border-2 border-[#5C36EC] text-[#5C36EC] hover:bg-indigo-50/50 rounded-2xl font-black text-sm tracking-tight flex items-center justify-center gap-2 select-none bg-white cursor-pointer"
            >
              <MapPin className="w-5 h-5 text-[#5C36EC] stroke-[2.25]" />
              진행중인 루트
            </Button>
            <Button
              type="button"
              onClick={() => setLocation('/create-route')}
              className="h-14 bg-[#5C36EC] hover:bg-[#4C28DC] text-white rounded-2xl font-black text-sm tracking-tight flex items-center justify-center gap-2 border-0 shadow-md cursor-pointer"
            >
              <Plus className="w-5 h-5 text-white stroke-[2.5]" />
              루트 만들기
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
