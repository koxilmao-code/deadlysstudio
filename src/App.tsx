import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionProvider } from "@/hooks/useSession";
import StudioHome from "./pages/StudioHome";
import AdminPage from "./pages/AdminPage";
import GameReview from "./pages/GameReview";
import Jobs from "./pages/Jobs";
import GameStats from "./pages/GameStats";
import Pricing from "./pages/Pricing";
import AuthPage from "./pages/AuthPage";
import ExchangeLayout from "./pages/exchange/ExchangeLayout";
import Overview from "./pages/exchange/Overview";
import { AnalyticsView, Competitors, Trending } from "./pages/exchange/Insights";
import { ABTesting, CreativeStudio, CreatorProfile, Marketplace, Subscription } from "./pages/exchange/Commerce";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SessionProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<StudioHome />} />
            <Route path="/games/:id" element={<GameStats />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/review" element={<GameReview />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/exchange" element={<ExchangeLayout />}>
              <Route index element={<Overview />} />
              <Route path="analytics" element={<AnalyticsView mode="analytics" />} />
              <Route path="revenue" element={<AnalyticsView mode="revenue" />} />
              <Route path="performance" element={<AnalyticsView mode="performance" />} />
              <Route path="trending" element={<Trending />} />
              <Route path="competitors" element={<Competitors />} />
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="creative" element={<CreativeStudio />} />
              <Route path="ab-tests" element={<ABTesting />} />
              <Route path="subscription" element={<Subscription />} />
              <Route path="creator/:id" element={<CreatorProfile />} />
            </Route>
            <Route path="/admin/*" element={<AdminPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SessionProvider>
  </QueryClientProvider>
);

export default App;
