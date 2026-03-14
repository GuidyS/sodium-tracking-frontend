import axios from 'axios';

// ลบเครื่องหมาย / ที่อาจจะติดมาตอนท้าย URL ใน Environment Variable
const baseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');

const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    // สำคัญมาก: เพื่อให้เบราว์เซอร์ส่ง Cookie/Session กลับไปที่ Railway
    withCredentials: true 
});

// จัดการการส่งข้อมูล (Interceptors)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // จัดการ Error ส่วนกลาง
        if (error.response) {
            // กรณี Server ตอบกลับมา (เช่น 401, 404, 500)
            console.error(`API Error ${error.response.status}:`, error.response.data);
            
            // ถ้าเป็น 401 (Unauthorized) อาจจะส่ง User กลับไปหน้า Login
            if (error.response.status === 401) {
                // window.location.href = '/login'; 
            }
        } else if (error.request) {
            // กรณีส่ง Request ไปแล้วแต่ไม่มีการตอบกลับ (Network Error / CORS)
            console.error("Network Error: ไม่สามารถติดต่อ Backend ได้", error.request);
        } else {
            console.error("Error:", error.message);
        }
        return Promise.reject(error);
    }
);

export default api;
