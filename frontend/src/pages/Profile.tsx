import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, UserCircle, Edit3, Save, LogOut, User, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        // 🌟 1. ดักจับ Error: เช็คว่าในเครื่องมีข้อมูล user ไหม
        const savedUserStr = localStorage.getItem("user");
        if (!savedUserStr) {
          toast({ title: "เซสชั่นหมดอายุ", description: "กรุณาเข้าสู่ระบบใหม่", variant: "destructive" });
          navigate("/");
          return;
        }

        const savedUser = JSON.parse(savedUserStr);
        if (!savedUser.user_id) {
          toast({ title: "ข้อมูลไม่สมบูรณ์", description: "กรุณาเข้าสู่ระบบใหม่อีกครั้ง", variant: "destructive" });
          navigate("/");
          return;
        }

        // 🌟 2. ดึงข้อมูลโปรไฟล์โดยแนบ user_id ไปด้วย
        const response = await api.get(`/index.php?page=edit-profile&user_id=${savedUser.user_id}`);
        
        if (response.data.status === "success") {
          setProfile(response.data.data);
          setEditProfile(response.data.data);
        } else {
          toast({ title: "ดึงข้อมูลล้มเหลว", description: response.data.message, variant: "destructive" });
        }
      } catch (error) {
        console.error("Fetch profile failed", error);
        toast({ title: "การเชื่อมต่อล้มเหลว", description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [navigate, toast]);

  const validateAndSave = async () => {
    const updatedData = { ...editProfile };
    let errorMessages: string[] = [];

    if (!updatedData.full_name?.trim()) errorMessages.push("กรุณากรอกชื่อ-นามสกุล");
    if (!updatedData.email?.trim()) errorMessages.push("กรุณากรอกอีเมล");
    if (!updatedData.age || Number(updatedData.age) < 1) errorMessages.push("อายุต้องไม่ต่ำกว่า 1 ปี");
    if (!updatedData.height_cm || Number(updatedData.height_cm) < 100) errorMessages.push("ส่วนสูงต้องไม่ต่ำกว่า 100 cm");
    if (!updatedData.weight_kg || Number(updatedData.weight_kg) < 10) errorMessages.push("น้ำหนักต้องไม่ต่ำกว่า 10 kg");

    if (errorMessages.length > 0) {
      toast({ title: "ข้อมูลไม่ถูกต้อง", description: errorMessages[0], variant: "destructive" });
      return;
    }

    handleSave(updatedData);
  };

  const handleSave = async (dataToSave: typeof editProfile) => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      // 🌟 3. แนบ user_id ไปกับข้อมูลตอนอัปเดต
      const dataWithId = { ...dataToSave, user_id: savedUser.user_id };

      const response = await api.post("/index.php?page=edit-profile", dataWithId);
      if (response.data.status === "success") {
        setProfile(dataToSave);
        setIsEditing(false);
        toast({ title: "บันทึกสำเร็จ", description: "ข้อมูลของคุณได้รับการอัปเดตแล้ว" });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้";
      toast({ title: "เกิดข้อผิดพลาด", description: errorMsg, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    try { await api.post("/index.php?page=logout"); } catch (e) {}
    localStorage.removeItem("user");
    navigate("/");
  };

  const genderOptions = ["ชาย", "หญิง", "ไม่ระบุเพศ"];

  // 🌟 ป้องกันการโชว์เลข 0 ตอนที่กำลังโหลดข้อมูล
  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <p className="text-muted-foreground animate-pulse font-bold">กำลังโหลดข้อมูลโปรไฟล์...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="p-2 rounded-full hover:bg-muted"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="font-heading text-2xl font-bold">โปรไฟล์</h1>
        </div>

        <div className="flex flex-col items-center gap-3 py-4">
          <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center shadow-inner">
            <UserCircle className="h-16 w-16 text-primary" />
          </div>
          <p className="font-heading text-lg font-bold">{profile.full_name}</p>
        </div>

        <div className="glass-card rounded-3xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-base font-bold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> ข้อมูลทั่วไป
            </h2>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-xl">แก้ไข</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setIsEditing(false); setEditProfile(profile); }} className="text-xs font-bold text-muted-foreground px-3">ยกเลิก</button>
                <button onClick={validateAndSave} className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold">บันทึก</button>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">ชื่อ-นามสกุล</label>
              <input disabled={!isEditing} type="text" value={isEditing ? editProfile.full_name : profile.full_name} onChange={(e) => setEditProfile({ ...editProfile, full_name: e.target.value })} className="w-full mt-1 bg-secondary/30 border-transparent rounded-2xl px-4 py-3 text-sm disabled:opacity-70" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">อีเมล</label>
              <input disabled={!isEditing} type="email" value={isEditing ? editProfile.email : profile.email} onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })} className="w-full mt-1 bg-secondary/30 border-transparent rounded-2xl px-4 py-3 text-sm disabled:opacity-70" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">เพศ</label>
              {isEditing ? (
                <select value={editProfile.gender} onChange={(e) => setEditProfile({ ...editProfile, gender: e.target.value })} className="w-full mt-1 bg-secondary/30 border-transparent rounded-2xl px-4 py-3 text-sm">
                  <option value="">เลือกเพศ</option>
                  {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              ) : (
                <div className="mt-1 bg-secondary/10 rounded-2xl px-4 py-3 text-sm font-medium">{profile.gender || "ไม่ระบุเพศ"}</div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 text-center block">อายุ</label>
                <input disabled={!isEditing} type="number" value={isEditing ? editProfile.age : profile.age} onChange={(e) => setEditProfile({ ...editProfile, age: Number(e.target.value) })} className="w-full mt-1 bg-secondary/30 border-transparent rounded-2xl px-4 py-3 text-sm text-center" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 text-center block">สูง (cm)</label>
                <input disabled={!isEditing} type="number" value={isEditing ? editProfile.height_cm : profile.height_cm} onChange={(e) => setEditProfile({ ...editProfile, height_cm: Number(e.target.value) })} className="w-full mt-1 bg-secondary/30 border-transparent rounded-2xl px-4 py-3 text-sm text-center" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 text-center block">หนัก (kg)</label>
                <input disabled={!isEditing} type="number" value={isEditing ? editProfile.weight_kg : profile.weight_kg} onChange={(e) => setEditProfile({ ...editProfile, weight_kg: Number(e.target.value) })} className="w-full mt-1 bg-secondary/30 border-transparent rounded-2xl px-4 py-3 text-sm text-center" />
              </div>
            </div>
            <div className="pt-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 flex items-center gap-1"><Users className="h-3 w-3" /> ประเภทผู้ใช้ (เปลี่ยนไม่ได้)</label>
              <div className="mt-1 bg-muted/40 border border-dashed border-border rounded-2xl px-4 py-3 text-sm text-muted-foreground font-semibold uppercase">{profile.user_role}</div>
            </div>
          </div>
        </div>

        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-4 text-destructive font-bold text-sm bg-destructive/10 rounded-3xl border border-destructive/20">
          <LogOut size={18} /> ออกจากระบบ
        </button>
      </motion.div>
    </PageLayout>
  );
};

export default Profile;
