import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Trophy, Star, Calendar as CalendarIcon } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import api from "@/lib/axios";

const Points = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<string[]>([]);
  const [points, setPoints] = useState(0);
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
      
      if (res.data.status === "success" && Array.isArray(res.data.data)) {
        // 🌟 1. กรองเฉพาะข้อมูลที่มี log_date และมีค่าโซเดียมจริงๆ เท่านั้น
        const validLogs = res.data.data.filter((log: any) => log && log.log_date);
        
        // เก็บวันที่สำหรับมาร์คสีเขียว
        const loggedDatesStr = validLogs
          .filter((log: any) => log.total_sodium_daily > 0)
          .map((log: any) => log.log_date);
        setLogs(loggedDatesStr);

        const tempPointDates: number[] = [];

        // 🌟 2. เช็คดาวจาก Pretest
        if (Number(user.pretest_done) === 1 && user.updated_at) {
          const testDate = new Date(user.updated_at.replace(/-/g, "/"));
          if (testDate.getMonth() === currentMonth && testDate.getFullYear() === currentYear) {
            tempPointDates.push(testDate.getDate());
          }
        }

        // 🌟 3. เช็คดาวจาก Food Log (สะสมครบทุก 3 วัน)
        const uniqueDaysCumulative = new Set<string>();
        
        // 🌟 4. แก้จุดที่พัง: ตรวจสอบค่าก่อนใช้ localeCompare
        const sortedLogs = [...validLogs].sort((a, b) => {
          const dateA = a.log_date || "";
          const dateB = b.log_date || "";
          return dateA.localeCompare(dateB);
        });

        sortedLogs.forEach((log: any) => {
          if (log.total_sodium_daily <= 0) return;
          const dateKey = log.log_date;
          if (!uniqueDaysCumulative.has(dateKey)) {
            uniqueDaysCumulative.add(dateKey);
            if (uniqueDaysCumulative.size % 3 === 0) {
              const d = new Date(dateKey);
              if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                tempPointDates.push(d.getDate());
              }
            }
          }
        });

        setPointDates(tempPointDates);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const numDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: numDays }, (_, i) => i + 1);
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <PageLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
        
        {/* ส่วนแสดงวันที่ปัจจุบัน */}
        <div className="flex items-center gap-3 px-2">
          <div className="bg-primary/10 p-2.5 rounded-2xl text-primary">
            <CalendarIcon size={20} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Today</p>
            <p className="text-sm font-black text-foreground">
              {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Header แต้มสะสม */}
        <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-3xl p-8 text-white text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><Trophy size={80} /></div>
          <div className="relative z-10">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
              <Trophy className="text-white" size={32} />
            </div>
            <p className="text-sm font-bold opacity-90 mb-1 uppercase tracking-widest">แต้มสะสมทั้งหมด</p>
            <div className="flex items-end justify-center gap-2">
              <span className="text-6xl font-black">{points}</span>
              <span className="text-xl font-bold mb-2">แต้ม</span>
            </div>
          </div>
        </div>

        {/* ปฏิทินสะสมแต้ม */}
        <div className="glass-card rounded-3xl p-6 shadow-xl border border-white/20 bg-white/50 max-w-md mx-auto md:max-w-lg">
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
            {daysArray.map((d) => {
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              
              // 🌟 เช็คว่าเป็นวันที่ปัจจุบันหรือไม่
              const today = new Date();
              const isToday = 
                d === today.getDate() && 
                currentMonth === today.getMonth() && 
                currentYear === today.getFullYear();
            
              const isTracked = logs.includes(dateStr); 
              const showStar = pointDates.includes(d);
            
              return (
                <div key={d} className="relative aspect-square p-0.5">
                  <div className={`w-full h-full rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isToday 
                      ? "ring-2 ring-primary ring-offset-2 shadow-lg scale-105 z-10" // วันปัจจุบัน: มีขอบเน้นและขยายเล็กน้อย
                      : ""
                  } ${
                    isTracked 
                      ? "bg-emerald-500 text-white font-bold shadow-md" // วันที่บันทึกแล้ว: สีเขียว
                      : "bg-secondary/30 text-muted-foreground/40"    // วันที่ว่าง: สีเทาจาง
                  }`}>
                    
                    {/* ถ้าเป็นวันปัจจุบันและยังไม่ได้บันทึก อาจจะใส่สีพื้นหลังอ่อนๆ ให้รู้ตัว */}
                    <div className={`absolute inset-0 rounded-xl ${isToday && !isTracked ? "bg-primary/10" : ""}`} />
            
                    <span className={`relative z-10 text-xs ${isToday && !isTracked ? "text-primary font-bold" : ""}`}>
                      {d}
                    </span>
            
                    {showStar && (
                      <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm z-20"
                      >
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* คำอธิบายสัญลักษณ์ */}
        <div className="mt-8 pt-4 border-t border-border/50 flex justify-between items-center text-[10px] text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span>มีการบันทึกอาหาร</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-white border border-gray-200 flex items-center justify-center">
                <Star size={8} className="text-yellow-400 fill-yellow-400" />
              </div>
              <span>ได้รับแต้ม (3 วัน/แบบทดสอบ)</span>
            </div>
          </div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Points;
