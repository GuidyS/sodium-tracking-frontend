import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Trophy, Star, Calendar as CalendarIcon } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import api from "@/lib/axios";

const Points = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<any[]>([]);
  const [points, setPoints] = useState(0);
  const [trackedDays, setTrackedDays] = useState<Set<number>>(new Set());
  const [pointDates, setPointDates] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setPoints(user.total_points || 0);

      const res = await api.get("/index.php?page=food-log&action=daily_all");
      if (res.data.status === "success") {
        const allLogs = res.data.data || [];
        const loggedDates = allLogs.filter(log => log.total_sodium_daily > 0).map(log => log.log_date);
         setLogs(loggedDates);
        const tempTrackedDays = new Set<number>();
        const tempPointDates: number[] = [];

        // 🌟 1. ตรวจสอบดาวจาก Pretest (ได้ทันที 1 ดวงในวันที่ทำ)
        if (Number(user.pretest_done) === 1 && user.updated_at) {
          const safeDateStr = user.updated_at.toString().replace(/-/g, "/");
          const testDate = new Date(safeDateStr);
          
          if (!isNaN(testDate.getTime())) {
            if (testDate.getMonth() === currentMonth && testDate.getFullYear() === currentYear) {
              tempPointDates.push(testDate.getDate());
              tempTrackedDays.add(testDate.getDate());
            }
          }
        }

        // 🌟 2. คำนวณดาวจากการบันทึกอาหาร (ลอจิก: บันทึกครบ 3 วันที่ไม่ซ้ำกัน ได้ 1 ดาว)
        // จัดเรียง Log ตามเวลา
        const sortedLogs = allLogs.sort((a: any, b: any) => {
          const dateA = a.created_at ? new Date(a.created_at.replace(/-/g, "/")).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at.replace(/-/g, "/")).getTime() : 0;
          return dateA - dateB;
        });

        // ใช้ Set เพื่อเก็บวันที่ที่มีการบันทึกอาหาร "ทั้งหมดตั้งแต่เริ่ม" (Unique Days)
        const uniqueDaysCumulative = new Set<string>();

        sortedLogs.forEach((log: any) => {
          if (!log.created_at) return;
          
          const logDate = new Date(log.created_at.replace(/-/g, "/"));
          const dateKey = log.created_at.split(' ')[0]; // รูปแบบ "YYYY-MM-DD"

          if (!isNaN(logDate.getTime())) {
            // เพิ่มวันที่ลงใน Set รวม (เพื่อใช้นับจำนวนวันสะสม)
            if (!uniqueDaysCumulative.has(dateKey)) {
              uniqueDaysCumulative.add(dateKey);

              // ไฮไลต์สีเขียวเฉพาะเดือนที่กำลังแสดง
              if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
                tempTrackedDays.add(logDate.getDate());
              }

              // ลอจิก: ทุกๆ วันที่ 3, 6, 9... ที่มีการบันทึกอาหาร ให้แจกดาว
              if (uniqueDaysCumulative.size % 3 === 0) {
                // แสดงดาวในปฏิทินเฉพาะถ้า "วันที่ครบเงื่อนไข" อยู่ในเดือนที่เลือก
                if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
                  tempPointDates.push(logDate.getDate());
                }
              }
            }
          }
        });

        setLogs(allLogs);
        setTrackedDays(tempTrackedDays);
        setPointDates(tempPointDates);
      }
    } catch (error) {
      console.error("Failed to fetch points data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <PageLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
        {/* Header แต้มสะสม */}
        <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-3xl p-8 text-white text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><Trophy size={80} /></div>
          <div className="relative z-10">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
              <Trophy className="text-white" size={32} />
            </div>
            <p className="text-sm font-bold opacity-90 mb-1 uppercase tracking-widest">แต้มสะสมปัจจุบัน</p>
            <div className="flex items-end justify-center gap-2">
              <span className="text-6xl font-black">{points}</span>
              <span className="text-xl font-bold mb-2">แต้ม</span>
            </div>
          </div>
        </div>

        {/* ปฏิทินสะสมแต้ม */}
        <div className="glass-card rounded-3xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-base font-bold flex items-center gap-2">
              <Star className="text-orange-500 fill-orange-500" size={18} /> ตารางสะสมแต้ม
            </h2>
            <div className="flex items-center gap-4 bg-secondary/50 px-3 py-1.5 rounded-xl">
              <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1))} className="hover:text-primary"><ChevronLeft size={20}/></button>
              <span className="text-sm font-bold min-w-[100px] text-center">
                {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1))} className="hover:text-primary"><ChevronRight size={20}/></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-muted-foreground py-2 uppercase tracking-tighter">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {blanks.map(i => <div key={`b-${i}`} />)}
              {daysInMonth.map((d) => {
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const isTracked = logs.includes(dateStr); // ข้อ 2: เช็คเพื่อมาร์คสีเขียว
                
                // ข้อ 3: ลอจิกแสดงดาว (สมมติว่านับจากลำดับวันที่มีการบันทึก)
                const dayIndex = logs.indexOf(dateStr) + 1;
                const showStar = isTracked && dayIndex > 0 && dayIndex % 3 === 0;
              
                return (
                  <div key={d} className="relative aspect-square p-1">
                    <div className={`w-full h-full rounded-xl flex items-center justify-center transition-all ${
                      isTracked ? "bg-emerald-500 text-white shadow-sm" : "bg-secondary/20 text-muted-foreground"
                    }`}>
                      <span className="text-xs font-medium">{d}</span>
                      {showStar && (
                        <div className="absolute -top-1 -right-1">
                          <Star size={14} className="text-yellow-400 fill-yellow-400 filter drop-shadow-sm animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
          
          {/* คำอธิบายสัญลักษณ์ */}
          <div className="mt-6 pt-4 border-t border-border/50 flex gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />
              <span>มีการบันทึกอาหาร</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star size={12} className="text-orange-500 fill-orange-500" />
              <span>ได้รับ 1 แต้ม (ครบ 3 วัน)</span>
            </div>
          </div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Points;
