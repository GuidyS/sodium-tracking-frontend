# 1. เปลี่ยนจาก 18 เป็น 22 (LTS) หรือ 20
FROM node:22-alpine

WORKDIR /app

# 2. Copy package files
COPY package.json package-lock.json* ./

# 3. ลง library ใหม่ (ลบ node_modules เดิมออกด้วย)
RUN npm install

COPY . . 

EXPOSE 5174

CMD ["npm", "run", "dev"]