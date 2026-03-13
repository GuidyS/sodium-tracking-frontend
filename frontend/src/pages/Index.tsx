// Index.tsx
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import Settings from "./Settings";
import Profile from "./Profile";
import FoodLog from "./FoodLog";
import FoodRecommend from "./FoodRecommend";
import DailyTracking from "./DailyTracking";
import WeeklyTracking from "./WeeklyTracking";
import Stats from "./Stats";
import Medicine from "./Medicine";
import Splash from "./Splash";
import Points from "./Points";

// 1. แก้ไข: Layout สำหรับจัดหน้า Auth ให้อยู่กึ่งกลางเป๊ะ
const AuthLayout = () => (
  <div className="w-full">
    <Outlet />
  </div>
);

// 2. แก้ไข: ประกาศ ProtectedRoute
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem("user");
  if (!user) return <Navigate to="/login" replace />; 
  return <>{children}</>;
};

const Index = () => {
  return (
    <Routes>
      {/* Public Routes: หน้าที่ไม่ต้อง Login */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Auth />} />
      </Route>
      <Route path="/splash" element={<Splash />} />

      {/* Protected Routes: หน้าที่ต้อง Login ก่อน */}
      <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/food-log" element={<FoodLog />} />
        <Route path="/food-recommend" element={<FoodRecommend />} />
        <Route path="/daily" element={<DailyTracking />} />
        <Route path="/weekly" element={<WeeklyTracking />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/medicine" element={<Medicine />} />
        <Route path="/points" element={<Points />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default Index;