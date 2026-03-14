import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Droplets, User, Lock, Mail, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const genderOptions = ["ชาย", "หญิง", "อื่นๆ"];
  const roleOptions = [
    { value: "general", label: "บุคคลทั่วไป" },
    { value: "teacher", label: "อาจารย์" },
    { value: "student", label: "นักศึกษา" },
  ];

  const navigate = useNavigate();
  const { toast } = useToast();

  const checkPasswordStrength = (pwd: string) => {
    const lengthCriteria = pwd.length >= 4;
    return {
      isValid: lengthCriteria,
    };
  };

  const roleMap: Record<string, string> = {
    general: "บุคคลทั่วไป",
    teacher: "อาจารย์",
    student: "นักศึกษา",
  };

  // Reset form state when switching between login and register
  useEffect(() => {
    setErrorMsg("");
    // Login fields
    setUsername("");
    setPassword("");
    // Register fields
    setFullName("");
    setEmail("");
    setGender("");
    setAge("");
    setWeight("");
    setHeight("");
    setRegPassword("");
    setConfirmPassword("");
    setRole("");
  }, [isLogin]);

  // คำนวณสถานะรหัสผ่านแบบ Real-time
  const passwordStatus = checkPasswordStrength(regPassword);
  const isPasswordMatch = regPassword === confirmPassword && confirmPassword !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    // ✅ 1. กำหนดรูปแบบอีเมลที่ถูกต้อง (Regex)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (isLogin) {
      // สำหรับ Login
      try {
        // ✅ (ตัวเลือก) เพิ่มการตรวจสอบรูปแบบอีเมลตอน Login ด้วย
        if (!emailRegex.test(username)) {
          setErrorMsg("รูปแบบอีเมลไม่ถูกต้อง");
          return;
        }

        const response = await api.post("/index.php?page=login", {
          email: username,
          password: password,
        });

        if (response.data.status === "success") {
          const user = response.data.user;
          localStorage.setItem("user", JSON.stringify(response.data.user));

          if (user.pretest_done === 0) {
            navigate("/pretest");
          } else {
            navigate("/splash");
          }
        }
      } catch (error: any) {
        const message = error.response?.data?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
        setErrorMsg(message);
      }

    } else {
      // ✅ 2. สำหรับ Register Validation
      if (!fullName || !email || !gender || !age || !weight || !height || !regPassword || !confirmPassword || !role) {
        setErrorMsg("กรุณากรอกข้อมูลให้ครบทุกช่อง");
        return;
      }

      if (!emailRegex.test(email)) {
        setErrorMsg("กรุณาสมัครสมาชิกด้วย @gmail.com เท่านั้น");
        return;
      }

      if (!genderOptions.includes(gender)) {
        setErrorMsg("กรุณาเลือกเพศให้ถูกต้อง");
        return;
      }

      if (!age || isNaN(Number(age)) || Number(age) < 1 || Number(age) > 100) {
        setErrorMsg("กรุณากรอกอายุให้ถูกต้อง (1-100)");
        return;
      }

      if (!height || isNaN(Number(height)) || Number(height) < 100) {
        setErrorMsg("กรุณากรอกส่วนสูงให้ถูกต้อง (อย่างน้อย 100 cm)");
        return;
      }

      if (!weight || isNaN(Number(weight)) || Number(weight) < 30) {
        setErrorMsg("กรุณากรอกน้ำหนักให้ถูกต้อง (อย่างน้อย 30 kg)");
        return;
      }

      if (!passwordStatus.isValid) {
        setErrorMsg("กรุณาตั้งรหัสผ่านให้มีความยาวอย่างน้อย 4 ตัวอักษร");
        return;
      }

      if (!isPasswordMatch) {
        setErrorMsg("ยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
        return;
      }

      // Register API Call
      try {
        const response = await api.post("/index.php?page=register", {
          full_name: fullName,
          email: email,
          password: regPassword, // ✅ ใช้ regPassword ตาม state ที่คุณตั้งไว้
          gender: gender,
          age: age,
          weight_kg: weight,
          height_cm: height,
          user_role: roleMap[role] || "บุคคลทั่วไป", // ✅ แมพค่าเป็นภาษาไทยตาม DB
        });

        if (response.data.status === "success") {
          setIsLogin(true); // เมื่อสมัครเสร็จ ให้สลับไปหน้า Login
          toast({
            title: "สมัครสมาชิกสำเร็จ!",
            description: "กรุณาเข้าสู่ระบบ",
          });
        }
      } catch (error: any) {
        const message = error.response?.data?.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก";
        setErrorMsg(message);
      }
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
        {/* Logo & Title */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-btn shadow-lg"
          >
            <Droplets className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Sodium Tracking
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            ติดตามปริมาณโซเดียมของคุณอย่างง่ายดาย
          </p>
        </div>

        {/* Tab switcher */}
        <div className="mb-6 flex rounded-2xl bg-secondary p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 ${
              isLogin
                ? "gradient-btn text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 ${
              !isLogin
                ? "gradient-btn text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            สมัครสมาชิก
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Username */}
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    placeholder="อีเมล"
                    value={username}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUsername(value);
                      
                      // ✅ ตรวจสอบถ้าถูกต้องให้ล้าง Error ทันที
                      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
                      if (emailRegex.test(value)) {
                        setErrorMsg("");
                      }
                    }}
                    autoComplete="email"
                    className={`${inputClass} pl-11`}
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="รหัสผ่าน"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className={`${inputClass} pl-11 pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Full Name */}
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="ชื่อ - นามสกุล"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`${inputClass} pl-11`}
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="อีเมล"
                    value={email}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEmail(value);
                      
                      // ✅ ถ้าพิมพ์ถูกรูปแบบ @gmail.com แล้ว ให้ข้อความ Error หายไป
                      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
                      if (emailRegex.test(value)) {
                        setErrorMsg("");
                      }
                    }}
                    autoComplete="email"
                    className={`${inputClass} pl-11`}
                  />
                </div>

                {/* Gender, Age, Weight/Height row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-border bg-card/50 py-3 pl-3 pr-8 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                    >
                      <option value="">เพศ</option>
                      {genderOptions.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                  <input
                    type="number"
                    placeholder="อายุ"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="1"
                    max="100"
                    className="w-full rounded-xl border border-border bg-card/50 py-3 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                  />
                  <input
                    type="number"
                    placeholder="ส่วนสูง (cm)"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    min="100"
                    className="w-full rounded-xl border border-border bg-card/50 py-3 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                  />
                  <input
                    type="number"
                    placeholder="น้ำหนัก (kg)"
                    value={weight}
                    min="30"
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card/50 py-3 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="รหัสผ่าน"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    autoComplete="current-password"
                    className={`${inputClass} pl-11`}
                  />
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="ยืนยันรหัสผ่าน"
                    value={confirmPassword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setConfirmPassword(value);
                      
                      // ✅ ถ้าแก้จนรหัสผ่านตรงกับช่องแรกแล้ว ให้ล้าง Error
                      if (value === regPassword) {
                        setErrorMsg("");
                      }
                    }}
                    autoComplete="new-password"
                    className={`${inputClass} pl-11`}
                  />
                </div>

                {/* Role selection */}
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">ประเภทผู้ใช้</p>
                  <div className="flex gap-3">
                    {roleOptions.map((r) => (
                      <label
                        key={r.value}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-2 text-sm text-foreground"
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                            role === r.value
                              ? "border-primary bg-primary"
                              : "border-border"
                          }`}
                        >
                          {role === r.value && (
                            <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <input
                          type="radio"
                          name="role"
                          value={r.value}
                          checked={role === r.value}
                          onChange={(e) => setRole(e.target.value)}
                          className="sr-only"
                        />
                        {r.label}
                      </label>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forgot password */}
          {isLogin && (
            <div className="text-right">
              <button onClick={() => navigate("/forgot-password")} type="button" className="text-xs text-primary hover:underline">
                ลืมรหัสผ่าน?
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm text-destructive"
            >
              {errorMsg}
            </motion.div>
          )}

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full rounded-xl gradient-btn py-3.5 font-heading text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:shadow-xl"
          >
            {isLogin ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </motion.button>

          {/* Divider + Google Login (login tab only) */}
          {isLogin && (
            <>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">หรือ</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  // ให้วิ่งไปที่หน้า PHP ที่คุณทำโลจิก Google ไว้
                  window.location.href = "http://localhost:8888/index.php?page=google-callback"; 
                }}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card py-3.5 font-medium text-foreground shadow-sm transition-all hover:bg-secondary"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                เข้าสู่ระบบด้วย Google
              </motion.button>
            </>
          )}
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Sodium Tracking © 2026
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
