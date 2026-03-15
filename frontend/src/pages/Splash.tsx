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
      // 🌟 1. ตรวจสอบข้อมูลจาก URL (กรณีเพิ่ง Redirect กลับจาก Google Login)
      const params = new URLSearchParams(window.location.search);
      const userFromUrl = params.get("user");

      if (userFromUrl) {
        try {
          const userData = JSON.parse(decodeURIComponent(userFromUrl));
          localStorage.setItem("user", JSON.stringify(userData));
          // ล้าง URL ให้สะอาดเพื่อความปลอดภัย
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
          console.error("Error parsing user from URL", e);
        }
      }

      // ดึงข้อมูล User ที่เก็บไว้ในเครื่อง (ถ้ามี)
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

      try {
        // 🌟 2. เรียก API 'me' พร้อมส่ง user_id ไปเป็นแผนสำรอง (เผื่อคุกกี้ Session หลุด)
        const response = await api.get("/index.php?page=me", {
          params: { user_id: savedUser.user_id } 
        });
        
        if (response.data.status === "success") {
          const user = response.data.user;
          // อัปเดตข้อมูลล่าสุดจาก DB ลงในเครื่อง
          localStorage.setItem("user", JSON.stringify(user));
          
          // 🌟 3. ตรวจสอบสถานะการทำ Pretest (เช็คจาก DB โดยตรงจะแม่นยำที่สุด)
          const isPretestDone = user.pretest_done == 1 || user.pretest_done === "1";
          const destination = isPretestDone ? "/dashboard" : "/pretest";
          
          // หน่วงเวลาให้โชว์โลโก้สวยๆ สักครู่
          setTimeout(() => navigate(destination), 2000); 
        } else {
          throw new Error("Invalid session");
        }
      } catch (error) {
        console.error("Verification failed:", error);
        // ถ้าไม่มีข้อมูลผู้ใช้หรือ Session หมดอายุ ให้กลับไปหน้า Login
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
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-card shadow-lg p-2 border border-border/50">
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
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
              <span className="text-primary">Desalt DeNa</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              ติดตามปริมาณโซเดียมของคุณอย่างง่ายดาย
            </p>
          </motion.div>

          {/* Loading dots */}
          <div className="mt-12 flex gap-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                className="h-3 w-3 rounded-full bg-primary"
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Splash;
