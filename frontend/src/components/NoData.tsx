import { motion } from "framer-motion";

const NoData = ({ message = "ไม่มีข้อมูล" }: { message?: string }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="text-center p-8" // ✅ ใช้แค่ padding ไม่ต้องกำหนด h-full
    >
      <p className="font-heading text-xl font-medium text-muted-foreground/40 select-none">
        {message}
      </p>
    </motion.div>
  );
};

export default NoData;