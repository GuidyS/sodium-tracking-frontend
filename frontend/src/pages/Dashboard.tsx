import { motion } from "framer-motion";
import { UtensilsCrossed, BookOpen, Pill, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "@/lib/axios";

const features = [
  { icon: UtensilsCrossed, label: "กรอกข้อมูลอาหาร", path: "/food-log", bg: "bg-[hsl(30,90%,55%)]" },
  { icon: BookOpen, label: "แนะนำรายการอาหาร", path: "/food-recommend", bg: "bg-[hsl(255,60%,65%)]" },
  { icon: Pill, label: "ยาและสมุนไพรที่มีความเสี่ยงต่อไต", path: "/medicine", bg: "bg-[hsl(170,60%,55%)]" },
  { icon: Star, label: "คะแนนสะสม", path: "/points", bg: "bg-[hsl(40,80%,60%)]" },
];

const dayMapping: Record<number, string> = {
  0: "อา.", 1: "จ.", 2: "อ.", 3: "พ.", 4: "พฤ.", 5: "ศ.", 6: "ส."
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [chartData, setChartData] = useState<any[]>([]);

  // ดึงข้อมูล User
  // 1. ใช้ useState เก็บ userData เพื่อให้ React ติดตามการเปลี่ยนแปลงได้
  const [userData, setUserData] = useState<any>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {

    if (!userData) {
      navigate("/login", { replace: true });
      return;
    }
    
    if (userData && userData.pretest_done === 0) {
      navigate("/pretest", { replace: true });
      return;
    }

    const fetchWeeklyData = async () => {
      try {
        // ดึงข้อมูล user_id จาก localStorage เพื่อใช้เรียก API
        const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const res = await api.get(`/index.php?page=food-log&action=weekly&user_id=${savedUser.user_id}`);
        
        if (res.data.status === "success") {
          const apiData = res.data.data;

          // 🌟 สร้าง Array พื้นฐาน 7 วันล่าสุด (ย้อนหลังจากวันนี้)
          const last7Days = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            
            // Format วันที่ให้เป็น YYYY-MM-DD เพื่อใช้เทียบกับข้อมูลจาก API
            const dateStr = d.toLocaleDateString('en-CA'); 
            
            last7Days.push({
              fullDate: dateStr, // สำหรับเทียบข้อมูล
              dayLabel: dayMapping[d.getDay()],
              displayDate: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }), // เช่น 15 มี.ค.
              dayName: dayMapping[d.getDay()], // เช่น อา.
              sodium: 0 // ค่าเริ่มต้นเป็น 0
            });
          }

          // 🌟 รวมข้อมูลจาก API เข้ากับ Array 7 วันที่สร้างขึ้น
          const mergedData = last7Days.map(baseDay => {
            const match = apiData.find((item: any) => item.log_date === baseDay.fullDate);
            return {
              ...baseDay,
              sodium: match ? Number(match.total_sodium_daily) : 0
            };
          });

          setChartData(mergedData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };
    
    fetchWeeklyData();
  }, [navigate, userData?.user_id, userData?.pretest_done]); // ใส่ dependency ป้องกัน warning

  const needsPosttest = (() => {
      if (!userData || userData.posttest_done !== 0) return false;
      const now = new Date();
      const start = new Date('2026-03-18T00:00:00');
      const end = new Date('2026-03-31T23:59:59');
      return now >= start && now <= end;
    })();

  if (!userData) return null;

  return (
    <PageLayout>

      {/* 🌟 แสดง Banner แจ้งเตือนถ้าถึงเวลาทำ Post-test */}
      {needsPosttest && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[hsl(255,60%,65%)] text-white p-4 rounded-2xl mb-6 shadow-lg flex justify-between items-center"
        >
          <div>
            <p className="font-bold">แบบทดสอบหลังเรียนเปิดแล้ว!</p>
            <p className="text-xs opacity-90">ทำแบบทดสอบเพื่อรับแต้มสะสมเพิ่ม</p>
          </div>
          <button 
            onClick={() => navigate("/posttest")}
            className="bg-white text-[hsl(255,60%,65%)] px-4 py-2 rounded-xl text-sm font-bold shadow-sm"
          >
            ไปทำเลย
          </button>
        </motion.div>
      )}
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="px-1">
          <p className="text-xl font-heading font-medium text-muted-foreground">
            ยินดีต้อนรับ คุณ 
            <span className="ml-1.5 font-bold text-[hsl(155,45%,45%)]">
              {userData.full_name}
            </span> 👋
          </p>
        </div>

        {/* Chart Card */}
        <div className="glass-card rounded-2xl p-5 shadow-lg">
          <h2 className="font-heading text-lg font-semibold text-foreground">ปริมาณโซเดียม</h2>
          <p className="mb-4 text-xs text-muted-foreground">รายสัปดาห์(mg)</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis 
                  dataKey="dayLabel" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }} 
                />
                <YAxis hide domain={[0, 'auto']} />
                {/* ✅ 2. ปรับแต่ง Tooltip ให้แสดงทั้ง วันที่ และ วันในสัปดาห์ */}
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-xl border border-border/50">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{data.displayDate}</p>
                          <p className="font-heading font-bold text-sm text-foreground">{data.dayName}</p>
                          <p className="text-primary font-black mt-1 text-lg">
                            {data.sodium.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">mg</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="sodium" radius={[6, 6, 0, 0]} fill="hsl(30, 90%, 55%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.button
                key={feature.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(feature.path)}
                className="glass-card flex flex-col items-center gap-3 rounded-2xl p-6 shadow-md transition-shadow hover:shadow-lg"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bg} shadow-md`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <span className="font-heading text-sm font-semibold text-foreground">
                  {feature.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Dashboard;
