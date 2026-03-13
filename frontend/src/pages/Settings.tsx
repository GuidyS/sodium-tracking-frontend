import { motion } from "framer-motion";
import { ArrowLeft, Sun, Moon, Info, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import PageLayout from "@/components/PageLayout";

const Settings = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

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
            ตั้งค่า
          </h1>
        </div>

        {/* Theme Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-5 shadow-md"
        >
          <h2 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sun className="h-5 w-5 text-primary" />
            ธีมการแสดงผล
          </h2>
          <div className="flex rounded-2xl bg-secondary p-1">
            <button
              onClick={() => setIsDark(false)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                !isDark
                  ? "gradient-btn text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="h-4 w-4" />
              สว่าง
            </button>
            <button
              onClick={() => setIsDark(true)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                isDark
                  ? "gradient-btn text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon className="h-4 w-4" />
              มืด
            </button>
          </div>
        </motion.div>

        {/* About App */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-5 shadow-md"
        >
          <h2 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            เกี่ยวกับแอป
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ชื่อแอป</span>
              <span className="text-sm font-semibold text-foreground font-body italic">Sodium Tracking</span>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">เวอร์ชัน</span>
              <span className="text-sm font-semibold text-foreground">1.0.0</span>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">พัฒนาโดย</span>
              <span className="text-sm font-semibold text-foreground">โครงงาน คณะเภสัชศาสตร์</span>
            </div>
            <div className="border-t border-border" />
            <p className="text-xs text-muted-foreground text-center pt-2 flex items-center justify-center gap-1">
              สร้างด้วย <Heart className="h-3 w-3 text-destructive" /> เพื่อสุขภาพที่ดีของคุณ
            </p>
          </div>
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

export default Settings;
