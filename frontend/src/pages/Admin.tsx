import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, FileText, CheckCircle, Search, Trash2, X, User,
  CalendarDays, Filter, Plus, Edit2, LogOut, Pill, MapPin, UtensilsCrossed, ImageIcon, ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { toast } from "@/hooks/use-toast";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// --- UI Components (Import จากโครงสร้างโปรเจกต์ของคุณ) ---
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

// --- Types ---
interface UserInfo {
  user_id: string;
  full_name?: string;
  email?: string;
  gender?: string;
  age?: number;
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
  restaurant_id?: number;
  has_restaurant: boolean;
  food_image: string;
}

interface RestaurantItem {
  restaurant_id: number;
  restaurant_name: string;
  location_id: number; // 🌟 ต้องมีคีย์นี้เพื่อใช้ Filter กับสถานที่
}

type TabKey = "dashboard" | "foods" | "locations" | "herbs" | "users";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const adminId = userData.user_id;

  // ===== Dashboard State =====
  const [summaryData, setSummaryData] = useState({ totalUsers: 0, avgPretest: 0, avgPosttest: 0 });
  const [genderData, setGenderData] = useState<any[]>([]);
  const [ageData, setAgeData] = useState<any[]>([]);
  const [sodiumTrend, setSodiumTrend] = useState<any[]>([]);
  const [overallCompare, setOverallCompare] = useState<any[]>([]);
  const [pretestPieData, setPretestPieData] = useState<any>({});
  
  // User Search & Details
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [userSodiumData, setUserSodiumData] = useState<any[]>([]);
  const [userScoreData, setUserScoreData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all" | "custom">("30d");
  const [isShopOpen, setIsShopOpen] = useState(false);

  // ===== CRUD States (Forms & Dialogs) =====
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [herbs, setHerbs] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<UserInfo[]>([]);
  const [selectedLoc, setSelectedLoc] = useState<number | null>(null);
  const [selectedRes, setSelectedRes] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<"food" | "location" | "restaurant" | "herb" | "user" | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; table: string; id: any; name: string }>({ open: false, table: "", id: null, name: "" });

  // ===== Effects =====
  useEffect(() => {
    if (activeTab === "dashboard") fetchSummary();
    
    // 🌟 เพิ่ม: โหลดข้อมูลที่ต้องใช้เป็น Filter ในหน้าจัดการอาหารด้วย
    if (activeTab === "foods") {
      fetchFoods();       // โหลดรายการอาหาร
      fetchLocations();   // โหลดชื่อสถานที่มาทำ Chips
      fetchRestaurants(); // โหลดชื่อร้านอาหารมาทำ Dropdown
    }
    
    if (activeTab === "locations") { fetchLocations(); fetchRestaurants(); }
    if (activeTab === "herbs") fetchHerbs();
    if (activeTab === "users") fetchUsers();
  }, [activeTab, dateRange]);

  useEffect(() => {
    if (activeTab === "foods") fetchFoods();
  }, [selectedLoc, selectedRes]);

  // ===== API Calls (เชื่อมกับ admin.php ของคุณ) =====
  const fetchData = async (table: string, setter: Function) => {
    try {
      const res = await api.get(`/index.php?page=admin&table=${table}&action=list&user_id=${adminId}`);
      if (res.data.status === "success") {
        setter(res.data.data);
      }
    } catch (e) { 
      console.error(`Error fetching ${table}:`, e); 
    }
  };
  
  const fetchSummary = async () => {
    try {
      const res = await api.get(`/index.php?page=admin&action=summary&user_id=${adminId}&range=${dateRange}`);
      if (res.data.status === "success") {
        const d = res.data.data;
        setSummaryData({ totalUsers: d.total_users || 0, avgPretest: d.avg_pretest || 0, avgPosttest: d.avg_posttest || 0 });
        setGenderData(d.gender_data || []);
        setAgeData(d.age_data || []);
        setSodiumTrend(d.sodium_trend || []);
        setOverallCompare(d.overall_compare || []);
        setPretestPieData(d.pretest_pie_data || {});
      }
    } catch (e) { console.error(e); }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await api.get(`/index.php?page=admin&action=search_user&q=${encodeURIComponent(searchQuery)}&user_id=${adminId}`);
      if (res.data.status === "success") setSearchResults(res.data.data || []);
    } catch { toast({ title: "ค้นหาไม่สำเร็จ", variant: "destructive" }); }
  };

  const selectUser = async (user: UserInfo) => {
    setSelectedUser(user);
    setSearchResults([]);
    try {
      const res = await api.get(`/index.php?page=admin&action=user_detail&user_id=${user.user_id}`);
      if (res.data.status === "success") {
        setUserSodiumData(res.data.data.sodium_data || []);
        setUserScoreData(res.data.data.score_data || []);
      }
    } catch (e) { console.error(e); }
  };

  const fetchFoods = async () => {
    try {
      // 1. สร้าง URL พื้นฐาน
      let url = `/index.php?page=admin&table=foods&user_id=${adminId}`;
      
      // 2. ตรวจสอบว่ามีการเลือกสถานที่หรือร้านอาหารหรือไม่ แล้วเพิ่ม Query String
      if (selectedLoc) {
        url += `&location_id=${selectedLoc}`;
      }
      if (selectedRes) {
        url += `&restaurant_id=${selectedRes}`;
      }
      
      const res = await api.get(url);
      if (res.data.status === "success") {
        setFoods(res.data.data || []);
      }
    } catch { 
      toast({ title: "โหลดข้อมูลอาหารไม่สำเร็จ", variant: "destructive" }); 
    }
  };

  const fetchLocations = async () => {
    const res = await api.get(`/index.php?page=admin&table=locations&user_id=${adminId}`);
    if (res.data.status === "success") setLocations(res.data.data);
  };

  const fetchRestaurants = async () => {
    const res = await api.get(`/index.php?page=admin&table=restaurants&user_id=${adminId}`);
    if (res.data.status === "success") setRestaurants(res.data.data);
  };

  const fetchHerbs = async () => {
    const res = await api.get(`/index.php?page=admin&table=herbs&user_id=${adminId}`);
    if (res.data.status === "success") setHerbs(res.data.data);
  };

  const fetchUsers = async () => {
    const res = await api.get(`/index.php?page=admin&table=users&user_id=${adminId}`);
    if (res.data.status === "success") setUsersList(res.data.data);
  };

  // ===== Generic Handle Save & Delete =====
  const handleSave = async () => {
    // 1. ตรวจสอบข้อมูลเบื้องต้น
    if (!formData.food_name || !formData.sodium_mg || !formData.location_id) {
      toast({ title: "กรุณากรอกข้อมูลให้ครบถ้วน", variant: "destructive" });
      return;
    }
  
    const action = (formData.food_id || formData.herb_id || formData.user_id || formData.id) ? 'update' : 'create';
    const table = editMode === 'food' ? 'foods' : 
                editMode === 'herb' ? 'herbs' : 
                editMode === 'user' ? 'users' : 'locations';
    
    const id = formData.food_id || formData.herb_id || formData.user_id || formData.id;
  
    try {
      const data = new FormData();
  
      // 🌟 แยกการส่งข้อมูลตามตารางที่กำลังแก้ไข
      if (table === 'foods') {
        if (!formData.food_name || !formData.sodium_mg || !formData.location_id) {
          toast({ title: "กรุณากรอกข้อมูลอาหารให้ครบ", variant: "destructive" }); return;
        }
        const loc = locations.find(l => l.location_id === Number(formData.location_id));
        const hasRes = loc?.location_name.match(/โรงเย็น|โรงร้อน/) ? 1 : 0;
        data.append('food_name', formData.food_name);
        data.append('sodium_mg', formData.sodium_mg);
        data.append('location_id', formData.location_id);
        data.append('has_restaurant', String(hasRes));
        data.append('restaurant_id', formData.restaurant_id || 0);
        data.append('description', formData.description || '');
        if (selectedFile) data.append('food_image', selectedFile);
      } 
      else if (table === 'herbs') {
        data.append('title', formData.title);
        data.append('detail', formData.detail || '');
        data.append('warning', formData.warning || '');
        if (selectedFile) data.append('image_path', selectedFile);
      } 
      else if (table === 'users') {
        data.append('full_name', formData.full_name);
        data.append('email', formData.email); // 🌟 อย่าลืม Email
        data.append('gender', formData.gender || '');
        data.append('age', formData.age || 0);
        data.append('total_points', formData.total_points || 0);
        data.append('pretest_score', formData.pretest_score || 0);
        data.append('posttest_score', formData.posttest_score || 0);
      }
  
      const url = `/index.php?page=admin&table=${table}&action=${action}&user_id=${adminId}${id ? `&id=${id}` : ''}`;
      const res = await api.post(url, data);
      
      if (res.data.status === "success") {
        toast({ title: "สำเร็จ", description: res.data.message });
        setDialogOpen(false); setSelectedFile(null); refreshData();
      }
    } catch (e) { toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" }); }
  };

  const confirmDelete = async () => {
    const { table, id } = deleteDialog;
    try {
      const res = await api.post(`/index.php?page=admin&table=${deleteDialog.table}&action=delete&id=${deleteDialog.id}&user_id=${adminId}`);
      if (res.data.status === "success") {
        toast({ title: "ลบสำเร็จ" });
        refreshData();
      }
    } catch (e) { console.error(e); }
    setDeleteDialog({ open: false, table: "", id: null, name: "" });
  };

  const genderColors = ["hsl(200, 70%, 50%)", "hsl(330, 70%, 60%)", "hsl(45, 90%, 55%)", "hsl(0, 0%, 70%)"];
  const ageColors = ["hsl(155, 55%, 40%)", "hsl(155, 45%, 55%)", "hsl(40, 80%, 55%)", "hsl(25, 90%, 55%)"];

  // 🌟 1. เพิ่มฟังก์ชันจัดการหน้าต่างแก้ไข/เพิ่มอาหาร (ที่ขาดไป)
const openFoodCreate = () => {
  setEditMode('food');
  setFormData({});      // ล้างข้อมูลฟอร์ม
  setSelectedFile(null); // ล้างไฟล์ที่เลือกค้างไว้
  setDialogOpen(true);
};

const openFoodEdit = (food: any) => {
  setEditMode('food');
  setFormData(food);     // นำข้อมูลอาหารที่เลือกใส่ฟอร์ม
  setSelectedFile(null);
  setDialogOpen(true);
};

// 🌟 2. ปรับปรุง refreshData ให้โหลด Lookup Data สำหรับ Filter ด้วย
const refreshData = () => {
  if (activeTab === "dashboard") fetchSummary();
  
  if (activeTab === "foods") {
    fetchFoods();                        // โหลดอาหารตาม Filter
    fetchData("locations", setLocations);   // โหลดสถานที่มาทำ Chips
    fetchData("restaurants", setRestaurants); // โหลดร้านอาหารมาทำ Dropdown
  }
  
  if (activeTab === "locations") { 
    fetchData("locations", setLocations); 
    fetchData("restaurants", setRestaurants); 
  }
  if (activeTab === "herbs") fetchData("herbs", setHerbs);
  if (activeTab === "users") fetchData("users", setUsersList);
};

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header & Tabs */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Admin Control</h1>
          <button onClick={() => navigate("/")} className="p-2 hover:bg-accent rounded-full transition-colors"><LogOut className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="mx-auto max-w-5xl px-4 flex gap-4 text-sm font-medium overflow-x-auto">
          {(["dashboard", "foods", "locations", "herbs", "users"] as TabKey[]).map(key => (
            <button key={key} onClick={() => setActiveTab(key)} className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
              {key === 'dashboard' ? 'Dashboard' : key === 'foods' ? 'จัดการอาหาร' : key === 'locations' ? 'สถานที่' : key === 'herbs' ? 'สมุนไพร/ยา' : 'ผู้ใช้'}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-6">
        
        {/* ==================== DASHBOARD TAB ==================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            
            {/* กรองเวลา & ค้นหาผู้ใช้ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card rounded-2xl p-4">
                <h2 className="text-xs font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider"><Filter className="w-4 h-4" />กรองตามช่วงเวลา</h2>
                <div className="flex flex-wrap gap-2">
                  {(["7d", "30d", "90d", "all"] as const).map(v => (
                    <button key={v} onClick={() => setDateRange(v)} className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${dateRange === v ? "bg-primary text-primary-foreground shadow-md" : "bg-accent/30 text-foreground hover:bg-accent/50"}`}>
                      {v === "7d" ? "7 วัน" : v === "30d" ? "30 วัน" : v === "90d" ? "90 วัน" : "ทั้งหมด"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <h2 className="text-xs font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider"><Search className="w-4 h-4" />ค้นหาข้อมูลนักศึกษา</h2>
                <div className="flex gap-2">
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder="ค้นหาชื่อหรืออีเมล..." className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <Button size="sm" onClick={handleSearch}>ค้นหา</Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 rounded-xl border border-border bg-background shadow-lg overflow-hidden max-h-40 overflow-y-auto">
                    {searchResults.map(u => (
                      <button key={u.user_id} onClick={() => selectUser(u)} className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-accent/50 text-xs border-b border-border last:border-0">{u.full_name}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ส่วนสถิติรายบุคคล (เมื่อเลือก User) */}
            <AnimatePresence>
              {selectedUser && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  <div className="glass-card rounded-2xl p-5 border-2 border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
                      <div>
                        <h3 className="text-sm font-bold">{selectedUser.full_name}</h3>
                        <p className="text-[10px] text-muted-foreground">{selectedUser.email}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card rounded-2xl p-4">
                      <p className="text-xs font-semibold mb-4">แนวโน้มโซเดียม — {selectedUser.full_name}</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={userSodiumData}><XAxis dataKey="day" hide /><YAxis /><Tooltip /><Line type="monotone" dataKey="sodium" stroke="hsl(200, 70%, 50%)" strokeWidth={2} dot /></LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="glass-card rounded-2xl p-4">
                      <p className="text-xs font-semibold mb-4">เปรียบเทียบคะแนน Pre/Post</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={userScoreData}><XAxis dataKey="name" /><YAxis domain={[0, 10]} /><Tooltip /><Bar dataKey="score" radius={[6, 6, 0, 0]}>{userScoreData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar></BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ส่วนสรุปภาพรวม (Requirement เดิม) */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card rounded-2xl p-4 text-center">
                <Users className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-[10px] text-muted-foreground uppercase">ผู้เข้าร่วม</p>
                <p className="text-xl font-bold">{summaryData.totalUsers}</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <FileText className="w-5 h-5 mx-auto text-orange-500 mb-1" />
                <p className="text-[10px] text-muted-foreground uppercase">Pre-test เฉลี่ย</p>
                <p className="text-xl font-bold">{summaryData.avgPretest}%</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <CheckCircle className="w-5 h-5 mx-auto text-green-500 mb-1" />
                <p className="text-[10px] text-muted-foreground uppercase">Post-test เฉลี่ย</p>
                <p className="text-xl font-bold">{summaryData.avgPosttest}%</p>
              </div>
            </div>

            {/* Demographics */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-base font-semibold mb-6">ข้อมูลทั่วไป (Demographics)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">สัดส่วนเพศ</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={genderData} dataKey="value" cx="50%" cy="50%" outerRadius={60} label>
                        {genderData.map((entry, i) => {
                          let color = "hsl(0, 0%, 70%)";
                          if (entry.name === 'ชาย') color = "hsl(200, 70%, 50%)";
                          if (entry.name === 'หญิง') color = "hsl(330, 70%, 60%)";
                          if (entry.name === 'อื่นๆ') color = "hsl(45, 90%, 55%)";
                          return <Cell key={i} fill={color} />;
                        })}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">สัดส่วนช่วงอายุ</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={ageData} dataKey="value" cx="50%" cy="50%" outerRadius={60} label>
                        {ageData.map((e, i) => <Cell key={i} fill={ageColors[i % ageColors.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* กราฟแนวโน้มโซเดียมรวมทุกคน */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-base font-semibold mb-4">แนวโน้มการบริโภคโซเดียมเฉลี่ย (ทุกคน)</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={sodiumTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg_sodium" name="โซเดียมเฉลี่ย (mg)" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* เปรียบเทียบสัดส่วน ถูก-ผิด ภาพรวม */}
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

            {/* Pie Chart Pre-test รายข้อ 1-8 */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-base font-semibold mb-6">วิเคราะห์ Pre-test รายข้อ (ถูก/ผิด)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="text-center">
                    <p className="text-[10px] font-bold mb-1">ข้อ {i}</p>
                    <ResponsiveContainer width="100%" height={100}>
                      <PieChart>
                        <Pie data={pretestPieData[`q${i}`]} dataKey="value" outerRadius={35}>
                          <Cell fill="#22c55e" /> <Cell fill="#ef4444" />
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

        {/* ==================== TAB จัดการอาหาร ==================== */}
        {activeTab === "foods" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">จัดการรายการอาหาร ({foods.length})</h2>
              <Button onClick={openFoodCreate} className="gap-2 bg-primary hover:bg-primary/90 shadow-md">
                <Plus className="w-4 h-4" />เพิ่มอาหาร
              </Button>
            </div>
        
            <div className="glass-card p-6 rounded-3xl space-y-6 border-2 border-primary/5 shadow-sm relative z-30">
              {/* 🌟 รวมแถวสถานที่ให้เป็นแถวเดียวตามรูปดราฟ */}
              <div className="space-y-3">
                <Label className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">เลือกสถานที่บันทึกอาหาร</Label>
                <div className="flex flex-wrap gap-2">
                  {/* ปุ่มทั้งหมด (เปลี่ยนจาก Slate เป็น Primary) */}
                  <button
                    onClick={() => { setSelectedLoc(null); setSelectedRes(null); }}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border-2 ${
                      selectedLoc === null 
                        ? "bg-primary text-white border-primary shadow-lg scale-[1.02]" 
                        : "bg-background text-muted-foreground border-border hover:border-primary/30"
                    }`}
                  >
                    ทั้งหมด
                  </button>
              
                  {/* ปุ่มสถานที่ต่างๆ (เปลี่ยนให้เป็น Primary ทั้งหมดเมื่อเลือก) */}
                  {locations.map(loc => (
                    <button
                      key={loc.location_id}
                      onClick={() => {
                        setSelectedLoc(loc.location_id);
                        setSelectedRes(null);
                      }}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border-2 ${
                        selectedLoc === loc.location_id
                          ? "bg-primary text-white border-primary shadow-lg scale-[1.02]"
                          : "bg-background text-muted-foreground border-border hover:border-primary/30"
                      }`}
                    >
                      {loc.location_name}
                    </button>
                  ))}
                </div>
              </div>
        
              {/* 3. Dropdown ร้านอาหาร (แสดงเฉพาะเมื่อเลือก โรงเย็น หรือ โรงร้อน) */}
              <AnimatePresence>
                {selectedLoc && locations.find(l => l.location_id === Number(selectedLoc))?.location_name.match(/โรงเย็น|โรงร้อน/) && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="pt-6 border-t border-border/50 flex flex-col space-y-4 relative" // 🌟 เพิ่ม relative ตรงนี้
                  >
                    <Label className="text-sm font-bold text-primary uppercase tracking-wide">
                      เลือกร้านอาหาร
                    </Label>
            
                    <div className="relative w-full">
                      <button
                        onClick={() => setIsShopOpen(!isShopOpen)}
                        className="flex w-full items-center justify-between rounded-2xl border border-border bg-card/50 p-4 text-sm font-medium transition-all hover:bg-card/80"
                      >
                        <div className="flex items-center gap-2">
                          {selectedRes 
                            ? restaurants.find(r => Number(r.restaurant_id) === Number(selectedRes))?.restaurant_name 
                            : "-- แสดงทุกร้าน --"}
                        </div>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${isShopOpen ? "rotate-180" : ""}`} />
                      </button>
            
                      <AnimatePresence>
                        {isShopOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -10 }} 
                            /* 🌟 2. เพิ่ม z-[100] เพื่อให้มั่นใจว่าอยู่หน้าสุดเหนือทุกอย่าง */
                            className="absolute left-0 right-0 z-[100] mt-2 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
                          >
                            <div className="max-h-60 overflow-y-auto p-1 bg-white"> {/* 🌟 เพิ่ม bg-white ให้ทึบแสงป้องกันโปร่งใสเห็นพื้นหลัง */}
                              <button 
                                onClick={() => { setSelectedRes(null); setIsShopOpen(false); }}
                                className="flex w-full px-4 py-3 text-sm hover:bg-primary/10 transition-colors border-b border-border/50 text-left"
                              >
                                -- แสดงทุกร้าน --
                              </button>
                              {restaurants
                                .filter(r => Number(r.location_id) === Number(selectedLoc))
                                .map((res) => (
                                  <button 
                                    key={res.restaurant_id} 
                                    onClick={() => { 
                                      setSelectedRes(res.restaurant_id); 
                                      setIsShopOpen(false); 
                                    }} 
                                    className={`flex w-full px-4 py-3 text-sm transition-colors text-left ${
                                      Number(selectedRes) === Number(res.restaurant_id) 
                                      ? "bg-primary text-white" 
                                      : "hover:bg-primary/10"
                                    }`}
                                  >
                                    {res.restaurant_name}
                                  </button>
                                ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
        
            {/* ส่วนแสดงรายการอาหาร (Grid Cards เหมือนเดิม) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
              {foods.map(food => (
                <div key={food.food_id} className="glass-card p-4 rounded-2xl flex gap-4 items-center hover:border-primary/30 transition-all group relative overflow-hidden">
                  <img 
                    src={food.food_image ? `/foods/${food.food_image}` : "/foods/default-food.png"} 
                    className="w-16 h-16 rounded-2xl object-cover bg-accent group-hover:scale-110 transition-transform duration-300" 
                    onError={(e) => { (e.target as HTMLImageElement).src = "/foods/default-food.png" }}
                    alt="" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate pr-14">{food.food_name}</p>
                    <p className="text-xs text-primary font-black tracking-tight">{food.sodium_mg} <span className="text-[9px] text-muted-foreground font-medium uppercase">mg</span></p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-accent text-[9px] font-bold text-muted-foreground">{food.location_name}</span>
                      {food.restaurant_name && <span className="text-[9px] text-primary/60 font-bold">• {food.restaurant_name}</span>}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openFoodEdit(food)} className="p-1.5 bg-white/90 shadow-sm text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteDialog({ open: true, table: "foods", id: food.food_id, name: food.food_name })} className="p-1.5 bg-white/90 shadow-sm text-destructive rounded-lg hover:bg-destructive hover:text-white transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ==================== TAB สถานที่ ==================== */}
        {activeTab === "locations" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="glass-card p-5 rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />สถานที่บันทึกอาหาร</h2>
                <Button size="sm" onClick={() => { setEditMode('location'); setFormData({}); setDialogOpen(true); }}><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-2">
                {locations.map(loc => (
                  <div key={loc.location_id} className="flex justify-between items-center p-3 bg-accent/20 rounded-xl">
                    <span className="text-sm">{loc.location_name}</span>
                    <button onClick={() => setDeleteDialog({ open: true, type: "location", id: loc.location_id, name: loc.location_name })} className="text-destructive p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== TAB สมุนไพร/ยา ==================== */}
        {activeTab === "herbs" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">สมุนไพรและยา ({herbs.length})</h2>
              <Button onClick={() => { setEditMode('herb'); setFormData({}); setDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> เพิ่มสมุนไพร/ยา
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {herbs.map(h => (
                <div key={h.herb_id || h.med_id} className="glass-card p-4 rounded-2xl flex gap-4 items-center">
                  <img src={`/med-herb/${h.image_path}`} className="w-14 h-14 rounded-xl object-cover bg-accent" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{h.title}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{h.content?.detail}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditMode('herb'); setFormData(h); setDialogOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteDialog({ open: true, type: "herb", id: h.herb_id || h.med_id, name: h.title })} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ==================== TAB จัดการผู้ใช้ ==================== */}
        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="text-lg font-bold">จัดการข้อมูลผู้ใช้ ({usersList.length})</h2>
            <div className="space-y-2">
              {usersList.map(u => (
                <div key={u.user_id} className="glass-card p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
                    <div>
                      <p className="text-xs font-bold">{u.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">{u.email} | แต้ม: {u.total_points}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditMode('user'); setFormData(u); setDialogOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteDialog({ open: true, type: "user", id: u.user_id, name: u.full_name || "" })} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ==================== DIALOGS ==================== */}
      
      {/* 🟢 Dialog สำหรับ Create/Update (ปรับฟิลด์ให้ตรง DB) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{formData.id ? 'แก้ไข' : 'เพิ่ม'}ข้อมูล</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {editMode === 'food' && (
              <div className="space-y-4">
                {/* ชื่ออาหาร */}
                <div>
                  <Label className="text-xs font-bold text-muted-foreground">ชื่อเมนูอาหาร</Label>
                  <Input 
                    value={formData.food_name || ''} 
                    onChange={e => setFormData({...formData, food_name: e.target.value})} 
                    placeholder="เช่น ข้าวมันไก่"
                    className="rounded-xl mt-1"
                  />
                </div>
            
                {/* โซเดียม */}
                <div>
                  <Label className="text-xs font-bold text-muted-foreground">ปริมาณโซเดียม (mg)</Label>
                  <Input 
                    type="number" 
                    value={formData.sodium_mg || ''} 
                    onChange={e => setFormData({...formData, sodium_mg: e.target.value})} 
                    placeholder="0"
                    className="rounded-xl mt-1"
                  />
                </div>
            
                {/* 🌟 Dropdown เลือกสถานที่ (แทนการกรอก ID) */}
                <div>
                  <Label className="text-xs font-bold text-muted-foreground">สถานที่จำหน่าย</Label>
                  <select
                    value={formData.location_id || ""}
                    onChange={(e) => {
                      const locId = e.target.value ? Number(e.target.value) : "";
                      // เมื่อเปลี่ยนสถานที่ ให้ล้างค่าร้านอาหารเดิมทิ้งเพื่อป้องกันข้อมูลข้ามโรง
                      setFormData({ ...formData, location_id: locId, restaurant_id: "" });
                    }}
                    className="w-full p-2.5 bg-background border border-input rounded-xl text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="">-- เลือกสถานที่ --</option>
                    {locations.map(loc => (
                      <option key={loc.location_id} value={loc.location_id}>{loc.location_name}</option>
                    ))}
                  </select>
                </div>
            
                {/* 🌟 Dropdown เลือกร้านอาหาร (แสดงเฉพาะ โรงเย็น/โรงร้อน) */}
                <AnimatePresence>
                  {formData.location_id && 
                   locations.find(l => l.location_id === Number(formData.location_id))?.location_name.match(/โรงเย็น|โรงร้อน/) && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                      <Label className="text-xs font-bold text-primary">เลือกร้านอาหาร</Label>
                      <select
                        value={formData.restaurant_id || ""}
                        onChange={(e) => setFormData({ ...formData, restaurant_id: e.target.value ? Number(e.target.value) : "" })}
                        className="w-full p-2.5 bg-primary/5 border border-primary/20 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                      >
                        <option value="">-- เลือกร้านอาหาร --</option>
                        {restaurants
                          .filter(r => {
                            // 🔍 ลองใส่ console.log เพื่อเช็คข้อมูลว่ามาจริงไหม
                            // console.log("Restaurant Data:", r); 
                            return Number(r.location_id) === Number(selectedLoc); // 🌟 แปลงเป็น Number ทั้งคู่ก่อนเทียบ
                          })
                          .map(r => (
                            <option key={r.restaurant_id} value={r.restaurant_id}>{r.restaurant_name}</option>
                          ))
                        }
                      </select>
                    </motion.div>
                  )}
                </AnimatePresence>
            
                {/* อัปโหลดรูปภาพ */}
                <div>
                  <Label className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" /> รูปภาพอาหาร
                  </Label>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    className="rounded-xl mt-1 file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-2"
                  />
                  {formData.food_image && !selectedFile && (
                    <p className="text-[10px] text-muted-foreground mt-1 px-1">ไฟล์ปัจจุบัน: {formData.food_image}</p>
                  )}
                </div>
              </div>
            )}
            {editMode === 'herb' && (
              <>
                <div><Label>ชื่อสมุนไพร/ยา</Label><Input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                <div><Label>รายละเอียด</Label><Textarea value={formData.detail || ''} onChange={e => setFormData({...formData, detail: e.target.value})} /></div>
                <div><Label>คำเตือน</Label><Textarea value={formData.warning || ''} onChange={e => setFormData({...formData, warning: e.target.value})} /></div>
                <div><Label>รูปภาพ</Label><Input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} /></div>
              </>
            )}
            {editMode === 'user' && (
              <>
                <div><Label>ชื่อ-นามสกุล</Label><Input value={formData.full_name || ''} onChange={e => setFormData({...formData, full_name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>เพศ</Label><Input value={formData.gender || ''} onChange={e => setFormData({...formData, gender: e.target.value})} /></div>
                  <div><Label>อายุ</Label><Input type="number" value={formData.age || ''} onChange={e => setFormData({...formData, age: e.target.value})} /></div>
                </div>
                <div><Label>แต้มสะสม</Label><Input type="number" value={formData.total_points || ''} onChange={e => setFormData({...formData, total_points: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Pre-test Score</Label><Input type="number" value={formData.pretest_score || ''} onChange={e => setFormData({...formData, pretest_score: e.target.value})} /></div>
                  <div><Label>Post-test Score</Label><Input type="number" value={formData.posttest_score || ''} onChange={e => setFormData({...formData, posttest_score: e.target.value})} /></div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave}>บันทึกข้อมูล</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔴 AlertDialog สำหรับยืนยันการลบ (ตรงกับ admin.php) */}
      <AlertDialog open={deleteDialog.open} onOpenChange={v => !v && setDeleteDialog(d => ({ ...d, open: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle><AlertDialogDescription>คุณต้องการลบ "{deleteDialog.name}" ใช่หรือไม่?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white">ลบข้อมูล</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
