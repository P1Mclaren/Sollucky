import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./components/WalletProvider";
import { TestModeProvider } from "./contexts/TestModeContext";
import { DemoModeProvider } from "./contexts/DemoModeContext";
import { TestModeBanner } from "./components/TestModeBanner";
import { DemoModeBanner } from "./components/DemoModeBanner";
import { MetaTags } from "./components/MetaTags";
import Landing from "./pages/Landing";
import Profile from "./pages/Profile";
import ReferralsV4 from "./pages/ReferralsV4";
import Admin from "./pages/Admin";
import AdminV3 from "./pages/AdminV3";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import HowItWorks from "./pages/HowItWorks";
import MonthlyLottery from "./pages/MonthlyLottery";
import WeeklyLottery from "./pages/WeeklyLottery";
import DailyLottery from "./pages/DailyLottery";
import Lotteries from "./pages/Lotteries";
import WallOfFame from "./pages/WallOfFame";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <TestModeProvider>
        <DemoModeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <MetaTags />
            <BrowserRouter>
              <TestModeBanner />
              <DemoModeBanner />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/referrals" element={<ReferralsV4 />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin-v3" element={<AdminV3 />} />
                <Route path="/monthly" element={<MonthlyLottery />} />
                <Route path="/weekly" element={<WeeklyLottery />} />
                <Route path="/daily" element={<DailyLottery />} />
                <Route path="/lotteries" element={<Lotteries />} />
                <Route path="/wall-of-fame" element={<WallOfFame />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </DemoModeProvider>
      </TestModeProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
