import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Trophy, Star, Calendar as CalendarIcon } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import infographicRewards from "@/assets/infog-1.jpg";
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

      // ส่ง user_id ไปกับ API เพื่อให้รองรับการใช้งานในมือถือ
      const res = await api.get(`/index.php?page=food-log&action=daily_all&user_id=${user.user_id}`);
      
      if (res.data.status === "success" && Array.isArray(res.data.data)) {
        // 1. กรองเฉพาะข้อมูลที่สมบูรณ์จาก API
        const validLogs = res.data.data.filter((item: any) => item && item.log_date);
        
        // 2. ดึงวันที่ที่มีการบันทึกอาหารจริง (สำหรับมาร์คสีเขียวในปฏิทิน)
        const loggedDatesStr = validLogs
          .filter((item: any) => Number(item.total_sodium_daily || 0) > 0)
          .map((item: any) => item.log_date.split(' ')[0]);

        // ใช้ Set เพื่อกำจัดวันที่ซ้ำกัน
        setLogs(Array.from(new Set(loggedDatesStr)));

        const tempPointDates: number[] = [];

        // 3. ตรวจสอบดาวจาก Pretest
        if (Number(user.pretest_done) === 1 && user.updated_at) {
          const testDate = new Date(user.updated_at.replace(/-/g, "/"));
          if (testDate.getMonth() === currentMonth && testDate.getFullYear() === currentYear) {
            tempPointDates.push(testDate.getDate());
          }
        }

        // 4. คำนวณดาวสะสมจากการบันทึกอาหาร (ทุกๆ 3 วันที่ไม่ซ้ำกัน)
        const uniqueDaysCumulative = new Set<string>();
        const sortedLogs = [...validLogs].sort((a, b) => a.log_date.localeCompare(b.log_date));

        sortedLogs.forEach((item: any) => {
          const sodiumValue = Number(item.total_sodium_daily || 0);
          if (sodiumValue <= 0) return;

          const dateKey = item.log_date.split(' ')[0];
          if (!uniqueDaysCumulative.has(dateKey)) {
            uniqueDaysCumulative.add(dateKey);
            
            // ถ้าสะสมครบทุก 3 วันที่ไม่ซ้ำกัน ให้โชว์ดาว
            if (uniqueDaysCumulative.size % 3 === 0) {
              const d = new Date(dateKey.replace(/-/g, "/"));
              if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                tempPointDates.push(d.getDate());
              }
            }
          }
        });

        setPointDates(tempPointDates);
      }
    } catch (error) {
      console.error("Failed to fetch points data:", error);
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
        <div className="glass-card rounded-3xl p-6 shadow-xl border border-white/20 bg-white/50 w-full"> 
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-base font-bold flex items-center gap-2">
              <Star className="text-orange-500 fill-orange-500" size={18} /> ตารางสะสมแต้ม
            </h2>
            <div className="flex items-center gap-4 bg-secondary/50 px-3 py-1.5 rounded-xl">
              <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1))} className="hover:text-primary transition-colors"><ChevronLeft size={20}/></button>
              <span className="text-sm font-bold min-w-[100px] text-center">
                {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1))} className="hover:text-primary transition-colors"><ChevronRight size={20}/></button>
            </div>
          </div>
        
          {/* ส่วนหัววันในสัปดาห์ */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-muted-foreground py-2 uppercase tracking-tighter">{d}</div>
            ))}
          </div>
        
          {/* ช่องวันที่ในปฏิทิน */}
          <div className="grid grid-cols-7 gap-1.5 md:gap-3"> 
            {blanks.map(i => <div key={`b-${i}`} />)}
            {daysArray.map((d) => {
              const monthStr = String(currentMonth + 1).padStart(2, '0');
              const dayStr = String(d).padStart(2, '0');
              const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
              
              const todayStr = new Date().toLocaleDateString('en-CA'); 
              const isToday = dateStr === todayStr;
              const isTracked = logs.includes(dateStr);
              const showStar = pointDates.includes(d);
        
              return (
                <div key={d} className="relative h-10 md:h-12 p-0.5">
                  <div className={`w-full h-full rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isToday ? "ring-2 ring-primary ring-offset-2 z-10 scale-105" : ""
                  } ${
                    isTracked 
                      ? "bg-emerald-500 text-white font-bold shadow-md" 
                      : "bg-secondary/20 text-muted-foreground/70 hover:bg-secondary/40"
                  }`}>
                    <span className="text-xs md:text-sm relative z-10">{d}</span>
                    {showStar && (
                      <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-md z-20"
                      >
                        <Star size={12} className="text-yellow-400 fill-yellow-400 md:w-4 md:h-4" />
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* คำอธิบายสัญลักษณ์ */}
          <div className="mt-8 pt-6 border-t border-border/50 flex justify-between items-center text-[10px] md:text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-emerald-500 shadow-sm" />
              <span>มีการบันทึกอาหาร</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
              </div>
              <span>ได้รับแต้ม (3 วัน/แบบทดสอบ)</span>
            </div>
          </div>
        </div>

        {/* 🌟 อินโฟกราฟิก 🌟 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-3xl overflow-hidden shadow-lg border border-white/20"
        >
          <img
            src={infographicRewards}
            alt="เงื่อนไขการรับของรางวัล"
            className="w-full h-auto object-contain"
          />
        </motion.div>

      </motion.div>
    </PageLayout>
  );
};

export default Points;
