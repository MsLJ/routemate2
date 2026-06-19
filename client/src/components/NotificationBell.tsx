import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, MessageSquare, UserPlus, Footprints, Check, MailOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/_core/hooks/useAuth";

export function NotificationBell() {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();

  const { data: notifications = [], refetch } = trpc.notifications.getAll.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 10000 : undefined, // 폴링 주기 10초 설정하여 준실시간성 반응형 확보
  });

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => refetch()
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("모든 알림을 읽음 처리했습니다.");
    }
  });

  const unreadCount = notifications.filter(n => n.isRead === 0).length;

  // 컴포넌트 외부 영역 클릭 시 닫히도록 바인드
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  const handleNotificationClick = async (notification: any) => {
    if (notification.isRead === 0) {
      await markAsReadMutation.mutateAsync(notification.id);
    }
    setIsOpen(false);

    // 알림 유형별 세부 상세 경로 매핑
    if (notification.routeId) {
      setLocation(`/route/${notification.routeId}`);
    } else if (notification.type === "follow") {
      setLocation("/my");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "comment":
      case "reply":
        return <MessageSquare className="w-4 h-4 text-sky-500" />;
      case "follow":
        return <UserPlus className="w-4 h-4 text-indigo-500" />;
      case "activity":
        return <Footprints className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative font-sans" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-all focus:outline-hidden"
        aria-label="알림 확인"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white animate-in zoom-in duration-200">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <Card className="absolute right-[-48px] xs:right-0 mt-2.5 w-[calc(100vw-36px)] xs:w-80 max-w-sm max-h-[380px] bg-white border border-slate-150 rounded-2xl shadow-xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-top-3 duration-200">
          
          {/* Header */}
          <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-800">새로운 소식</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors"
              >
                <MailOpen className="w-3 h-3" />
                모두 읽음
              </button>
            )}
          </div>

          {/* List Section */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 text-xs">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-light font-sans">
                아직 도착한 소식이 없습니다.
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 flex items-start gap-3 hover:bg-slate-50/80 cursor-pointer transition-all ${
                    notification.isRead === 0 ? "bg-indigo-50/15" : ""
                  }`}
                >
                  {/* Icon Badge */}
                  <div className="p-2 bg-slate-100/60 rounded-xl shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <p className="text-slate-700 leading-snug font-normal text-xs">
                      {notification.message}
                    </p>
                    <span className="text-[9px] text-slate-400 font-light font-mono block">
                      {new Date(notification.createdAt).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Unread circle badge */}
                  {notification.isRead === 0 && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
