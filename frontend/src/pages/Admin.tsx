import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, FileText, CheckCircle, Download, Search, Trash2, X, User, 
  CalendarDays, Filter, Plus, Edit2, LogOut 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { toast } from "@/hooks/use-toast";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// --- Types ---
interface UserInfo {
  user_id: string;
  full_name?: string;
  email?: string;
  total_points?: number;
  pretest_score?: number;
  posttest_score?: number;
}

interface FoodItem {
  food_id: number;
  food_name: string;
  sodium_mg: number;
  location_id: number;
  location_name?: string;
  food_image: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"dashboard" | "foods" | "locations">("dashboard");
  
  // Dashboard & User States
  const [summaryData, setSummaryData] = useState({ totalUsers: 0, avgPretest: 0, avgPosttest: 0 });
  const [genderData, setGenderData] = useState<any[]>([]);
  const [ageData, setAgeData] = useState<any[]>([]);
  const [itemAnalysisData, setItemAnalysisData] = useState<any[]>([]);
  
  // Food & Location States
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const adminId = userData.user_id;

  useEffect(() => {
    if (activeTab === "dashboard") fetchSummary();
    if (activeTab === "foods") fetchFoods();
    if (activeTab === "locations") fetchLocations();
  }, [activeTab]);

  // --- API Calls ---
  const fetchSummary = async () => {
    try {
      const res = await api.get(`/index.php?page=admin&action=summary&user_id=${adminId}`);
      if (res.data.status === "success") {
        const d = res.data.data;
        // 🌟 แมพข้อมูลจาก PHP (Snake_case) เข้าสู่ React (CamelCase)
        setSummaryData({ 
          totalUsers: d.total_users || 0, 
          avgPretest: d.avg_pretest || 0, 
          avgPosttest: d.avg_posttest || 0 
        });
        setGenderData(d.gender_data || []);
        setAgeData(d.age_data || []);
        setItemAnalysisData(d.item_analysis || []);
      }
    } catch (e) { console.error(e); }
  };

  const fetchFoods = async () => {
    try {
      const res = await api.get(`/index.php?page=admin&table=foods&user_id=${adminId}`);
      if (res.data.status === "success") setFoods(res.data.data);
    } catch (e) { toast({ title: "โหลดข้อมูลอาหารไม่สำเร็จ", variant: "destructive" }); }
  };

  const fetchLocations = async () => {
    try {
      const res = await api.get(`/index.php?page=admin&table=locations&user_id=${adminId}`);
      if (res.data.status === "success") setLocations(res.data.data);
    } catch (e) { console.error(e); }
  };

  const genderColors = ["hsl(200, 70%, 50%)", "hsl(330, 70%, 60%)", "hsl(280, 50%, 60%)", "hsl(45, 90%, 55%)"];
  const ageColors = ["hsl(155, 55%, 40%)", "hsl(155, 45%, 55%)", "hsl(40, 80%, 55%)", "hsl(25, 90%, 55%)"];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header & Tabs */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Admin Control</h1>
          <button onClick={() => navigate("/")} className="p-2 hover:bg-accent rounded-full">
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="mx-auto max-w-5xl px-4 flex gap-6 text-sm font-medium">
          <button onClick={() => setActiveTab("dashboard")} className={`pb-3 px-1 border-b-2 transition-colors ${activeTab === 'dashboard' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>Dashboard</button>
          <button onClick={() => setActiveTab("foods")} className={`pb-3 px-1 border-b-2 transition-colors ${activeTab === 'foods' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>จัดการอาหาร</button>
          <button onClick={() => setActiveTab("locations")} className={`pb-3 px-1 border-b-2 transition-colors ${activeTab === 'locations' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>สถานที่</button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-6">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* 🌟 นำ Summary Cards และ กราฟกลับมา */}
            {/* 1. สถิติโซเดียมรวม (Line Chart) */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-base font-semibold mb-4">แนวโน้มการบริโภคโซเดียมเฉลี่ย (ทุกคน)</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={sodiumTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{fontSize: 10}} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg_sodium" name="โซเดียมเฉลี่ย (mg)" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
        
            {/* 2. เปรียบเทียบ % ถูก-ผิด (Stacked Bar Chart ตามดราฟของคุณ) */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-base font-semibold mb-4">สัดส่วนข้อที่ถูก-ผิด (%)</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={overallCompare}>
                  <XAxis dataKey="test_type" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="correct_percent" name="ตอบถูก" stackId="a" fill="#22c55e" />
                  <Bar dataKey="incorrect_percent" name="ตอบผิด" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
        
            {/* 3. แบบ Pre-test รายข้อ (Pie Charts) */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-base font-semibold mb-6">วิเคราะห์ Pre-test รายข้อ (ถูก/ผิด)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="text-center">
                    <p className="text-xs font-bold mb-2">ข้อ {i}</p>
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie data={pretestPieData[`q${i}`]} dataKey="value" outerRadius={40}>
                          <Cell fill="#22c55e" /> {/* ถูก = เขียว */}
                          <Cell fill="#ef4444" /> {/* ผิด = แดง */}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 🌟 Tab จัดการอาหาร */}
        {activeTab === "foods" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">รายการอาหารทั้งหมด ({foods.length})</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg">
                <Plus className="w-4 h-4" /> เพิ่มอาหาร
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {foods.map(food => (
                <div key={food.food_id} className="glass-card p-4 rounded-2xl flex gap-4 items-center">
                  <img src={`/foods/${food.food_image}`} className="w-16 h-16 rounded-xl object-cover bg-accent" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{food.food_name}</p>
                    <p className="text-xs text-muted-foreground">{food.sodium_mg} mg | {food.location_name || 'ไม่ระบุสถานที่'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    <button className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              {foods.length === 0 && <p className="text-center text-muted-foreground py-10 col-span-2">ยังไม่มีข้อมูลอาหารในระบบ</p>}
            </div>
          </motion.div>
        )}

        {/* 🌟 Tab จัดการสถานที่ */}
        {activeTab === "locations" && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 rounded-2xl">
             <h2 className="text-lg font-bold mb-4">จัดการสถานที่บันทึกอาหาร</h2>
             <div className="space-y-3">
               {locations.map(loc => (
                 <div key={loc.location_id} className="flex justify-between items-center p-4 bg-accent/20 rounded-xl">
                   <span className="font-medium">{loc.location_name}</span>
                   <button className="text-destructive hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
                 </div>
               ))}
               {locations.length === 0 && <p className="text-center text-muted-foreground py-6">ยังไม่มีข้อมูลสถานที่</p>}
             </div>
           </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
