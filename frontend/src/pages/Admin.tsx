import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, FileText, CheckCircle, Download, Search, Trash2, X, User, CalendarDays, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { toast } from "@/hooks/use-toast";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

interface UserInfo {
  user_id: string;
  username?: string;
  full_name?: string;
  email?: string;
  gender?: string;
  age?: number;
  total_points?: number;
  pretest_score?: number;
  posttest_score?: number;
}

type DateRange = "7d" | "30d" | "90d" | "all" | "custom";

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: "7d", label: "7 วัน" },
  { value: "30d", label: "30 วัน" },
  { value: "90d", label: "90 วัน" },
  { value: "all", label: "ทั้งหมด" },
  { value: "custom", label: "กำหนดเอง" },
];

const getDateRangeParams = (range: DateRange, startDate: string, endDate: string) => {
  if (range === "custom" && startDate && endDate) {
    return `&start_date=${startDate}&end_date=${endDate}`;
  }
  if (range === "all") return "";
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const start = new Date();
  start.setDate(start.getDate() - days);
  return `&start_date=${start.toISOString().split("T")[0]}&end_date=${new Date().toISOString().split("T")[0]}`;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Date filter
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Summary stats
  const [summaryData, setSummaryData] = useState({ totalUsers: 0, avgPretest: 0, avgPosttest: 0 });
  const [genderData, setGenderData] = useState<any[]>([]);
  const [ageData, setAgeData] = useState<any[]>([]);

  // Per-user data
  const [userSodiumData, setUserSodiumData] = useState<any[]>([]);
  const [userScoreData, setUserScoreData] = useState<any[]>([]);
  const [itemAnalysisData, setItemAnalysisData] = useState<any[]>([]);

  const userData = localStorage.getItem("user");
  const adminId = userData ? JSON.parse(userData).user_id : null;

  useEffect(() => {
    fetchSummary();
  }, [dateRange, customStartDate, customEndDate]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserDetail(selectedUser.user_id);
    }
  }, [dateRange, customStartDate, customEndDate]);

  const dateParams = () => getDateRangeParams(dateRange, customStartDate, customEndDate);

  const fetchSummary = async () => {
    try {
      const res = await api.get(`/index.php?page=admin&action=summary${dateParams()}`, {
        params: { user_id: adminId } // ส่งไปยืนยันสิทธิ์ที่ backend
      });
      
      if (res.data.status === "success") {
        const d = res.data.data;
        setSummaryData({
          totalUsers: d.total_users || 0,
          avgPretest: d.avg_pretest || 0,
          avgPosttest: d.avg_posttest || 0,
        });
        if (d.gender_data) setGenderData(d.gender_data);
        if (d.age_data) setAgeData(d.age_data);
        if (d.item_analysis) setItemAnalysisData(d.item_analysis);
      }
    } catch (e) {
      console.error("Failed to fetch summary:", e);
      // 🌟 แจ้งเตือนถ้าไม่มีสิทธิ์
      if (e.response?.status === 403) {
        toast({ 
          variant: "destructive", 
          title: "สิทธิ์ไม่ถูกต้อง", 
          description: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้" 
        });
        navigate("/dashboard");
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.get(`/index.php?page=admin&action=search_user`, {
        params: { q: searchQuery, user_id: adminId }
      });
      
      if (res.data.status === "success" && Array.isArray(res.data.data)) {
        setSearchResults(res.data.data);
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      console.error("Search failed:", e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchUserDetail = async (userId: string) => {
    try {
      const res = await api.get(`/index.php?page=admin&action=user_detail&user_id=${userId}${dateParams()}`, {
        params: { user_id: adminId } // 🌟 เพิ่มบรรทัดนี้เพื่อความปลอดภัย
      });
      
      if (res.data.status === "success") {
        const d = res.data.data;
        if (d.sodium_data) setUserSodiumData(d.sodium_data);
        if (d.score_data) setUserScoreData(d.score_data);
        if (d.user_info) setSelectedUser(prev => ({ ...prev, ...d.user_info }));
      }
    } catch (e) {
      console.error("Failed to fetch user detail:", e);
    }
  };

  const handleSelectUser = async (user: UserInfo) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchQuery(user.full_name || user.username || "");
    fetchUserDetail(user.user_id);
  };

  const handleDeletePoints = async () => {
    if (!selectedUser) return;
    const confirmed = window.confirm(`ต้องการลบแต้มสะสมของ ${selectedUser.full_name || selectedUser.username} ทั้งหมดหรือไม่?`);
    if (!confirmed) return;
    try {
      const res = await api.post("/index.php?page=admin&action=delete_points", {
        user_id: selectedUser.user_id,
      });
      if (res.data.status === "success") {
        toast({ title: "ลบแต้มสำเร็จ", description: "แต้มสะสมถูกรีเซ็ตเรียบร้อยแล้ว" });
        setSelectedUser(prev => prev ? { ...prev, total_points: 0 } : null);
        fetchSummary();
      }
    } catch (e) {
      console.error("Failed to delete points:", e);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถลบแต้มได้", variant: "destructive" });
    }
  };

  const clearSelectedUser = () => {
    setSelectedUser(null);
    setSearchQuery("");
    setUserSodiumData([]);
    setUserScoreData([]);
  };

  const genderColors = ["hsl(200, 70%, 50%)", "hsl(330, 70%, 60%)", "hsl(280, 50%, 60%)"];
  const ageColors = ["hsl(155, 55%, 40%)", "hsl(155, 45%, 55%)", "hsl(40, 80%, 55%)", "hsl(25, 90%, 55%)"];

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-5xl px-4 pt-6 pb-6">
        <div className="space-y-6 pb-8">
          
          {/* Date Range Filter */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              กรองตามช่วงเวลา
            </h2>
            <div className="flex flex-wrap gap-2">
              {dateRangeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDateRange(opt.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    dateRange === opt.value
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-accent/30 text-foreground hover:bg-accent/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <AnimatePresence>
              {dateRange === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-3 mt-3 overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    <label className="text-xs text-muted-foreground">เริ่มต้น</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">ถึง</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Search User */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              ค้นหาผู้ใช้
            </h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="ค้นหาด้วยชื่อ, อีเมล หรือ ID..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {selectedUser && (
                  <button onClick={clearSelectedUser} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSearching ? "กำลังค้นหา..." : "ค้นหา"}
              </button>
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-2 rounded-xl border border-border bg-background shadow-lg overflow-hidden"
                >
                  {searchResults.map((user) => (
                    <button
                      key={user.user_id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors border-b border-border last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user.full_name || user.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email || `ID: ${user.user_id}`}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{user.total_points || 0} แต้ม</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Selected User Card */}
          <AnimatePresence>
            {selectedUser && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card rounded-2xl p-5 border-2 border-primary/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">{selectedUser.full_name || selectedUser.username}</h3>
                      <p className="text-xs text-muted-foreground">{selectedUser.email || `ID: ${selectedUser.user_id}`}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDeletePoints}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    ลบแต้ม
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-accent/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground">แต้มสะสม</p>
                    <p className="text-lg font-bold text-foreground">{selectedUser.total_points || 0}</p>
                  </div>
                  <div className="rounded-xl bg-accent/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Pre-test</p>
                    <p className="text-lg font-bold text-foreground">{selectedUser.pretest_score ?? "-"}%</p>
                  </div>
                  <div className="rounded-xl bg-accent/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Post-test</p>
                    <p className="text-lg font-bold text-foreground">{selectedUser.posttest_score ?? "-"}%</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Per-user charts: Sodium & Score (only show when user selected) */}
          <AnimatePresence>
            {selectedUser && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="glass-card rounded-2xl p-5">
                  <h2 className="text-base font-semibold text-foreground mb-4">
                    แนวโน้มโซเดียม — {selectedUser.full_name || selectedUser.username}
                  </h2>
                  {userSodiumData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={userSodiumData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="sodium" name="โซเดียม (mg)" stroke="hsl(200, 70%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                      ไม่มีข้อมูลโซเดียม
                    </div>
                  )}
                </div>

                <div className="glass-card rounded-2xl p-5">
                  <h2 className="text-base font-semibold text-foreground mb-4">
                    คะแนน Pre/Post — {selectedUser.full_name || selectedUser.username}
                  </h2>
                  {userScoreData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={userScoreData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="score" name="คะแนน" radius={[8, 8, 0, 0]}>
                          {userScoreData.map((entry: any, index: number) => (
                            <Cell key={index} fill={entry.fill || "hsl(200, 70%, 50%)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                      ไม่มีข้อมูลคะแนน
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-4 text-center">
              <Users className="w-6 h-6 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">ผู้เข้าร่วม</p>
              <p className="text-2xl font-bold text-foreground">{summaryData.totalUsers}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-4 text-center">
              <FileText className="w-6 h-6 mx-auto text-orange-500 mb-1" />
              <p className="text-xs text-muted-foreground">Pre-test เฉลี่ย</p>
              <p className="text-2xl font-bold text-foreground">{summaryData.avgPretest}%</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-4 text-center">
              <CheckCircle className="w-6 h-6 mx-auto text-green-500 mb-1" />
              <p className="text-xs text-muted-foreground">Post-test เฉลี่ย</p>
              <p className="text-2xl font-bold text-foreground">{summaryData.avgPosttest}%</p>
            </motion.div>
          </div>

          {/* Demographics */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-5">
            <h2 className="text-base font-semibold text-foreground mb-4">ข้อมูลทั่วไป (Demographics)</h2>
            <div className="grid grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={genderData} dataKey="value" cx="50%" cy="50%" outerRadius={70} label>
                    {genderData.map((entry, index) => <Cell key={index} fill={entry.color || genderColors[index % genderColors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={ageData} dataKey="value" cx="50%" cy="50%" outerRadius={70} label>
                    {ageData.map((entry, index) => <Cell key={index} fill={entry.color || ageColors[index % ageColors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around mt-2 text-xs text-muted-foreground">
              <span>สัดส่วนเพศ</span>
              <span>ช่วงอายุ</span>
            </div>
          </motion.div>

          {/* Item Analysis */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-2xl p-5">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-foreground">สถิติวิเคราะห์รายข้อ (%)</h2>
              <p className="text-xs text-muted-foreground">เปรียบเทียบสัดส่วนคนตอบถูก 8 ข้อ</p>
            </div>
            {itemAnalysisData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={itemAnalysisData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="question" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip formatter={(value: number) => [`${value}%`, "ตอบถูก"]} />
                  <Legend />
                  <Bar dataKey="pretest" name="Pre-test" fill="hsl(25, 90%, 65%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="posttest" name="Post-test" fill="hsl(155, 55%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                ไม่มีข้อมูลสถิติรายข้อ
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
