# 📱 Phone Koi (Antigravity)

**Phone Koi** is a premium, AI-powered IMEI verification and mobile security platform. It allows users to check the status of mobile devices, report thefts, and gain AI-driven insights into device history and risk levels.

## ✨ Features

- **🔍 Smart IMEI Check:** Instant verification of device status (Clean, Reported, Stolen).
- **🤖 AI Insights:** Uses Google Gemini to provide detailed risk assessments and device history analysis.
- **🛡️ Community Reporting:** A decentralized way for users to report lost or stolen devices.
- **📊 Interactive Dashboard:** A cinematic, dark-themed dashboard for managing device alerts and history.
- **🔐 Secure Auth:** Integrated with Supabase and Firebase for robust user authentication.
- **⚡ High Performance:** Built with Next.js 16 (Turbopack) and NestJS for a lightning-fast experience.

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4, Framer Motion (Animations)
- **State Management:** Zustand, React Query
- **Icons:** Lucide React

### Backend
- **Framework:** NestJS
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Caching/Task Queue:** Redis & BullMQ
- **AI:** Google Generative AI (Gemini)

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- PostgreSQL & Redis

### Installation

1. **Clone the repo:**
   ```bash
   git clone https://github.com/Sabbir-123/phoneKoi.git
   cd phoneKoi
   ```

2. **Setup Infrastructure:**
   ```bash
   docker-compose up -d
   ```

3. **Backend Setup:**
   ```bash
   cd antigravity-backend
   cp .env.example .env # Update with your credentials
   npm install
   npx prisma db push
   npm run start:dev
   ```

4. **Frontend Setup:**
   ```bash
   cd ../antigravity-frontend
   cp .env.local.example .env.local # Update with your credentials
   npm install
   npm run dev
   ```

## 📄 License
This project is UNLICENSED.
