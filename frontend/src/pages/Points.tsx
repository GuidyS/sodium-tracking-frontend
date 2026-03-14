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
        // 1. ดึงข้อมูล Profile (แต้มรวม และสถานะการทำแบบทดสอบ)
        const userRes = await api.get("/index.php?page=profile");
        // 2. ดึงข้อมูลรายการอาหารทั้งหมดที่เคยบันทึก
        const logRes = await api.get("/index.php?page=food-log&action=daily_all");

        if (userRes.data.status === "success" && logRes.data.status === "success") {
          const user = userRes.data.data;
          const logs = logRes.data.data || []; 
          
          setCurrentPoints(Number(user.total_points));

          let tempPointDates: number[] = [];
          let tempTrackedDays: Set<number> = new Set();
          
          // --- ลอจิกที่ 1: ดาวจากแบบทดสอบ ---
          // สมมติว่า Pretest เริ่มวันที่ 13 มีนาคม 2569
          if (Number(user.pretest_done) === 1) {
            tempPointDates.push(13); 
            tempTrackedDays.add(13);
          }
          // ถ้ามี Posttest (วันที่ 20 เป็นต้นไป)
          if (Number(user.posttest_done) === 1) {
            tempPointDates.push(20); 
            tempTrackedDays.add(20);
          }
          
          // --- ลอจิกที่ 2: ดาวจากการบันทึกอาหารครบทุกๆ 3 รายการ ---
          // เรียงจากเก่าไปใหม่เพื่อคำนวณรอบที่ 3, 6, 9...
          const sortedLogs = logs.sort((a: any, b: any) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );

          sortedLogs.forEach((log: any, index: number) => {
            const date = new Date(log.created_at);
            // ตรวจสอบว่าเป็นเดือนมีนาคม (Index 2) ปี 2026
            if (date.getMonth() === 2 && date.getFullYear() === 2026) {
              const dayOfMonth = date.getDate();
              tempTrackedDays.add(dayOfMonth);

              // ทุกๆ รายการที่ 3, 6, 9... (Modulo 3) จะได้รับ 1 ดาว
              if ((index + 1) % 3 === 0) {
                tempPointDates.push(dayOfMonth);
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
          {/* Background Decor */}
          <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          
          <div className="relative z-10">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <p className="text-sm font-medium text-white/90 uppercase tracking-widest">แต้มทั้งหมดของคุณ</p>
            <div className="flex items-baseline justify-center gap-2 mt-1">
              <span className="font-heading text-6xl font-black text-white drop-shadow-md">
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
            <div className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
              มีนาคม 2026
            </div>
          </div>
          
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground italic">
              กำลังโหลดข้อมูลตาราง...
            </div>
          ) : (
            <StreakCalendar 
              trackedDays={trackedDays} 
              pointDates={pointDates} 
              currentMonth={new Date(2026, 2, 1)} 
            />
          )}
          
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground border-t pt-4 border-border/50">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-primary/30" /> บันทึกอาหาร
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-yellow-400" /> ได้รับแต้ม
            </div>
          </div>
        </motion.div>

        {/* Rewards Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            <h2 className="font-heading text-2xl font-bold text-foreground">
              ของรางวัลและการแลก
            </h2>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-3xl overflow-hidden shadow-2xl border border-primary/10"
          >
            <div className="bg-primary/5 p-4 border-b border-primary/10">
              <p className="text-sm font-medium text-primary text-center">
                สะสมแต้มให้ครบตามเงื่อนไขเพื่อรับของรางวัลสุดพิเศษ!
              </p>
            </div>
            <img
              src={infographicRewards}
              alt="เงื่อนไขการรับของรางวัล"
              className="w-full h-auto object-contain transition-transform hover:scale-[1.02] duration-500"
            />
          </motion.div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Points;
