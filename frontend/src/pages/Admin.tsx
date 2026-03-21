import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, FileText, CheckCircle, Download, Search, Trash2, X, User, 
  CalendarDays, Filter, Utensils, MapPin, Plus, Edit2, Save, LogOut 
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [summaryData, setSummaryData] = useState({ totalUsers: 0, avgPretest: 0, avgPosttest: 0 });
  const [genderData, setGenderData] = useState<any[]>([]);
  const [ageData, setAgeData] = useState<any[]>([]);
  const [itemAnalysisData, setItemAnalysisData] = useState<any[]>([]);
  const [userSodiumData, setUserSodiumData] = useState<any[]>([]);
  const [userScoreData, setUserScoreData] = useState<any[]>([]);

  // Food & Location States
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Partial<FoodItem> | null>(null);

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
        setSummaryData({ totalUsers: d.total_users, avgPretest: d.avg_pretest, avgPosttest: d.avg_posttest });
        setGenderData(d.gender_data);
        setAgeData(d.age_data);
        setItemAnalysisData(d.item_analysis);
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

  const handleDeleteFood = async (id: number) => {
    if (!window.confirm("ยืนยันการลบเมนูอาหารนี้?")) return;
    try {
      const res = await api.post(`/index.php?page=admin&action=delete&table=foods&id=${id}&user_id=${adminId}`);
      if (res.data.status === "success") {
        toast({ title: "ลบสำเร็จ" });
        fetchFoods();
      }
    } catch (e) { toast({ title: "ลบไม่สำเร็จ", variant: "destructive" }); }
  };

  const handleExportCSV = async () => {
    // ลอจิกส่งออกข้อมูลเป็น CSV ง่ายๆ
    const res = await api.get(`/index.php?page=admin&table=users&user_id=${adminId}`);
    const data = res.data.data;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Pre-test,Post-test,Points\n"
      + data.map((u: any) => `${u.full_name},${u.email},${u.pretest_score},${u.posttest_score},${u.total_points}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_scores.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header & Tabs */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Admin Control</h1>
          <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-accent rounded-full">
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
            {/* ส่วนสถิติเดิมของคุณ */}
            <div className="flex justify-end">
              <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-green-700">
                <Download className="w-4 h-4" /> ส่งออกคะแนน (CSV)
              </button>
            </div>
            {/* ... (กราฟต่างๆ ที่คุณทำไว้) ... */}
          </div>
        )}

        {activeTab === "foods" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">รายการอาหารทั้งหมด</h2>
              <button onClick={() => { setEditingFood({}); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold">
                <Plus className="w-4 h-4" /> เพิ่มอาหาร
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {foods.map(food => (
                <div key={food.food_id} className="glass-card p-4 rounded-2xl flex gap-4 items-center">
                  <img src={`/foods/${food.food_image}`} className="w-16 h-16 rounded-xl object-cover bg-accent" alt={food.food_name} />
                  <div className="flex-1">
                    <p className="font-bold">{food.food_name}</p>
                    <p className="text-xs text-muted-foreground">{food.sodium_mg} mg | {food.location_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteFood(food.food_id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "locations" && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 rounded-2xl">
             <h2 className="text-lg font-bold mb-4">จัดการสถานที่บันทึกอาหาร</h2>
             {/* ตารางจัดการ Location อย่างง่าย */}
             <div className="space-y-3">
               {locations.map(loc => (
                 <div key={loc.location_id} className="flex justify-between items-center p-3 bg-accent/20 rounded-xl">
                   <span>{loc.location_name}</span>
                   <button className="text-destructive"><Trash2 className="w-4 h-4" /></button>
                 </div>
               ))}
             </div>
           </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
