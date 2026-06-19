import { useLocation } from "wouter";
import { Home, Search, Map, Settings } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export function BottomNav() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // Keep nav bar visible regardless of authentication so that mockups are faithfully presented
  const navItems = [
    {
      label: "홈",
      icon: Home,
      path: "/",
    },
    {
      label: "검색",
      icon: Search,
      path: "/routes",
    },
    {
      label: "내정보",
      icon: Map,
      path: "/my",
    },
    {
      label: "환경설정",
      icon: Settings,
      path: "/settings",
    },
  ];

  return (
    <>
      {/* Spacer to prevent content from being covered by the bottom bar */}
      <div className="h-24 md:h-20 shrink-0 select-none pb-safe" />

      {/* Fixed Bottom Navigation Outer Container */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/60 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] rounded-t-[28px] max-w-lg mx-auto sm:max-w-xl md:max-w-2xl px-6 pb-safe pt-2">
        <div className="flex justify-between items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;

            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all duration-200 outline-none select-none relative group ${
                  isActive
                    ? "text-primary scale-102 font-semibold"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              >
                {/* Visual marker or pill under active item for subtle feedback */}
                {isActive && (
                  <span className="absolute top-0 w-8 h-1 rounded-full bg-primary animate-fade-in" />
                )}

                <Icon
                  className={`w-5.5 h-5.5 mb-1 transition-transform group-active:scale-90 ${
                    isActive ? "stroke-[2.25]" : "stroke-[1.75]"
                  }`}
                />
                
                <span className="text-[11px] tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
