import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL, // เปลี่ยนชื่อให้ตรงกับที่ตั้งใน Vercel
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // จัดการ Error ส่วนกลาง เช่น Token หมดอายุ
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default api;
