import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Coins, 
  Link as LinkIcon, 
  FileText, 
  Cpu, 
  LogOut, 
  ChevronRight, 
  Check, 
  Info,
  MapPin,
  Map
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, switchable } = useTheme();

  // Load monetization settings from localStorage
  const [coupangLink, setCoupangLink] = useState("");
  const [adsenseHtml, setAdsenseHtml] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedLink = localStorage.getItem("coupang_partners_link") || "https://search.shopping.naver.com/search/all?query=에버랜드+자유이용권";
    const savedAdsense = localStorage.getItem("adsense_active_html") || localStorage.getItem("adsense_html") || "";
    setCoupangLink(savedLink);
    setAdsenseHtml(savedAdsense);
  }, []);

  const handleSaveMonetization = () => {
    setIsSaving(true);
    try {
      localStorage.setItem("coupang_partners_link", coupangLink);
      localStorage.setItem("adsense_html", adsenseHtml);
      localStorage.setItem("adsense_active_html", adsenseHtml);
      toast.success("수익성 제휴 광고 설정이 정상적으로 저장되었습니다!");
    } catch (e) {
      toast.error("설정 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      toast.success("성공적으로 로그아웃되었습니다.");
    },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950/20 text-neutral-900 dark:text-neutral-100 pb-28">
      {/* Header Panel */}
      <header className="border-b border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">환경설정</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              title="로그아웃"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card Summary */}
        <Card className="p-5 border-neutral-200/60 dark:border-neutral-800/60 shadow-xs flex items-center gap-4 bg-white dark:bg-neutral-900">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-extrabold text-lg uppercase select-none">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold truncate">{user.name || "사용자"}</h2>
            <p className="text-xs text-neutral-500 truncate mt-0.5">{user.email}</p>
          </div>
          <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-900">
            Active
          </span>
        </Card>

        {/* Display Settings / 테마 정보 */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 pl-1">화면 및 디스플레이</h3>
          <Card className="divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden bg-white dark:bg-neutral-900 border-neutral-200/60 dark:border-neutral-800/60">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                  {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-sm font-semibold select-none">다크 모드</span>
                  <p className="text-[11px] text-neutral-400">눈의 피로를 덜어주는 어두운 인터페이스</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                disabled={!switchable}
                className="gap-1.5 min-w-[80px]"
              >
                {theme === "dark" ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>켜짐</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>꺼짐</span>
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* 광고 및 수익화 파트너스 설정 (Home.tsx 와 데이터 연동) */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 pl-1">수익성 연동 및 제휴 광고</h3>
          <Card className="p-5 space-y-4 bg-white dark:bg-neutral-900 border-neutral-200/60 dark:border-neutral-800/60">
            <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200 border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold">수익 제안 & 링크 제어 센터</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-neutral-500 flex items-center gap-1.5 mb-1.5">
                  <LinkIcon className="w-3 h-3 text-amber-600" />
                  제휴 제안 링크 (쿠팡파트너스/크룩)
                </label>
                <input
                  type="text"
                  placeholder="https://link.coupang.com/a/..."
                  value={coupangLink}
                  onChange={(e) => setCoupangLink(e.target.value)}
                  className="w-full text-xs p-3 border rounded-xl border-neutral-200 dark:border-neutral-800 focus:border-amber-400 dark:focus:border-amber-500 outline-none bg-neutral-50 dark:bg-neutral-950 font-mono"
                />
                <p className="text-[10px] text-neutral-400 leading-normal mt-1">
                  * 홈화면 하단 광고 배너 클릭 시 리다이렉트될 회원님의 고유 제휴 코드를 명시하세요.
                </p>
              </div>

              <div className="pt-2">
                <label className="text-[11px] font-bold text-neutral-500 flex items-center gap-1.5 mb-1.5">
                  <FileText className="w-3 h-3 text-purple-600" />
                  구글 애드센스 / 이미지 HTML 태그
                </label>
                <textarea
                  placeholder="예: <iframe ...> 이나 구글 스냅 소스를 기입하세요"
                  rows={3}
                  value={adsenseHtml}
                  onChange={(e) => setAdsenseHtml(e.target.value)}
                  className="w-full text-xs p-3 border rounded-xl border-neutral-200 dark:border-neutral-800 focus:border-indigo-400 dark:focus:border-indigo-500 outline-none bg-neutral-50 dark:bg-neutral-950 font-mono"
                />
                <p className="text-[10px] text-neutral-400 leading-normal mt-1">
                  * HTML 코드가 완벽히 로드되는 즉시 배너 대신 해당 소스가 우선 렌더링됩니다.
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
                <Button 
                  onClick={handleSaveMonetization}
                  disabled={isSaving}
                  size="sm"
                  className="px-5 font-semibold text-xs h-9 shadow-xs"
                >
                  {isSaving ? "저장 중..." : "수익 광고 저장"}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Google Maps API 정보 / 디버깅 */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 pl-1">지도 인프라 연동</h3>
          <Card className="p-4 bg-white dark:bg-neutral-900 border-neutral-200/60 dark:border-neutral-800/60 text-xs text-neutral-500 space-y-3">
            <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200 border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold">Google Maps Status</span>
            </div>

            <div className="flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-[11px]">인프라 클라이언트 준비 상태</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60">OK</span>
            </div>

            <p className="leading-relaxed text-[11px]">
              만약 지도 상에 구글 자바스크립트 경고 (ApiProjectMapError)가 뜬다면, 구글 클라우드 콘솔에서 
              <strong> 결제 계정(Billing-account)</strong>과 <strong>Maps JavaScript API, Places API, Geocoding API</strong> 서비스 활성화 처리를 진행해야 합니다.
            </p>
          </Card>
        </div>

        {/* System & Engine Information */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 pl-1">시스템 엔진 명세</h3>
          <Card className="divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden bg-white dark:bg-neutral-900 border-neutral-200/60 dark:border-neutral-800/60">
            <div className="p-4 flex justify-between items-center text-xs">
              <span className="font-semibold text-neutral-500">애플리케이션 버전</span>
              <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">v1.2.1-stable</span>
            </div>
            <div className="p-4 flex justify-between items-center text-xs">
              <span className="font-semibold text-neutral-500">배포 타겟 컨테이너</span>
              <span className="font-mono text-neutral-600 dark:text-neutral-400">Google Cloud Run Engine</span>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
