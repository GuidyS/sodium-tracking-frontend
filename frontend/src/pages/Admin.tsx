import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, FileText, CheckCircle, Search, Trash2, X, User,
  CalendarDays, Filter, Plus, Edit2, LogOut, Pill, MapPin, UtensilsCrossed
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

  // ===== CRUD States (Forms & Dialogs) =====
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [herbs, setHerbs] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<UserInfo[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<"food" | "location" | "restaurant" | "herb" | "user" | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: any; name: string }>({ open: false, type: "", id: null, name: "" });

  // ===== Effects =====
  useEffect(() => {
    if (activeTab === "dashboard") fetchSummary();
    if (activeTab === "foods") fetchFoods();
    if (activeTab === "locations") { fetchLocations(); fetchRestaurants(); }
    if (activeTab === "herbs") fetchHerbs();
    if (activeTab === "users") fetchUsers();
  }, [activeTab, dateRange]);

  // ===== API Calls (เชื่อมกับ admin.php ของคุณ) =====
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
    const res = await api.get(`/index.php?page=admin&table=foods&user_id=${adminId}`);
    if (res.data.status === "success") setFoods(res.data.data);
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
    const action = formData.id ? 'update' : 'create';
    const table = editMode === 'food' ? 'foods' : editMode === 'location' ? 'locations' : editMode === 'herb' ? 'herbs' : 'users';
    
    try {
      // ใช้ FormData กรณีมีรูปภาพ
      const body = new FormData();
      Object.keys(formData).forEach(key => body.append(key, formData[key]));
      
      const res = await api.post(`/index.php?page=admin&table=${table}&action=${action}&user_id=${adminId}`, body);
      if (res.data.status === "success") {
        toast({ title: res.data.message });
        setDialogOpen(false);
        if (activeTab === "foods") fetchFoods();
        if (activeTab === "locations") fetchLocations();
        if (activeTab === "herbs") fetchHerbs();
        if (activeTab === "users") fetchUsers();
      }
    } catch { toast({ title: "บันทึกข้อมูลไม่สำเร็จ", variant: "destructive" }); }
  };

  const confirmDelete = async () => {
    const { type, id } = deleteDialog;
    try {
      const res = await api.post(`/index.php?page=admin&table=${type === 'food' ? 'foods' : type === 'location' ? 'locations' : type === 'herb' ? 'herbs' : 'users'}&action=delete&id=${id}&user_id=${adminId}`);
      if (res.data.status === "success") {
        toast({ title: "ลบข้อมูลสำเร็จ" });
        if (activeTab === "foods") fetchFoods();
        if (activeTab === "locations") fetchLocations();
        if (activeTab === "herbs") fetchHerbs();
        if (activeTab === "users") fetchUsers();
      }
    } catch { toast({ title: "ลบไม่สำเร็จ", variant: "destructive" }); }
    setDeleteDialog({ open: false, type: "", id: null, name: "" });
  };

  const genderColors = ["hsl(200, 70%, 50%)", "hsl(330, 70%, 60%)", "hsl(45, 90%, 55%)", "hsl(0, 0%, 70%)"];
  const ageColors = ["hsl(155, 55%, 40%)", "hsl(155, 45%, 55%)", "hsl(40, 80%, 55%)", "hsl(25, 90%, 55%)"];

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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">รายการอาหาร ({foods.length})</h2>
              <Button onClick={() => { setEditMode('food'); setFormData({}); setDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> เพิ่มอาหาร
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {foods.map(food => (
                <div key={food.food_id} className="glass-card p-4 rounded-2xl flex gap-4 items-center">
                  <img src={`/foods/${food.food_image}`} className="w-14 h-14 rounded-xl object-cover bg-accent" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{food.food_name}</p>
                    <p className="text-[10px] text-muted-foreground">{food.sodium_mg} mg | {food.location_name}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditMode('food'); setFormData(food); setDialogOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteDialog({ open: true, type: "food", id: food.food_id, name: food.food_name })} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
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
      
      {/* 🟢 Dialog สำหรับ Create/Update */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{formData.id ? 'แก้ไข' : 'เพิ่ม'} {editMode === 'food' ? 'เมนูอาหาร' : editMode === 'location' ? 'สถานที่' : editMode === 'herb' ? 'สมุนไพร/ยา' : 'ผู้ใช้'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {editMode === 'food' && (
              <>
                <div><Label>ชื่ออาหาร</Label><Input value={formData.food_name || ''} onChange={e => setFormData({...formData, food_name: e.target.value})} /></div>
                <div><Label>โซเดียม (mg)</Label><Input type="number" value={formData.sodium_mg || ''} onChange={e => setFormData({...formData, sodium_mg: e.target.value})} /></div>
                <div><Label>ID สถานที่</Label><Input type="number" value={formData.location_id || ''} onChange={e => setFormData({...formData, location_id: e.target.value})} /></div>
              </>
            )}
            {editMode === 'location' && (
              <div><Label>ชื่อสถานที่</Label><Input value={formData.location_name || ''} onChange={e => setFormData({...formData, location_name: e.target.value})} /></div>
            )}
            {editMode === 'herb' && (
              <>
                <div><Label>ชื่อสมุนไพร/ยา</Label><Input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                <div><Label>รายละเอียด</Label><Textarea value={formData.detail || ''} onChange={e => setFormData({...formData, detail: e.target.value})} /></div>
                <div><Label>คำเตือน</Label><Textarea value={formData.warning || ''} onChange={e => setFormData({...formData, warning: e.target.value})} /></div>
              </>
            )}
            {editMode === 'user' && (
              <>
                <div><Label>ชื่อ-นามสกุล</Label><Input value={formData.full_name || ''} onChange={e => setFormData({...formData, full_name: e.target.value})} /></div>
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

      {/* 🔴 AlertDialog สำหรับยืนยันการลบ */}
      <AlertDialog open={deleteDialog.open} onOpenChange={v => !v && setDeleteDialog(d => ({ ...d, open: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle><AlertDialogDescription>คุณต้องการลบ "{deleteDialog.name}" ใช่หรือไม่? ข้อมูลประวัติที่เกี่ยวข้องจะถูกลบไปด้วย</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">ลบข้อมูล</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default AdminDashboard;
