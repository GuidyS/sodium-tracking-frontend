import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, FileText, CheckCircle, Search, Trash2, X, User,
  CalendarDays, Filter, Plus, Edit2, LogOut, Pill, MapPin, UtensilsCrossed, Image as ImageIcon, ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { toast } from "@/hooks/use-toast";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [userSodiumData, setUserSodiumData] = useState<any[]>([]);
  const [userScoreData, setUserScoreData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all" | "custom">("30d");
  const [isShopOpen, setIsShopOpen] = useState(false);

  // ===== CRUD States =====
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [herbs, setHerbs] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<UserInfo[]>([]);
  const [selectedLoc, setSelectedLoc] = useState<number | null>(null);
  const [selectedRes, setSelectedRes] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expandedLocId, setExpandedLocId] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"medicine" | "herb">("medicine");
  const [expandedMedCat, setExpandedMedCat] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<"food" | "location" | "restaurant" | "medicine" | "herb" | "user" | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; table: string; id: any; name: string }>({ open: false, table: "", id: null, name: "" });

  // ===== Effects =====
  useEffect(() => {
    if (activeTab === "dashboard") fetchSummary();
    if (activeTab === "foods") { fetchFoods(); fetchLocations(); fetchRestaurants(); }
    if (activeTab === "locations") { fetchLocations(); fetchRestaurants(); }
    if (activeTab === "herbs") { fetchData("medicines", setMedicines); fetchData("herbs", setHerbs); }
    if (activeTab === "users") fetchUsers();
  }, [activeTab, dateRange]);

  useEffect(() => {
    if (activeTab === "foods") fetchFoods();
  }, [selectedLoc, selectedRes]);

  // ===== API Calls =====
  const fetchData = async (table: string, setter: Function) => {
    try {
      const res = await api.get(`/index.php?page=admin&table=${table}&action=list&user_id=${adminId}`);
      if (res.data.status === "success") setter(res.data.data);
    } catch (e) { console.error(e); }
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
      let url = `/index.php?page=admin&table=foods&user_id=${adminId}`;
      if (selectedLoc) url += `&location_id=${selectedLoc}`;
      if (selectedRes) url += `&restaurant_id=${selectedRes}`;
      const res = await api.get(url);
      if (res.data.status === "success") setFoods(res.data.data || []);
    } catch { toast({ title: "โหลดข้อมูลอาหารไม่สำเร็จ", variant: "destructive" }); }
  };

  const fetchLocations = () => fetchData("locations", setLocations);
  const fetchRestaurants = () => fetchData("restaurants", setRestaurants);
  const fetchHerbs = () => fetchData("herbs", setHerbs);
  const fetchUsers = () => fetchData("users", setUsersList);

  const refreshData = () => {
    if (activeTab === "dashboard") fetchSummary();
    if (activeTab === "foods") { fetchFoods(); fetchLocations(); fetchRestaurants(); }
    if (activeTab === "locations") { fetchLocations(); fetchRestaurants(); }
    if (activeTab === "herbs") { fetchData("medicines", setMedicines); fetchData("herbs", setHerbs); }
    if (activeTab === "users") fetchUsers();
  };

  // ===== Handlers =====
  const openFoodCreate = () => { setEditMode('food'); setFormData({}); setSelectedFile(null); setDialogOpen(true); };
  const openFoodEdit = (food: any) => { setEditMode('food'); setFormData(food); setSelectedFile(null); setDialogOpen(true); };

  const openEditMedHerb = (item: any, mode: 'medicine' | 'herb') => {
    setEditMode(mode);
    let contentObj = { detail: '', warning: '' };
    try {
      const rawContent = item.content;
      contentObj = typeof rawContent === 'string' ? JSON.parse(rawContent) : (rawContent || contentObj);
    } catch (e) { console.error(e); }
    setFormData({ ...item, detail: contentObj.detail || '', warning: contentObj.warning || '' });
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const table = editMode === 'food' ? 'foods' : 
                  editMode === 'medicine' ? 'medicines' : 
                  editMode === 'herb' ? 'herbs' : 
                  editMode === 'user' ? 'users' : 
                  editMode === 'location' ? 'locations' : 'restaurants';

    const id = formData.food_id || formData.med_id || formData.herb_id || formData.user_id || formData.location_id || formData.restaurant_id || formData.id;
    const action = id ? 'update' : 'create';

    try {
      const data = new FormData();
      if (table === 'foods') {
        if (!formData.food_name || !formData.sodium_mg || !formData.location_id) {
          toast({ title: "กรุณากรอกข้อมูลให้ครบถ้วน", variant: "destructive" }); return;
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
      else if (table === 'medicines' || table === 'herbs') {
        if (!formData.title) { toast({ title: "กรุณากรอกชื่อรายการ", variant: "destructive" }); return; }
        if (table === 'medicines' && !formData.med_category) { toast({ title: "กรุณาเลือกหมวดหมู่ยา", variant: "destructive" }); return; }
        data.append('title', formData.title);
        data.append('detail', formData.detail || '');
        data.append('warning', formData.warning || '');
        if (table === 'medicines') data.append('med_category', formData.med_category);
        if (selectedFile) data.append('image_path', selectedFile);
      }
      else if (table === 'users') {
        data.append('full_name', formData.full_name);
        data.append('email', formData.email);
        data.append('gender', formData.gender || '');
        data.append('age', formData.age || 0);
        data.append('total_points', formData.total_points || 0);
        data.append('pretest_score', formData.pretest_score || 0);
        data.append('posttest_score', formData.posttest_score || 0);
      }
      else if (table === 'locations') data.append('location_name', formData.location_name);
      else if (table === 'restaurants') {
        data.append('restaurant_name', formData.restaurant_name);
        data.append('location_id', formData.location_id);
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
    try {
      const res = await api.post(`/index.php?page=admin&table=${deleteDialog.table}&action=delete&id=${deleteDialog.id}&user_id=${adminId}`);
      if (res.data.status === "success") { toast({ title: "ลบสำเร็จ" }); refreshData(); }
    } catch (e) { console.error(e); }
    setDeleteDialog({ open: false, table: "", id: null, name: "" });
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
        {activeTab === "dashboard" && (
          <div className="space-y-6">
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

            {/* Dashboard Charts (Recharts) */}
            <AnimatePresence>
              {selectedUser && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  <div className="glass-card rounded-2xl p-5 border-2 border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
                      <div><h3 className="text-sm font-bold">{selectedUser.full_name}</h3><p className="text-[10px] text-muted-foreground">{selectedUser.email}</p></div>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card rounded-2xl p-4">
                      <p className="text-xs font-semibold mb-4">แนวโน้มโซเดียม — {selectedUser.full_name}</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={userSodiumData}><XAxis dataKey="day" hide /><YAxis /><Tooltip /><Line type="monotone" dataKey="sodium" stroke="#3b82f6" strokeWidth={2} dot /></LineChart>
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
          </div>
        )}

        {activeTab === "foods" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">จัดการรายการอาหาร ({foods.length})</h2>
              <Button onClick={openFoodCreate} className="gap-2 bg-primary hover:bg-primary/90 shadow-md">
                <Plus className="w-4 h-4" />เพิ่มอาหาร
              </Button>
            </div>
            
            <div className="glass-card p-6 rounded-3xl space-y-6 border-2 border-primary/5 shadow-sm relative z-30">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">เลือกสถานที่บันทึกอาหาร</Label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { setSelectedLoc(null); setSelectedRes(null); }} className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border-2 ${selectedLoc === null ? "bg-primary text-white border-primary shadow-lg scale-[1.02]" : "bg-background text-muted-foreground border-border hover:border-primary/30"}`}>ทั้งหมด</button>
                  {locations.map(loc => (
                    <button key={loc.location_id} onClick={() => { setSelectedLoc(loc.location_id); setSelectedRes(null); }} className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border-2 ${selectedLoc === loc.location_id ? "bg-primary text-white border-primary shadow-lg scale-[1.02]" : "bg-background text-muted-foreground border-border hover:border-primary/30"}`}>{loc.location_name}</button>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {selectedLoc && locations.find(l => l.location_id === Number(selectedLoc))?.location_name.match(/โรงเย็น|โรงร้อน/) && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pt-6 border-t border-border/50 flex flex-col space-y-4 relative">
                    <Label className="text-sm font-bold text-primary uppercase tracking-wide">เลือกร้านอาหาร</Label>
                    <div className="relative w-full">
                      <button onClick={() => setIsShopOpen(!isShopOpen)} className="flex w-full items-center justify-between rounded-2xl border border-border bg-card/50 p-4 text-sm font-medium transition-all hover:bg-card/80">
                        <div className="flex items-center gap-2">{selectedRes ? restaurants.find(r => Number(r.restaurant_id) === Number(selectedRes))?.restaurant_name : "-- แสดงทุกร้าน --"}</div>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${isShopOpen ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {isShopOpen && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute left-0 right-0 z-[100] mt-2 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
                            <div className="max-h-60 overflow-y-auto p-1 bg-white">
                              <button onClick={() => { setSelectedRes(null); setIsShopOpen(false); }} className="flex w-full px-4 py-3 text-sm hover:bg-primary/10 transition-colors border-b border-border/50 text-left">-- แสดงทุกร้าน --</button>
                              {restaurants.filter(r => Number(r.location_id) === Number(selectedLoc)).map((res) => (
                                <button key={res.restaurant_id} onClick={() => { setSelectedRes(res.restaurant_id); setIsShopOpen(false); }} className={`flex w-full px-4 py-3 text-sm transition-colors text-left ${Number(selectedRes) === Number(res.restaurant_id) ? "bg-primary text-white" : "hover:bg-primary/10"}`}>{res.restaurant_name}</button>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
              {foods.map(food => (
                <div key={food.food_id} className="glass-card p-4 rounded-2xl flex gap-4 items-center hover:border-primary/30 transition-all group relative overflow-hidden">
                  <img src={food.food_image ? `/foods/${food.food_image}` : "/foods/default-food.png"} className="w-16 h-16 rounded-2xl object-cover bg-accent" onError={(e) => { (e.target as HTMLImageElement).src = "/foods/default-food.png" }} alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate pr-14">{food.food_name}</p>
                    <p className="text-xs text-primary font-black">{food.sodium_mg} <span className="text-[9px] text-muted-foreground font-medium uppercase">mg</span></p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-accent text-[9px] font-bold text-muted-foreground">{food.location_name}</span>
                      {food.restaurant_name && <span className="text-[9px] text-primary/60 font-bold">• {food.restaurant_name}</span>}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openFoodEdit(food)} className="p-1.5 bg-white shadow-sm text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteDialog({ open: true, table: "foods", id: food.food_id, name: food.food_name })} className="p-1.5 bg-white shadow-sm text-destructive rounded-lg hover:bg-destructive hover:text-white"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "locations" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="glass-card p-6 rounded-3xl border-2 border-primary/5 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> สถานที่บันทึกอาหาร</h2>
                <Button size="sm" onClick={() => { setEditMode('location'); setFormData({}); setDialogOpen(true); }}><Plus className="w-4 h-4" />เพิ่มสถานที่</Button>
              </div>
              <div className="space-y-3">
                {locations.map(loc => {
                  const isMainCanteen = loc.location_name.match(/โรงเย็น|โรงร้อน/);
                  const isExpanded = expandedLocId === loc.location_id;
                  return (
                    <div key={loc.location_id} className="overflow-hidden border border-border/50 rounded-2xl bg-accent/5">
                      <div className="flex justify-between items-center p-4 bg-white/50">
                        <div className={`flex items-center gap-3 flex-1 ${isMainCanteen ? 'cursor-pointer' : ''}`} onClick={() => isMainCanteen && setExpandedLocId(isExpanded ? null : loc.location_id)}>
                          {isMainCanteen ? <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} /> : <div className="w-4" />}
                          <span className="text-sm font-bold">{loc.location_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditMode('location'); setFormData(loc); setDialogOpen(true); }} className="p-2 text-primary hover:bg-primary/10 rounded-xl"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteDialog({ open: true, table: "locations", id: loc.location_id, name: loc.location_name })} className="p-2 text-destructive hover:bg-destructive/10 rounded-xl"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="bg-accent/10 border-t border-border/30">
                            <div className="p-3 space-y-2">
                              <div className="flex justify-between items-center px-2 py-1"><span className="text-[10px] font-bold text-muted-foreground uppercase">รายชื่อร้านอาหาร</span><button onClick={() => { setEditMode('restaurant'); setFormData({ location_id: loc.location_id }); setDialogOpen(true); }} className="text-[10px] font-bold text-primary hover:underline"><Plus className="w-3 h-3" /> เพิ่มร้าน</button></div>
                              {restaurants.filter(r => Number(r.location_id) === Number(loc.location_id)).map(res => (
                                <div key={res.restaurant_id} className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm">
                                  <span className="text-xs font-medium">{res.restaurant_name}</span>
                                  <div className="flex gap-1">
                                    <button onClick={() => { setEditMode('restaurant'); setFormData(res); setDialogOpen(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-3 h-3" /></button>
                                    <button onClick={() => setDeleteDialog({ open: true, table: "restaurants", id: res.restaurant_id, name: res.restaurant_name })} className="p-1.5 text-destructive hover:bg-destructive/5 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "herbs" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex gap-2 p-1 bg-accent/20 rounded-2xl w-fit">
              <button onClick={() => setActiveSubTab("medicine")} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === "medicine" ? "bg-white shadow-sm text-primary" : "text-muted-foreground"}`}>ยาอันตรายต่อไต</button>
              <button onClick={() => setActiveSubTab("herb")} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === "herb" ? "bg-white shadow-sm text-primary" : "text-muted-foreground"}`}>สมุนไพรที่ควรระวัง</button>
            </div>
            <div className="glass-card p-6 rounded-3xl border-2 border-primary/5 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold flex items-center gap-2"><Pill className="w-4 h-4 text-primary" /> รายการ{activeSubTab === "medicine" ? "ยา" : "สมุนไพร"}</h2>
                <Button size="sm" onClick={() => { setEditMode(activeSubTab); setFormData({}); setDialogOpen(true); }}><Plus className="w-4 h-4" />เพิ่ม{activeSubTab === "medicine" ? "ยา" : "สมุนไพร"}</Button>
              </div>
              <div className="space-y-3">
                {activeSubTab === "medicine" ? (
                  Array.from(new Set(medicines.map(m => m.med_category))).map(cat => {
                    const isExpanded = expandedMedCat === cat;
                    return (
                      <div key={cat} className="overflow-hidden border border-border/50 rounded-2xl bg-accent/5">
                        <div className="flex justify-between items-center p-4 bg-white/50 cursor-pointer" onClick={() => setExpandedMedCat(isExpanded ? null : cat)}>
                          <div className="flex items-center gap-3"><ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} /><span className="text-sm font-bold">{cat}</span></div>
                        </div>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="bg-accent/10 border-t border-border/30">
                              <div className="p-3 space-y-2">
                                {medicines.filter(m => m.med_category === cat).map(med => (
                                  <div key={med.med_id} className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm gap-4">
                                    <div className="flex items-center gap-4 flex-1">
                                      <img src={`/med-herb/${med.image_path}`} className="w-12 h-12 rounded-lg object-cover bg-accent" onError={(e) => { (e.target as HTMLImageElement).src = "/foods/default-food.png" }} alt="" />
                                      <span className="text-xs font-bold">{med.title}</span>
                                    </div>
                                    <div className="flex gap-1">
                                      <button onClick={() => openEditMedHerb(med, 'medicine')} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => setDeleteDialog({ open: true, table: "medicines", id: med.med_id, name: med.title })} className="p-1.5 text-destructive hover:bg-destructive/5 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                ) : (
                  herbs.map(herb => (
                    <div key={herb.herb_id} className="flex justify-between items-center p-4 bg-white border border-border/50 rounded-2xl gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-4" />
                        <img src={`/med-herb/${herb.image_path}`} className="w-12 h-12 rounded-lg object-cover bg-accent" onError={(e) => { (e.target as HTMLImageElement).src = "/foods/default-food.png" }} alt="" />
                        <span className="text-sm font-bold">{herb.title}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditMedHerb(herb, 'herb')} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteDialog({ open: true, table: "herbs", id: herb.herb_id, name: herb.title })} className="p-1.5 text-destructive hover:bg-destructive/5 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="text-lg font-bold">จัดการข้อมูลผู้ใช้ ({usersList.length})</h2>
            <div className="space-y-2">
              {usersList.map(u => (
                <div key={u.user_id} className="glass-card p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
                    <div><p className="text-xs font-bold">{u.full_name}</p><p className="text-[10px] text-muted-foreground">{u.email} | แต้ม: {u.total_points}</p></div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditMode('user'); setFormData(u); setDialogOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteDialog({ open: true, type: "user", id: u.user_id, name: u.full_name || "" })} className="p-2 text-destructive hover:bg-destructive/10 rounded-xl"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Dialog for Create/Update */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <div className="space-y-4 py-4">
            {editMode === 'food' && (
              <div className="space-y-4">
                <div><Label className="text-xs font-bold">ชื่อเมนูอาหาร</Label><Input value={formData.food_name || ''} onChange={e => setFormData({...formData, food_name: e.target.value})} className="rounded-xl mt-1" /></div>
                <div><Label className="text-xs font-bold">ปริมาณโซเดียม (mg)</Label><Input type="number" value={formData.sodium_mg || ''} onChange={e => setFormData({...formData, sodium_mg: e.target.value})} className="rounded-xl mt-1" /></div>
                <div>
                  <Label className="text-xs font-bold">สถานที่จำหน่าย</Label>
                  <select value={formData.location_id || ""} onChange={(e) => setFormData({ ...formData, location_id: e.target.value ? Number(e.target.value) : "", restaurant_id: "" })} className="w-full p-2.5 bg-background border rounded-xl text-sm mt-1 focus:outline-none">
                    <option value="">-- เลือกสถานที่ --</option>
                    {locations.map(loc => <option key={loc.location_id} value={loc.location_id}>{loc.location_name}</option>)}
                  </select>
                </div>
                {formData.location_id && locations.find(l => l.location_id === Number(formData.location_id))?.location_name.match(/โรงเย็น|โรงร้อน/) && (
                  <div>
                    <Label className="text-xs font-bold text-primary">เลือกร้านอาหาร</Label>
                    <select value={formData.restaurant_id || ""} onChange={(e) => setFormData({ ...formData, restaurant_id: e.target.value ? Number(e.target.value) : "" })} className="w-full p-2.5 bg-primary/5 border border-primary/20 rounded-xl text-sm mt-1 focus:outline-none">
                      <option value="">-- เลือกร้านอาหาร --</option>
                      {/* 🌟 แก้ไขจุด Logic Error: ใช้ formData.location_id กรองร้านอาหาร */}
                      {restaurants.filter(r => Number(r.location_id) === Number(formData.location_id)).map(r => <option key={r.restaurant_id} value={r.restaurant_id}>{r.restaurant_name}</option>)}
                    </select>
                  </div>
                )}
                <div><Label className="text-xs font-bold">รูปภาพอาหาร</Label><Input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="rounded-xl mt-1" /></div>
              </div>
            )}

            {(editMode === 'medicine' || editMode === 'herb') && (
              <div className="space-y-4">
                {editMode === 'medicine' && (
                  <div><Label className="text-xs font-bold">หมวดหมู่ยา</Label><select value={formData.med_category || ""} onChange={e => setFormData({...formData, med_category: e.target.value})} className="w-full p-2.5 bg-background border rounded-xl text-sm mt-1"><option value="">-- เลือกหมวดหมู่ --</option><option value="NSAIDs">NSAIDs</option><option value="Corticosteroid">Corticosteroid</option></select></div>
                )}
                <div><Label className="text-xs font-bold">ชื่อ{editMode === 'medicine' ? 'ยา' : 'สมุนไพร'}</Label><Input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="rounded-xl" /></div>
                <div><Label className="text-xs font-bold">รายละเอียด</Label><Textarea value={formData.detail || ''} onChange={e => setFormData({...formData, detail: e.target.value})} className="rounded-xl min-h-[100px]" /></div>
                <div><Label className="text-xs font-bold">คำเตือน/ข้อควรระวัง</Label><Textarea value={formData.warning || ''} onChange={e => setFormData({...formData, warning: e.target.value})} className="rounded-xl min-h-[100px]" /></div>
                <div><Label className="text-xs font-bold">รูปภาพ</Label><Input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="rounded-xl" /></div>
              </div>
            )}

            {editMode === 'user' && (
              <>
                <div><Label>ชื่อ-นามสกุล</Label><Input value={formData.full_name || ''} onChange={e => setFormData({...formData, full_name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>เพศ</Label><select value={formData.gender || ""} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full p-2.5 bg-background border rounded-xl text-sm mt-1 focus:outline-none"><option value="">-- เลือกเพศ --</option><option value="ชาย">ชาย</option><option value="หญิง">หญิง</option><option value="อื่นๆ">อื่นๆ</option></select></div>
                  <div><Label>อายุ</Label><Input type="number" value={formData.age || ''} onChange={e => setFormData({...formData, age: e.target.value})} /></div>
                </div>
                <div><Label>แต้มสะสม</Label><Input type="number" value={formData.total_points || ''} onChange={e => setFormData({...formData, total_points: e.target.value})} /></div>
              </>
            )}

            {editMode === 'location' && (
              <div><Label className="text-xs font-bold">ชื่อสถานที่</Label><Input value={formData.location_name || ''} onChange={e => setFormData({...formData, location_name: e.target.value})} className="rounded-xl mt-1" /></div>
            )}

            {editMode === 'restaurant' && (
              <div><Label className="text-xs font-bold">ชื่อร้านอาหาร</Label><Input value={formData.restaurant_name || ''} onChange={e => setFormData({...formData, restaurant_name: e.target.value})} className="rounded-xl mt-1" /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave}>บันทึกข้อมูล</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.open} onOpenChange={v => !v && setDeleteDialog(d => ({ ...d, open: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle><AlertDialogDescription>คุณต้องการลบ "{deleteDialog.name}" ใช่หรือไม่?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>ยกเลิก</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white">ลบข้อมูล</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
