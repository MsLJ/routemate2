import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import Places from "@/pages/Places";
import AddPlace from "@/pages/AddPlace";
import Routes from "@/pages/Routes";
import RouteDetail from "@/pages/RouteDetail";
import CreateRoute from "@/pages/CreateRoute";
import MyPage from "@/pages/MyPage";
import SettingsPage from "@/pages/Settings";
import FollowRoute from "@/pages/FollowRoute";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { BottomNav } from "@/components/BottomNav";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/places"} component={Places} />
      <Route path={"/add-place"} component={AddPlace} />
      <Route path={"/routes"} component={Routes} />
      <Route path={"/route/:id"} component={RouteDetail} />
      <Route path={"/route/:id/follow"} component={FollowRoute} />
      <Route path={"/route/follow"} component={FollowRoute} />
      <Route path={"/create-route"} component={CreateRoute} />
      <Route path={"/my"} component={MyPage} />
      <Route path={"/settings"} component={SettingsPage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-250">
            <main className="flex-grow w-full relative">
              <Router />
            </main>
            <BottomNav />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
