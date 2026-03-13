import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Droplets, Lock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo-pharmacy.png";
import api from "@/lib/axios";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrorMsg(""); // ✅ ล้างข้อความ Error ทุกครั้งที่กดปุ่ม

  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

  // ✅ เปลี่ยนจาก toast เป็น setErrorMsg
  if (!email || !newPassword || !confirmPassword) {
    setErrorMsg("กรุณากรอกข้อมูลให้ครบทุกช่อง");
    return;
  }

  if (!emailRegex.test(email)) {
    setErrorMsg("รูปแบบอีเมลต้องเป็น @gmail.com เท่านั้น");
    return;
  }

  if (newPassword !== confirmPassword) {
    setErrorMsg("ยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
    return;
  }

  setIsLoading(true);
  try {
    const response = await api.post("/index.php?page=reset-password", {
      email: email,
      new_password: newPassword, 
    });

    if (response.data.status === "success") {
      // ✅ สำหรับความสำเร็จ (Success) ยังแนะนำให้ใช้ toast เพื่อให้ผู้ใช้รู้ว่าผ่านแล้ว
      toast({ title: "สำเร็จ", description: response.data.message });
      navigate("/"); 
    }
  } catch (error: any) {
    const message = error.response?.data?.message || "เกิดข้อผิดพลาด";
    setErrorMsg(message); // ✅ แสดง Error จาก Backend ในหน้าจอ
  } finally {
    setIsLoading(false);
  }
};

  const inputClass =
    "w-full rounded-xl border border-border bg-card/50 py-3 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-card relative w-full max-w-md rounded-3xl p-8 shadow-2xl"
      >
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปหน้าเข้าสู่ระบบ
        </button>

        {/* Logo & Title */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-btn shadow-lg"
          >
            <img src={logo} alt="SSRU Logo" className="h-16 w-auto object-contain" />
          </motion.div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            ลืมรหัสผ่าน
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            กรอกอีเมลที่ใช้สมัครสมาชิก เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้คุณ
          </p>
        </div>

        {!isSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ช่องอีเมลเดิม */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="อีเมลของคุณ"
                value={email}
                onChange={(e) => {
                  const value = e.target.value;
                  setEmail(value);
                  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
                  if (emailRegex.test(value)) setErrorMsg(""); // ✅ ล้าง Error เมื่อเมลถูก
                }}
                className={`${inputClass} pl-11`}
              />
            </div>

            {/* ✅ เพิ่มช่องรหัสผ่านใหม่ */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="รหัสผ่านใหม่"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`${inputClass} pl-11`}
              />
            </div>

            {/* ✅ เพิ่มช่องยืนยันรหัสผ่าน */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="ยืนยันรหัสผ่านใหม่"
                value={confirmPassword}
                onChange={(e) => {
                  const value = e.target.value;
                  setConfirmPassword(value);
                  if (value === newPassword) setErrorMsg(""); // ✅ ล้าง Error เมื่อรหัสตรงกัน
                }}  
                className={`${inputClass} pl-11`}
              />
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-sm text-destructive"
              >
                {errorMsg}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl gradient-btn py-3.5 font-heading text-lg font-semibold text-primary-foreground shadow-lg transition-all"
            >
              {isLoading ? "กำลังดำเนินการ..." : "รีเซ็ตรหัสผ่านทันที"}
            </motion.button>
          </form>
        ) : (
          <motion.div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">
                รีเซ็ตรหัสผ่านสำเร็จ!
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                คุณสามารถใช้รหัสผ่านใหม่เข้าสู่ระบบได้ทันที
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="w-full rounded-xl gradient-btn py-3 text-sm font-semibold text-primary-foreground"
            >
              ไปหน้าเข้าสู่ระบบ
            </button>
          </motion.div>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Sodium Tracking © {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;