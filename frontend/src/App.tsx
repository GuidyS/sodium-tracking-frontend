import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DailyTracking from "./pages/DailyTracking";
import WeeklyTracking from "./pages/WeeklyTracking";
import Stats from "./pages/Stats";
import FoodLog from "./pages/FoodLog";
import FoodRecommend from "./pages/FoodRecommend";
import Medicine from "./pages/Medicine";
import Points from "./pages/Points";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import Pretest from "./pages/Pretest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/splash" element={<Splash />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/daily" element={<DailyTracking />} />
          <Route path="/weekly" element={<WeeklyTracking />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/food-log" element={<FoodLog />} />
          <Route path="/food-recommend" element={<FoodRecommend />} />
          <Route path="/medicine" element={<Medicine />} />
          <Route path="/points" element={<Points />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/pretest" element={<Pretest />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;