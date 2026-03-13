import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
        // 'Authorization': `Bearer ${token}` // ถ้ามีระบบ login
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