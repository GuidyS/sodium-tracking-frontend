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
  const [pointDates, setPointDates] = useState<number[]>([]); // เก็บวันที่ที่ได้รับดาว
  const [trackedDays, setTrackedDays] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // 1. ดึงข้อมูล Profile เพื่อดูแต้มรวมและสถานะ Pre/Post test
      const userRes = await api.get("/index.php?page=profile");
      // 2. ดึงข้อมูล Log อาหารทั้งหมดเพื่อมาคำนวณจุดที่เกิดดาว
      const logRes = await api.get("/index.php?page=food-log&action=daily_all"); // สมมติว่ามี Action นี้ดึงทุกรายการ

      if (userRes.data.status === "success" && logRes.data.status === "success") {
        const user = userRes.data.data;
        const logs = logRes.data.data; // ข้อมูล log_items ทั้งหมด
        setCurrentPoints(user.total_points);

        let tempPointDates: number[] = [];
        let tempTrackedDays: Set<number> = new Set();
        
        // --- ลอจิกที่ 1: ดาวจากแบบทดสอบ ---
        if (user.pretest_done) tempPointDates.push(13); // Pretest วันที่ 18
        // หมายเหตุ: สำหรับ Posttest ถ้าคุณไม่ได้เก็บวันที่ทำไว้ อาจจะโชว์ดาวในวันที่ทำจริง
        
        // --- ลอจิกที่ 2: ดาวจากการบันทึกอาหารครบ 3 ครั้ง ---
        // เรียงลำดับ logs ตามเวลาที่บันทึก
        const sortedLogs = logs.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        sortedLogs.forEach((log: any, index: number) => {
          const date = new Date(log.created_at);
          if (date.getMonth() === 2) { // เฉพาะเดือนมีนาคม (Index 2)
            tempTrackedDays.add(date.getDate());
            // ทุกๆ รายการที่ 3, 6, 9... ให้โชว์ดาวในวันนั้น
            if ((index + 1) % 3 === 0) {
              tempPointDates.push(date.getDate());
            }
          }
        });

        setPointDates(tempPointDates);
        setTrackedDays(Array.from(tempTrackedDays));
      }
    };
    fetchData();
  }, []);

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            คะแนนสะสม
          </h1>
        </div>

        {/* Points display */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="rounded-2xl p-6 text-center shadow-lg"
          style={{ background: "linear-gradient(135deg, hsl(45 90% 55%), hsl(25 90% 55%))" }}
        >
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <p className="text-sm text-white/80">แต้มสะสมของคุณ</p>
          <p className="font-heading text-4xl font-bold text-white">
            {currentPoints.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-white/60">แต้ม</p>
        </motion.div>

        {/* Streak tracking table */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-5 shadow-lg"
        >
          <h2 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-destructive" />
            ตารางสะสมแต้ม
          </h2>
          <StreakCalendar trackedDays={trackedDays} pointDates={pointDates} currentMonth={new Date()} />
        </motion.div>

        {/* Rewards */}
        <div className="space-y-3">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            ของรางวัล
          </h1>
          {/* Infographic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-2xl overflow-hidden shadow-lg mb-4"
          >
            <img
              src={infographicRewards}
              alt="เงื่อนไขการรับของรางวัล"
              className="w-full h-auto object-contain"
            />
          </motion.div>

        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Points;
