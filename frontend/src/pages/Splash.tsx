import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logoCS from "@/assets/logo-cs.png";
import logoPharmacy from "@/assets/logo-pharmacy.png";
import logoNursing from "@/assets/logo-nursing.png";
import logoSSS from "@/assets/logo-sss.png";
import api from "@/lib/axios";

const logos = [
  { src: logoCS, label: "CS Siam U." },
  { src: logoPharmacy, label: "คณะเภสัชศาสตร์" },
  { src: logoNursing, label: "กพย." },
  { src: logoSSS, label: "สสส." },
];

const Splash = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(true);

useEffect(() => {
  const verifyAndPersist = async () => {
    try {
      // ✅ 1. เรียก API 'me' ที่เราเขียนไว้ใน index.php เพื่อเอาข้อมูล User ล่าสุด
      const response = await api.get("/index.php?page=me");
      
      if (response.data.status === "success") {
        // ✅ 2. บันทึกลง localStorage เพื่อให้ครั้งหน้าไม่ต้องล็อกอินใหม่
        localStorage.setItem("user", JSON.stringify(response.data.user));
        
        // ✅ 3. ตรวจสอบว่าทำ Pretest แล้วหรือยัง
        const pretestDone = localStorage.getItem("pretest_done");
        const destination = pretestDone ? "/dashboard" : "/pretest";
        setTimeout(() => navigate(destination), 1500); 
      }
    } catch (error) {
      // ถ้า Session หมดอายุหรือผิดพลาด ให้กลับไปเริ่มใหม่ที่หน้า Login
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  verifyAndPersist();
}, [navigate]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
        >
          {/* Decorative blobs */}
          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
          </div>

          {/* Logo grid */}
          <div className="relative grid grid-cols-2 gap-6 mb-10">
            {logos.map((logo, i) => (
              <motion.div
                key={logo.label}
                initial={{ opacity: 0, scale: 0, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2 + i * 0.15,
                }}
                className="flex flex-col items-center gap-2"
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-card shadow-lg p-2">
                  <img src={logo.src} alt={logo.label} className="h-full w-full object-contain" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {logo.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* App title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="text-center"
          >
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Desalt DeNa
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              ติดตามปริมาณโซเดียมของคุณอย่างง่ายดาย
            </p>
          </motion.div>

          {/* Loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-10 flex gap-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="h-2.5 w-2.5 rounded-full bg-primary"
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Splash;