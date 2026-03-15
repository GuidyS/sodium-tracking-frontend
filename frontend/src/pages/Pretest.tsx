import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronRight, ChevronLeft, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";

interface Question {
  id: number;
  question: string;
  choices: string[];
  correctIndex: number;
}

const questions: Question[] = [
  {
    id: 1,
    question: "ข้อใดเป็นพฤติกรรมการรับประทานอาหารที่ช่วยลดความเสี่ยงต่อโรคไต",
    choices: [
      "รับประทานอาหารแปรรูปเป็นประจำ",
      "ลดการบริโภคอาหารเค็ม และอ่านฉลากโภชนาการ",
      "เติมน้ำปลาเพิ่มในอาหารทุกมื้อ",
      "รับประทานบะหมี่กึ่งสำเร็จรูปบ่อย",
    ],
    correctIndex: 1,
  },
  {
    id: 2,
    question: "การใช้ยากลุ่มใดต่อไปนี้เป็นเวลานาน อาจเพิ่มความเสี่ยงต่อการเกิดโรคไต",
    choices: [
      "ยาพาราเซตามอล",
      "ยาแก้ปวดกลุ่ม NSAIDs",
      "ยาละลายเสมหะ",
      "ยาลดน้ำมูก",
    ],
    correctIndex: 1,
  },
  {
    id: 3,
    question: "อาหารประเภทใดต่อไปนี้มักเป็นแหล่งโซเดียมสูง ซึ่งอาจเพิ่มความเสี่ยงต่อโรคไตเมื่อบริโภคเป็นประจำ",
    choices: [
      "ผักสดและผลไม้",
      "ข้าวสวย",
      "อาหารแปรรูป น้ำจิ้ม และเครื่องปรุงรส",
      "เนื้อปลา",
    ],
    correctIndex: 2,
  },
  {
    id: 4,
    question: "พฤติกรรมใดต่อไปนี้เป็นพฤติกรรมที่อาจเพิ่มความเสี่ยงต่อการเกิดปัญหาสุขภาพไต",
    choices: [
      "ดื่มน้ำอย่างเพียงพอ และเข้าห้องน้ำทันทีเมื่อปวดปัสสาวะ",
      "ดื่มน้ำน้อย และกลั้นปัสสาวะเป็นเวลานานบ่อยครั้ง",
      "ดื่มน้ำในปริมาณปกติ แต่บางครั้งกลั้นปัสสาวะเมื่อไม่สะดวกเข้าห้องน้ำ",
      "ดื่มน้ำวันละประมาณ 6–8 แก้ว และเข้าห้องน้ำตามปกติ",
    ],
    correctIndex: 1,
  },
  {
    id: 5,
    question: "โรคประจำตัวใดต่อไปนี้ หากควบคุมไม่ดี อาจเพิ่มความเสี่ยงต่อการเกิดโรคไต",
    choices: [
      "เบาหวานและความดันโลหิตสูง",
      "ภูมิแพ้",
      "ไมเกรน",
      "หวัด",
    ],
    correctIndex: 0,
  },
  {
    id: 6,
    question: "การตรวจใดต่อไปนี้สามารถใช้ช่วยคัดกรองการทำงานของไตได้",
    choices: [
      "การตรวจระดับ eGFR และการตรวจปัสสาวะ",
      "การเอกซเรย์ปอด",
      "การตรวจสายตา",
      "การตรวจคลื่นไฟฟ้าหัวใจ",
    ],
    correctIndex: 0,
  },
  {
    id: 7,
    question: "อาการใดต่อไปนี้อาจเป็นสัญญาณของปัญหาการทำงานของไต",
    choices: [
      "ปัสสาวะเป็นฟอง หรือมีอาการบวมที่หน้าและขา",
      "ไอและมีเสมหะ",
      "ปวดท้องหลังรับประทานอาหาร",
      "คัดจมูก",
    ],
    correctIndex: 0,
  },
  {
    id: 8,
    question: "ข้อใดต่อไปนี้เป็นวิธีดูแลสุขภาพไตที่เหมาะสม",
    choices: [
      "รับประทานอาหารเค็มจัดเป็นประจำ",
      "ดื่มน้ำให้เพียงพอ และหลีกเลี่ยงการใช้ยาที่ไม่จำเป็น",
      "กลั้นปัสสาวะบ่อย ๆ",
      "รับประทานอาหารแปรรูปเป็นประจำ",
    ],
    correctIndex: 1,
  },
];

const choiceLabels = ["A", "B", "C", "D"];

