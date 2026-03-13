import { motion } from "framer-motion";
import { UtensilsCrossed, BookOpen, Pill, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "@/lib/axios";
import NoData from "@/components/NoData";

const features = [
  { icon: UtensilsCrossed, label: "กรอกข้อมูลอาหาร", path: "/food-log", bg: "bg-[hsl(30,90%,55%)]" },
  { icon: BookOpen, label: "แนะนำรายการอาหาร", path: "/food-recommend", bg: "bg-[hsl(255,60%,65%)]" },
  { icon: Pill, label: "ยาและสมุนไพรที่มีความเสี่ยงต่อไต", path: "/medicine", bg: "bg-[hsl(170,60%,55%)]" },
  { icon: Star, label: "คะแนนสะสม", path: "/points", bg: "bg-[hsl(40,80%,60%)]" },
];

// ✅ ตัวแปลงวันที่เป็นชื่อย่อวันไทย
const dayMapping: Record<number, string> = {
  0: "อา.", 1: "จ.", 2: "อ.", 3: "พ.", 4: "พฤ.", 5: "ศ.", 6: "ส."
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [chartData, setChartData] = useState<any[]>([]);

  // 1. ดึงข้อมูลและตรวจสอบ
  const userString = localStorage.getItem("user");
  const userData = userString ? JSON.parse(userString) : null;

  // ✅ 2. ดึงข้อมูลรายสัปดาห์จริงจาก API
  useEffect(() => {
    const userString = localStorage.getItem("user");
    const userData = userString ? JSON.parse(userString) : null;

    // ✅ ถ้ามี User แต่ยังไม่ทำ Pretest ให้เด้งกลับไปหน้าแบบทดสอบ
    if (userData && userData.pretest_done === 0) {
      navigate("/pretest", { replace: true });
      return;
    }

    const fetchWeeklyData = async () => {
      try {
        const res = await api.get("/index.php?page=food-log&action=weekly");
        if (res.data.status === "success") {
          const formatted = res.data.data.map((item: any) => {
            const date = new Date(item.log_date);
            return {
              day: dayMapping[date.getDay()], // แปลงวันที่เป็น จ., อ. ...
              sodium: Number(item.total_sodium_daily)
            };
          });
          setChartData(formatted);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };
    fetchWeeklyData();
  }, [navigate]);

  // 2. ถ้าไม่มีข้อมูล ให้เด้งกลับไปหน้า Login (ป้องกันหน้าขาว)
  if (!userData) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
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
              {/* ✅ เปลี่ยนมาใช้ chartData จาก API */}
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                  formatter={(value: number) => [`${value.toLocaleString()} mg`, "โซเดียม"]}
                />
                <Bar dataKey="sodium" radius={[4, 4, 0, 0]} fill="hsl(30, 90%, 55%)" />
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
