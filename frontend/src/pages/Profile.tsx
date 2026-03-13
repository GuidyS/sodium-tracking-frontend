import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, UserCircle, Edit3, Save, LogOut, User, Mail, Lock, Eye, EyeOff, ChevronDown, Ruler, Weight, Calendar, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // สร้าง State สำหรับเก็บข้อมูลจริง
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    gender: "",
    age: 0,
    weight_kg: 0,
    height_cm: 0,
    user_role: ""
  });

  const [editProfile, setEditProfile] = useState(profile);

  // 1. ดึงข้อมูลจากฐานข้อมูลเมื่อเข้าหน้า Profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/index.php?page=edit-profile");
        if (response.data.status === "success") {
          setProfile(response.data.data);
          setEditProfile(response.data.data);
        }
      } catch (error) {
        console.error("Fetch profile failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // 2. ฟังก์ชันบันทึกข้อมูลลงฐานข้อมูล
  const handleSave = async () => {
    try {
      const response = await api.post("/index.php?page=edit-profile", editProfile);
      if (response.data.status === "success") {
        setProfile(editProfile);
        setIsEditing(false);
        toast({ title: "บันทึกสำเร็จ", description: "ข้อมูลของคุณได้รับการอัปเดตแล้ว" });
      }
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถบันทึกข้อมูลได้", variant: "destructive" });
    }
  };

  const handleChangePassword = async () => {
    // 1. Validation ขั้นต้น
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "กรุณากรอกข้อมูลให้ครบ", description: "กรุณากรอกรหัสผ่านทุกช่อง", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "รหัสผ่านไม่ตรงกัน", description: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "รหัสผ่านสั้นเกินไป", description: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร", variant: "destructive" });
      return;
    }

    try {
      // 2. เรียก API (ส่ง email ไปเป็นตัวระบุตัวตนตาม logic ของ reset-password.php เดิม)
      const response = await api.post("/index.php?page=reset-password", {
        current_password: currentPassword, // ✅ ส่งรหัสเดิมไปตรวจสอบ
        new_password: newPassword
      });

      if (response.data.status === "success") {
        // 3. ล้างค่าใน Form และแจ้งเตือน
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast({ title: "เปลี่ยนรหัสผ่านสำเร็จ", description: "รหัสผ่านของคุณได้รับการอัปเดตแล้ว" });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "เกิดข้อผิดพลาด";
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMsg || "ไม่สามารถเปลี่ยนรหัสผ่านได้",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    try {
      // ✅ เรียก API เพื่อล้าง Session ที่ฝั่ง Backend
      await api.post("/index.php?page=logout"); 
    } catch (error) {
      console.error("Backend logout failed", error);
    } finally {
      // ✅ ล้างข้อมูลในเครื่องและพาไปหน้าแรก
      localStorage.removeItem("user");
      toast({
        title: "ออกจากระบบ",
        description: "คุณได้ออกจากระบบเรียบร้อยแล้ว",
      });
      navigate("/");
    }
  };

  const genderOptions = ["ชาย", "หญิง", "ไม่ระบุเพศ"];
  const roleOptions = [
    { value: "บุคคลทั่วไป", label: "บุคคลทั่วไป" },
    { value: "อาจารย์", label: "อาจารย์" },
    { value: "นักศึกษา", label: "นักศึกษา" },
  ];

  const fields = [
    { key: "full_name" as const, label: "ชื่อ-นามสกุล", icon: User, type: "text" },
    { key: "email" as const, label: "อีเมล", icon: Mail, type: "email" },
  ];

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
            โปรไฟล์
          </h1>
        </div>

        {/* Avatar section */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 shadow-lg">
            <UserCircle className="h-16 w-16 text-primary" />
          </div>
          <p className="font-heading text-lg font-bold text-foreground">{profile.full_name}</p>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </motion.div>

        {/* Profile fields */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-5 shadow-md"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base font-semibold text-foreground">
              ข้อมูลส่วนตัว
            </h2>
            {!isEditing ? (
              <button
                onClick={() => {
                  setEditProfile(profile);
                  setIsEditing(true);
                }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" />
                แก้ไข
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-xl gradient-btn px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-md"
              >
                <Save className="h-3.5 w-3.5" />
                บันทึก
              </button>
            )}
          </div>

          <div className="space-y-4">
            {fields.map((field, i) => (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1.5">
                  <field.icon className="h-3.5 w-3.5" />
                  {field.label}
                </label>
                {isEditing ? (
                  <input
                    type={field.type}
                    value={editProfile[field.key]}
                    onChange={(e) =>
                      setEditProfile({ ...editProfile, [field.key]: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                ) : (
                  <p className="rounded-xl bg-secondary/30 px-4 py-2.5 text-sm font-medium text-foreground">
                    {profile[field.key]}
                  </p>
                )}
              </motion.div>
            ))}

            {/* Gender */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1.5">
                <Users className="h-3.5 w-3.5" />
                เพศ
              </label>
              {isEditing ? (
                <div className="relative">
                  <select
                    value={editProfile.gender}
                    onChange={(e) => setEditProfile({ ...editProfile, gender: e.target.value })}
                    className="w-full appearance-none rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  >
                    <option value="">เลือกเพศ</option>
                    {genderOptions.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              ) : (
                <p className="rounded-xl bg-secondary/30 px-4 py-2.5 text-sm font-medium text-foreground">
                  {profile.gender || "-"}
                </p>
              )}
            </motion.div>

            {/* Age & Height & Weight */}
            <div className="grid grid-cols-3 gap-3">
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  อายุ
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editProfile.age}
                    onChange={(e) => setEditProfile({ ...editProfile, age: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                ) : (
                  <p className="rounded-xl bg-secondary/30 px-4 py-2.5 text-sm font-medium text-foreground">
                    {profile.age || "-"}
                  </p>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1.5">
                  <Ruler className="h-3.5 w-3.5" />
                  ส่วนสูง (cm)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editProfile.height_cm}
                    onChange={(e) => setEditProfile({ ...editProfile, height_cm: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                ) : (
                  <p className="rounded-xl bg-secondary/30 px-4 py-2.5 text-sm font-medium text-foreground">
                    {profile.height_cm || "-"}
                  </p>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1.5">
                  <Weight className="h-3.5 w-3.5" />
                  น้ำหนัก (kg)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editProfile.weight_kg}
                    onChange={(e) => setEditProfile({ ...editProfile, weight_kg: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                ) : (
                  <p className="rounded-xl bg-secondary/30 px-4 py-2.5 text-sm font-medium text-foreground">
                    {profile.weight_kg || "-"}
                  </p>
                )}
              </motion.div>
            </div>

            {/* User Role */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1.5">
                <Users className="h-3.5 w-3.5" />
                ประเภทผู้ใช้
              </label>
              {isEditing ? (
                <div className="flex gap-3">
                  {roleOptions.map((r) => (
                    <label key={r.value} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                          editProfile.user_role === r.value
                            ? "border-primary bg-primary"
                            : "border-border"
                        }`}
                      >
                        {editProfile.user_role === r.value && (
                          <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={editProfile.user_role === r.value}
                        onChange={(e) => setEditProfile({ ...editProfile, user_role: e.target.value })}
                        className="sr-only"
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-secondary/30 px-4 py-2.5 text-sm font-medium text-foreground">
                  {profile.user_role || "-"}
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-5 shadow-md"
        >
          <h2 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            แก้ไขรหัสผ่าน
          </h2>
          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">รหัสผ่านปัจจุบัน</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านปัจจุบัน"
                  className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {/* New Password */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">รหัสผ่านใหม่</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่"
                  className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {/* Confirm New Password */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">ยืนยันรหัสผ่านใหม่</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              onClick={handleChangePassword}
              className="w-full rounded-xl gradient-btn py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:shadow-lg"
            >
              เปลี่ยนรหัสผ่าน
            </button>
          </div>
        </motion.div>

        {/* Logout button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 py-3.5 text-sm font-semibold text-destructive hover:bg-destructive/20 transition-all"
        >
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </motion.button>
      </motion.div>
    </PageLayout>
  );
};

export default Profile;