import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Gift, Trophy, Check, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import StreakCalendar from "@/components/StreakCalendar";
import infographicRewards from "@/assets/infographic-rewards.jpg";
import api from "@/lib/axios";

const Points = () => {
  const navigate = useNavigate();
  const [currentPoints, setCurrentPoints] = useState(0);
  const [pointDates, setPointDates] = useState<number[]>([]); 
  const [trackedDays, setTrackedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. ดึงข้อมูล Profile ล่าสุด
        const userRes = await api.get("/index.php?page=profile");
        // 2. ดึงรายการอาหารทั้งหมดที่เคยบันทึกมาคำนวณดาว
        const logRes = await api.get("/index.php?page=food-log&action=daily_all");

        if (userRes.data.status === "success" && logRes.data.status === "success") {
          const user = userRes.data.data;
          const logs = logRes.data.data || []; 
          
          setCurrentPoints(Number(user.total_points));

          let tempPointDates: number[] = [];
          let tempTrackedDays: Set<number> = new Set();
          
          const now = new Date();
          const currentMonth = now.getMonth(); // เดือนปัจจุบัน (0-11)
          const currentYear = now.getFullYear();

          // --- 🌟 ลอจิกที่ 1: ดาวจากแบบทดสอบ (Real-time ตามวันที่อัปเดต) ---
          // ถ้า Pretest เสร็จแล้ว ให้ดึงวันที่จาก updated_at ของ User มาแสดงดาว
          if (Number(user.pretest_done) === 1) {
            const testDate = new Date(user.updated_at.replace(/-/g, "/"));
            if (testDate.getMonth() === currentMonth && testDate.getFullYear() === currentYear) {
              tempPointDates.push(testDate.getDate());
              tempTrackedDays.add(testDate.getDate());
            }
          }

          // --- 🌟 ลอจิกที่ 2: ดาวจากการบันทึกอาหาร (Real-time ตามวันที่บันทึกจริง) ---
          const sortedLogs = logs.sort((a: any, b: any) => 
            new Date(a.created_at.replace(/-/g, "/")).getTime() - new Date(b.created_at.replace(/-/g, "/")).getTime()
          );

          sortedLogs.forEach((log: any, index: number) => {
            // แยกวันที่ด้วยการ split เพื่อเลี่ยงปัญหา Timezone
            const fullDateStr = log.created_at.split(' ')[0];
            const [y, m, d] = fullDateStr.split('-').map(Number);
            
            // เช็คว่าข้อมูลอยู่ในเดือนและปีปัจจุบันที่กำลังแสดงหรือไม่
            if (m === (currentMonth + 1) && y === currentYear) {
              tempTrackedDays.add(d);

              // ลอจิก: ทุกๆ 3 รายการ ได้ดาว 1 ดวงในวันนั้นๆ
              if ((index + 1) % 3 === 0) {
                tempPointDates.push(d);
              }
            }
          });

          setPointDates([...tempPointDates]);
          setTrackedDays(Array.from(tempTrackedDays));
        }
      } catch (error) {
        console.error("Failed to fetch points data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 pb-10"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/dashboard")} 
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            คะแนนสะสม
          </h1>
        </div>

        {/* Points Display Card */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="relative overflow-hidden rounded-3xl p-8 text-center shadow-2xl"
          style={{ background: "linear-gradient(135deg, #FFB800 0%, #FF8A00 100%)" }}
        >
          <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <p className="text-sm font-medium text-white/90 uppercase tracking-widest">แต้มสะสมปัจจุบัน</p>
            <div className="flex items-baseline justify-center gap-2 mt-1">
              <span className="font-heading text-6xl font-black text-white">
                {loading ? "..." : currentPoints.toLocaleString()}
              </span>
              <span className="text-xl font-bold text-white/80">แต้ม</span>
            </div>
          </div>
        </motion.div>

        {/* Streak Calendar Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-6 shadow-xl border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
              ตารางสะสมแต้ม
            </h2>
            <div className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full uppercase">
              {new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' }).format(new Date())}
            </div>
          </div>
          
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground italic">
              กำลังคำนวณข้อมูล...
            </div>
          ) : (
            <StreakCalendar 
              trackedDays={trackedDays} 
              pointDates={pointDates} 
              currentMonth={new Date()} // 🌟 เลื่อนเดือนตามเวลาปัจจุบันจริง
            />
          )}
          
          <div className="mt-4 flex items-center gap-4 text-[10px] text-muted-foreground border-t pt-4 border-border/50">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-primary/30" /> มีการบันทึก
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /> ได้รับดาว (แต้ม)
            </div>
          </div>
        </motion.div>

        {/* Rewards Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            <h2 className="font-heading text-2xl font-bold text-foreground text-center">
              เงื่อนไขการรับรางวัล
            </h2>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-3xl overflow-hidden shadow-2xl border border-primary/10"
          >
            <img
              src={infographicRewards}
              alt="Rewards Info"
              className="w-full h-auto object-contain"
            />
          </motion.div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Points;
