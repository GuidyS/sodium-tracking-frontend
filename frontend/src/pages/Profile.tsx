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

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

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

  // 🌟 ฟังก์ชันตรวจสอบข้อมูลก่อนบันทึก
  const validateAndSave = async () => {
    const updatedData = { ...editProfile };
    let errorMessages: string[] = [];

    // 1. ตรวจสอบชื่อและอีเมล (ห้ามว่าง)
    if (!updatedData.full_name?.trim()) errorMessages.push("กรุณากรอกชื่อ-นามสกุล");
    if (!updatedData.email?.trim()) errorMessages.push("กรุณากรอกอีเมล");

    // 2. ตรวจสอบ อายุ (ห้ามว่าง, ต่ำกว่า 1)
    if (updatedData.age === null || updatedData.age === "" || Number(updatedData.age) < 1) {
      errorMessages.push("อายุต้องไม่ต่ำกว่า 1 ปี");
    }

    // 3. ตรวจสอบ ส่วนสูง (ห้ามว่าง, ต่ำกว่า 100)
    if (updatedData.height_cm === null || updatedData.height_cm === "" || Number(updatedData.height_cm) < 100) {
      errorMessages.push("ส่วนสูงต้องไม่ต่ำกว่า 100 cm");
    }

    // 4. ตรวจสอบ น้ำหนัก (ห้ามว่าง, ต่ำกว่า 10)
    if (updatedData.weight_kg === null || updatedData.weight_kg === "" || Number(updatedData.weight_kg) < 10) {
      errorMessages.push("น้ำหนักต้องไม่ต่ำกว่า 10 kg");
    }

    // หากมี Error ให้แจ้งเตือนและหยุดการบันทึก
    if (errorMessages.length > 0) {
      toast({
        title: "ข้อมูลไม่ถูกต้อง",
        description: errorMessages[0],
        variant: "destructive"
      });
      return;
    }

    // 5. จัดการเรื่องเพศ (ถ้าว่างให้เป็น "ไม่ระบุเพศ")
    if (!updatedData.gender || updatedData.gender === "") {
      updatedData.gender = "ไม่ระบุเพศ";
    }

    handleSave(updatedData);
  };

 const handleSave = async (dataToSave: typeof editProfile) => {
  try {
    // 🌟 ดึง User จาก LocalStorage มาเพื่อเอา ID
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    
    // 🌟 แนบ user_id เข้าไปใน Object ที่จะส่งไป Save
    const dataWithId = { ...dataToSave, user_id: savedUser.user_id };

    const response = await api.post("/index.php?page=edit-profile", dataWithId);
    if (response.data.status === "success") {
      setProfile(dataToSave);
      setIsEditing(false);
      toast({ title: "บันทึกสำเร็จ", description: "ข้อมูลของคุณได้รับการอัปเดตแล้ว" });
    }
  } catch (error: any) {
    // ...
  }
};

  const handleChangePassword = async () => {
  // 1. ตรวจสอบว่ากรอกข้อมูลหรือยัง
  if (!currentPassword || !newPassword) {
    toast({
      title: "กรุณากรอกข้อมูลให้ครบถ้วน",
      description: "กรุณากรอกทั้งรหัสผ่านปัจจุบันและรหัสผ่านใหม่",
      variant: "destructive",
    });
    return;
  }

  try {
    // 2. ยิง API ไปที่ Backend (index.php พร้อมส่ง query page)
    const response = await api.post("/index.php?page=change-password", {
      currentPassword: currentPassword,
      newPassword: newPassword,
    });

    // 3. เช็คผลลัพธ์จาก Backend
    if (response.data.status === "success") {
      toast({
        title: "สำเร็จ!",
        description: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว",
      });
      // ล้างช่องกรอกข้อมูล
      setCurrentPassword("");
      setNewPassword("");
    } else {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: response.data.message || "รหัสผ่านปัจจุบันไม่ถูกต้อง",
        variant: "destructive",
      });
    }
  } catch (error: any) {
    console.error("Error:", error);
    toast({
      title: "เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว",
      description: error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
      variant: "destructive",
    });
  }
};

  const handleLogout = async () => {
    try { await api.post("/index.php?page=logout"); } catch (e) {}
    localStorage.removeItem("user");
    navigate("/");
  };

  const genderOptions = ["ชาย", "หญิง", "ไม่ระบุเพศ"];

  return (
    <PageLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="p-2 rounded-full hover:bg-muted"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="font-heading text-2xl font-bold">โปรไฟล์</h1>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center shadow-inner">
            <UserCircle className="h-16 w-16 text-primary" />
          </div>
          <p className="font-heading text-lg font-bold">{profile.full_name}</p>
        </div>

        {/* Info Card */}
        <div className="glass-card rounded-3xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-base font-bold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> ข้อมูลทั่วไป
            </h2>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-xl transition-all hover:bg-primary/20">
                <Edit3 className="h-3.5 w-3.5" /> แก้ไข
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setIsEditing(false); setEditProfile(profile); }} className="text-xs font-bold text-muted-foreground px-3">ยกเลิก</button>
                <button onClick={validateAndSave} className="flex items-center gap-1.5 text-xs font-bold bg-primary text-white px-4 py-2 rounded-xl shadow-lg shadow-primary/30">
                  <Save className="h-3.5 w-3.5" /> บันทึก
                </button>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="grid gap-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">ชื่อ-นามสกุล</label>
                <input disabled={!isEditing} type="text" value={isEditing ? editProfile.full_name : profile.full_name} onChange={(e) => setEditProfile({ ...editProfile, full_name: e.target.value })} className="w-full mt-1 bg-secondary/30 border-transparent rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 disabled:opacity-70 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">อีเมล</label>
                <input disabled={!isEditing} type="email" value={isEditing ? editProfile.email : profile.email} onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })} className="w-full mt-1 bg-secondary/30 border-transparent rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 disabled:opacity-70 transition-all" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">เพศ</label>
              {isEditing ? (
                <div className="relative mt-1">
                  <select value={editProfile.gender} onChange={(e) => setEditProfile({ ...editProfile, gender: e.target.value })} className="w-full appearance-none bg-secondary/30 border-transparent rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50">
                    <option value="">เลือกเพศ</option>
                    {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              ) : (
                <div className="mt-1 bg-secondary/10 rounded-2xl px-4 py-3 text-sm font-medium">{profile.gender || "ไม่ระบุเพศ"}</div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">อายุ</label>
                <input disabled={!isEditing} type="number" value={isEditing ? (editProfile.age === 0 ? "" : editProfile.age) : (profile.age === 0 ? "-" : profile.age)} onChange={(e) => setEditProfile({ ...editProfile, age: e.target.value === "" ? "" as any : Number(e.target.value) })} className="w-full mt-1 bg-secondary/30 border-transparent rounded-2xl px-4 py-3 text-sm text-center" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">สูง (cm)</label>
                <input disabled={!isEditing} type="number" value={isEditing ? (editProfile.height_cm === 0 ? "" : editProfile.height_cm) : (profile.height_cm === 0 ? "-" : profile.height_cm)} onChange={(e) => setEditProfile({ ...editProfile, height_cm: e.target.value === "" ? "" as any : Number(e.target.value) })} className="w-full mt-1 bg-secondary/30 border-transparent rounded-2xl px-4 py-3 text-sm text-center" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">หนัก (kg)</label>
                <input disabled={!isEditing} type="number" value={isEditing ? (editProfile.weight_kg === 0 ? "" : editProfile.weight_kg) : (profile.weight_kg === 0 ? "-" : profile.weight_kg)} onChange={(e) => setEditProfile({ ...editProfile, weight_kg: e.target.value === "" ? "" as any : Number(e.target.value) })} className="w-full mt-1 bg-secondary/30 border-transparent rounded-2xl px-4 py-3 text-sm text-center" />
              </div>
            </div>

            <div className="pt-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 flex items-center gap-1">
                <Users className="h-3 w-3" /> ประเภทผู้ใช้ (เปลี่ยนไม่ได้)
              </label>
              <div className="mt-1 bg-muted/40 border border-dashed border-border rounded-2xl px-4 py-3 text-sm text-muted-foreground font-semibold">
                {profile.user_role}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="glass-card rounded-3xl p-6 shadow-xl border border-white/20">
          <h2 className="font-heading text-base font-bold mb-4 flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> แก้ไขรหัสผ่าน
          </h2>
          <div className="space-y-3">
            <div className="relative">
              <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="รหัสผ่านปัจจุบัน" className="w-full bg-secondary/30 border-transparent rounded-2xl px-4 py-3 text-sm pr-12" />
              <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">{showCurrent ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
            <div className="relative">
              <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="รหัสผ่านใหม่" className="w-full bg-secondary/30 border-transparent rounded-2xl px-4 py-3 text-sm pr-12" />
              <button onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">{showNew ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
            <button onClick={handleChangePassword} className="w-full mt-2 bg-primary text-white font-bold py-3 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95">เปลี่ยนรหัสผ่าน</button>
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-4 text-destructive font-bold text-sm bg-destructive/10 rounded-3xl border border-destructive/20 hover:bg-destructive/20 transition-all">
          <LogOut size={18} /> ออกจากระบบ
        </button>
      </motion.div>
    </PageLayout>
  );
};

export default Profile;