const Pretest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(questions.length).fill(null)
  );
  const [submitted, setSubmitted] = useState(false);
  const [direction, setDirection] = useState(1);

  const q = questions[current];

  const score = answers.reduce<number>(
    (acc, ans, i) => acc + (ans === questions[i].correctIndex ? 1 : 0),
    0
  );

  const selectAnswer = (choiceIndex: number) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[current] = choiceIndex;
    setAnswers(newAnswers);
  };

  const goNext = () => {
    if (current < questions.length - 1) {
      setDirection(1);
      setCurrent(current + 1);
    }
  };

  const goPrev = () => {
    if (current > 0) {
      setDirection(-1);
      setCurrent(current - 1);
    }
  };

  const handleSubmit = async () => {
    // 🌟 ดึงข้อมูลล่าสุดจาก localStorage ทุกครั้งที่กดส่ง
    const userData = localStorage.getItem("user");
    if (!userData) {
      toast({
        variant: "destructive",
        title: "กรุณาเข้าสู่ระบบใหม่",
        description: "เซสชันของคุณหมดอายุหรือข้อมูลผู้ใช้หายไป",
      });
      return;
    }
    
    const user = JSON.parse(userData);

    try {
      const res = await api.post("/index.php?page=food-log&action=submit_test", {
        test_type: "pre",
        score: score,
        user_id: user.user_id // ส่ง ID ไปยืนยัน
      });

      if (res.data.status === "success") {
        toast({
          title: "บันทึกสำเร็จ",
          description: res.data.message,
        });

        // 🌟 อัปเดตข้อมูลในเครื่องทันที
        const updatedUser = { ...user, pretest_done: 1, updated_at: new Date().toISOString() };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setSubmitted(true);
      } else {
        toast({
          variant: "destructive",
          title: "แจ้งเตือน",
          description: res.data.message,
        });
      }
    } catch (err: any) {
      // จัดการ Error 401 หรือปัญหา Network
      const errMsg = err.response?.data?.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: errMsg,
      });
    }
  };
  
  const handleFinish = () => {
    navigate("/splash");
  };

  const allAnswered = answers.every((a) => a !== null);
  const progress = ((current + 1) / questions.length) * 100;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card rounded-3xl p-8 max-w-md w-full text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="mx-auto w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center"
          >
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </motion.div>

          <h1 className="text-2xl font-bold text-foreground">
            ทำแบบทดสอบเสร็จแล้ว!
          </h1>

          <div className="space-y-2">
            <p className="text-4xl font-bold text-primary">
              {score}/{questions.length}
            </p>
            <p className="text-muted-foreground text-sm">คะแนนที่ได้</p>
          </div>

          <div className="bg-muted/50 rounded-2xl p-4 text-left space-y-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">สรุปผลรายข้อ</p>
            {questions.map((qq, i) => {
              const isCorrect = answers[i] === qq.correctIndex;
              return (
                <div key={qq.id} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground w-5">
                      {i + 1}.
                    </span>
                    <span className={`text-sm font-medium ${isCorrect ? "text-green-600" : "text-destructive"}`}>
                      {isCorrect ? "ถูกต้อง" : "ไม่ถูกต้อง"}
                    </span>
                  </div>
                  {isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                </div>
              );
            })}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleFinish}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-lg shadow-lg hover:bg-primary/90 transition-colors"
          >
            เข้าสู่แอปพลิเคชัน
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">แบบทดสอบ</h2>
            <span className="text-sm text-muted-foreground font-medium">
              {current + 1}/{questions.length}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Question Area */}
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -60, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 space-y-5"
          >
            <div className="glass-card rounded-2xl p-5 border border-primary/10">
              <p className="text-base font-semibold text-foreground leading-relaxed">
                <span className="text-primary font-bold mr-1">ข้อ {q.id}.</span>
                {q.question}
              </p>
            </div>

            <div className="space-y-3">
              {q.choices.map((choice, ci) => {
                const selected = answers[current] === ci;
                return (
                  <motion.button
                    key={ci}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectAnswer(ci)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 flex items-start gap-3 ${
                      selected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {choiceLabels[ci]}
                    </span>
                    <span className="text-sm leading-relaxed pt-1 text-foreground">
                      {choice}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={goPrev}
            disabled={current === 0}
            className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm font-semibold text-foreground bg-muted border border-border disabled:opacity-30 hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            ก่อนหน้า
          </motion.button>

          {current === questions.length - 1 ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              ส่งคำตอบ
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={goNext}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              ถัดไป
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pretest;
